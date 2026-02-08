import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    GooglePlayAdapter,
    AppStoreAdapter
} from "./adapters";
import type { ReviewItem } from "@repo/shared";

export class ProjectSyncer {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
        // Override with GEMINI_MODEL in .env (e.g. GEMINI_MODEL=gemini-2.5-flash)
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        this.model = this.genAI.getGenerativeModel({ model });
    }

    static async sync(projectId: string) {
        const syncer = new ProjectSyncer();
        await syncer.run(projectId);
    }

    async run(projectId: string) {
        console.log(`[ProjectSyncer] Starting sync request for project ${projectId}`);

        // 1. Atomic Lock Attempt: Try to set syncInProgress=true ONLY if currently false
        const lockResult = await prisma.project.updateMany({
            where: {
                id: projectId,
                syncInProgress: false
            },
            data: {
                syncInProgress: true,
                syncStartedAt: new Date()
            }
        });

        // 2. Handle Lock Failure (Already in progress?)
        if (lockResult.count === 0) {
            // Fetch to check if it's stale or just busy
            const projectCheck = await prisma.project.findUnique({
                where: { id: projectId }
            });

            if (!projectCheck) throw new Error("Project not found");

            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            // If stale (started > 5 mins ago), override it
            if (projectCheck.syncInProgress && projectCheck.syncStartedAt && projectCheck.syncStartedAt < fiveMinutesAgo) {
                console.warn(`[ProjectSyncer] Found stale lock for project ${projectId}. Overriding.`);
                await prisma.project.update({
                    where: { id: projectId },
                    data: { syncInProgress: true, syncStartedAt: new Date() }
                });
            } else {
                console.warn(`[ProjectSyncer] Sync already in progress for project ${projectId}. rejecting.`);
                return;
            }
        }

        // 3. Lock Acquired! Now fetch data needed for sync
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { sources: true },
        });

        if (!project) {
            // Should theoretically not happen if updateMany succeeded, but safety first
            await prisma.project.update({ where: { id: projectId }, data: { syncInProgress: false } });
            throw new Error("Project not found after acquiring lock");
        }

        try {
            // 4. Ingest Data
            for (const source of project.sources) {
                await this.ingestSource(source, projectId);
            }

            // 5. Run Analysis
            await this.analyzeProject(projectId);
        } finally {
            // 6. Release Lock
            await prisma.project.update({
                where: { id: projectId },
                data: { syncInProgress: false }
            });
            console.log(`[ProjectSyncer] Sync lock released for project ${projectId}`);
        }
    }

    private async ingestSource(source: any, projectId: string) {
        try {
            await prisma.dataSource.update({
                where: { id: source.id },
                data: { status: "SYNCING" },
            });

            // Artificial "Human-Feel" Delay (1 second)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Only require API keys for platforms that use them (each adapter validates its own key)
            // Determine sync window (Smart Sync)
            // Strategy:
            // 1. Strict Max Limit: Never fetch older than 30 days.
            // 2. Resume: If lastSync exists and is within window, resume from there.
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            let since = thirtyDaysAgo;

            if (source.lastSync) {
                const lastSyncPlusOneSecond = new Date(new Date(source.lastSync).getTime() + 1000);
                if (lastSyncPlusOneSecond > thirtyDaysAgo) {
                    since = lastSyncPlusOneSecond;
                }
            }

            console.log(`[ProjectSyncer] Smart Sync for ${source.platform} (Source ID: ${source.id})`);
            console.log(`[ProjectSyncer] Fetching items strictly NEWER than: ${since.toISOString()}`);

            const config = source.config as any;
            console.log(`[ProjectSyncer] Config for ${source.platform}:`, JSON.stringify(config, null, 2));

            let result;

            if (source.platform === "GOOGLE_PLAY") {
                result = await new GooglePlayAdapter().fetchReviews(config.packageName, since);
            } else if (source.platform === "APP_STORE") {
                result = await new AppStoreAdapter().fetchReviews(config.appId, since);
            }

            console.log(`[ProjectSyncer] Adapter returned:`, result ? `${result.items?.length || 0} items, ${result.errors?.length || 0} errors` : 'null/undefined');

            if (result && result.items.length > 0) {
                console.log(`[ProjectSyncer] Saving ${result.items.length} items for source ${source.id}`);

                for (const item of result.items) {
                    try {
                        // Validate required fields
                        if (!item.externalId) {
                            console.warn(`[ProjectSyncer] Skipping item without externalId:`, item.text?.substring(0, 50));
                            continue;
                        }

                        if (!item.text) {
                            console.warn(`[ProjectSyncer] Skipping item without text:`, item.externalId);
                            continue;
                        }

                        console.log(`[ProjectSyncer] Upserting item: ${item.externalId?.substring(0, 50)}...`);

                        await prisma.reviewItem.upsert({
                            where: {
                                platform_externalId_projectId: {
                                    platform: source.platform,
                                    externalId: item.externalId!,
                                    projectId: projectId,
                                },
                            },
                            create: {
                                ...item,
                                projectId,
                                platform: source.platform,
                                text: item.text!,
                            } as any,
                            update: {
                                ...item,
                                text: item.text!,
                            } as any,
                        });

                        console.log(`[ProjectSyncer] ✅ Saved item: ${item.externalId?.substring(0, 50)}...`);
                    } catch (itemError: any) {
                        console.error(`[ProjectSyncer] ❌ Failed to save item:`, {
                            externalId: item.externalId,
                            error: itemError.message,
                            stack: itemError.stack
                        });
                    }
                }

                console.log(`[ProjectSyncer] Finished processing ${result.items.length} items`);
            } else {
                console.log(`[ProjectSyncer] No items returned from adapter for source ${source.id}`);
            }

            await prisma.dataSource.update({
                where: { id: source.id },
                data: { status: "IDLE", lastSync: new Date() },
            });

        } catch (error) {
            console.error(`[ProjectSyncer] Error syncing source ${source.id}:`, error);
            await prisma.dataSource.update({
                where: { id: source.id },
                data: { status: "ERROR" },
            });
        }
    }

    private async analyzeProject(projectId: string) {
        console.log(`[ProjectSyncer] Starting analysis for project ${projectId}`);

        const poorItems = await prisma.reviewItem.findMany({
            where: {
                projectId,
                OR: [
                    { rating: { lte: 3 } },
                    { sentiment: "NEG" },
                ],
            },
            take: 100,
            orderBy: { createdAt: "desc" },
        });

        const goodItems = await prisma.reviewItem.findMany({
            where: {
                projectId,
                OR: [
                    { rating: { gte: 4 } },
                    { sentiment: "POS" },
                ],
            },
            take: 100,
            orderBy: { createdAt: "desc" },
        });

        if (poorItems.length === 0 && goodItems.length === 0) {
            console.log("[ProjectSyncer] No items to analyze");
            return;
        }

        const prompt = `Analyze customer feedback for a project.
        
        CRITICAL FEEDBACK (Complaints):
        ${poorItems.map(i => `- ${i.text}`).join("\n")}
        
        POSITIVE FEEDBACK (Highlights):
        ${goodItems.map(i => `- ${i.text}`).join("\n")}
        
        Provide:
        1. A general sentiment score (1-100).
        2. "criticisms": { summary: "1-sentence", bullets: [{title, details, count, examples: [string]}], suggestions: ["Short, actionable title like 'Fix Auth Flow'", "Suggestions should be specific"] }
        3. "praises": { summary: "1-sentence", bullets: [{title, details, count, examples: [string]}] }
        
        Return ONLY a JSON object with this structure:
        {
          "score": 85,
          "criticisms": { "summary": "...", "bullets": [...], "suggestions": ["...", "...", "..."] },
          "praises": { "summary": "...", "bullets": [...] }
        }`;

        try {
            const resultResponse = await this.model.generateContent(prompt);
            const responseText = resultResponse.response.text();

            const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const result = JSON.parse(cleaned);

            await prisma.projectAnalysis.create({
                data: {
                    projectId,
                    periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    periodEnd: new Date(),
                    json: {
                        ...result,
                        poorCount: poorItems.length,
                        goodCount: goodItems.length,
                        totalCount: await prisma.reviewItem.count({ where: { projectId } }),
                        platformsBreakdown: {},
                        trend: { label: "Last 30 days", value: 0, direction: "steady" },
                        urgentIssues: [],
                    },
                },
            });

            console.log("[ProjectSyncer] Analysis completed and saved");
        } catch (e) {
            console.error("[ProjectSyncer] Analysis failed:", e);
        }
    }
}
