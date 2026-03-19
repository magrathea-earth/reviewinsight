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
        // Use gemini-1.5-flash for fastest stable analysis
        const model = "gemini-1.5-flash";
        this.model = this.genAI.getGenerativeModel({ model });
    }

    static async fullSync(projectId: string) {
        const syncer = new ProjectSyncer();
        await syncer.run(projectId);
    }

    static async ingestOnly(projectId: string) {
        const syncer = new ProjectSyncer();
        await syncer.run(projectId, true);
    }

    static async analyzeOnly(projectId: string) {
        const syncer = new ProjectSyncer();
        await syncer.analyzeProject(projectId);
    }

    async run(projectId: string, ingestionOnly = false) {
        console.log(`[ProjectSyncer] Starting sync requested (ingestionOnly: ${ingestionOnly}) for project ${projectId}`);

        // 1. Atomic Lock Attempt
        const lockResult = await prisma.project.updateMany({
            where: { id: projectId, syncInProgress: false },
            data: { syncInProgress: true, syncStartedAt: new Date() }
        });

        if (lockResult.count === 0) {
            console.warn(`[ProjectSyncer] Sync already in progress for project ${projectId}.`);
            return;
        }

        try {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                include: { sources: true },
            });

            if (!project) throw new Error("Project not found");

            // 4. Ingest Data (Parallel)
            await Promise.all(
                project.sources.map(source => this.ingestSource(source, projectId))
            );

            if (!ingestionOnly) {
                // 5. Run Analysis
                await this.analyzeProject(projectId);
            }
        } finally {
            // 6. Release Lock
            await prisma.project.update({
                where: { id: projectId },
                data: { syncInProgress: false }
            });
            console.log(`[ProjectSyncer] Sync complete (ingestionOnly: ${ingestionOnly}) for project ${projectId}`);
        }
    }

    private async ingestSource(source: any, projectId: string) {
        try {
            await prisma.dataSource.update({
                where: { id: source.id },
                data: { status: "SYNCING" },
            });

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
                console.log(`[ProjectSyncer] Processing ${result.items.length} items for source ${source.id}`);

                // Filter out invalid items first
                const validItems = result.items.filter(item => item.externalId && item.text).map(item => ({
                    ...item,
                    projectId,
                    platform: source.platform,
                    text: item.text!,
                    fetchedAt: new Date()
                }));

                if (validItems.length > 0) {
                    console.log(`[ProjectSyncer] Bulk inserting ${validItems.length} items...`);
                    // Skip duplicates is supported on PostgreSQL
                    await prisma.reviewItem.createMany({
                        data: validItems as any,
                        skipDuplicates: true
                    });
                    console.log(`[ProjectSyncer] ✅ Bulk insert completed for ${source.id}`);
                }
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

        const [poorItems, goodItems] = await Promise.all([
            prisma.reviewItem.findMany({
                where: {
                    projectId,
                    OR: [
                        { rating: { lte: 3 } },
                        { sentiment: "NEG" },
                    ],
                },
                take: 100,
                orderBy: { createdAt: "desc" },
            }),
            prisma.reviewItem.findMany({
                where: {
                    projectId,
                    OR: [
                        { rating: { gte: 4 } },
                        { sentiment: "POS" },
                    ],
                },
                take: 100,
                orderBy: { createdAt: "desc" },
            })
        ]);

        console.log(`[ProjectSyncer] Found ${poorItems.length} poor items and ${goodItems.length} good items for project ${projectId}`);

        if (poorItems.length === 0 && goodItems.length === 0) {
            console.log("[ProjectSyncer] No items to analyze. Skipping analysis.");
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
            console.log(`[ProjectSyncer] Sending analysis request to Gemini model...`);
            const resultResponse = await this.model.generateContent(prompt);
            const responseText = resultResponse.response.text();

            console.log(`[ProjectSyncer] Received analysis response. Processing JSON...`);
            // Helper to clean potential JSON markdown
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

            console.log("[ProjectSyncer] Analysis completed and saved successfully.");
        } catch (e: any) {
            console.error("[ProjectSyncer] Analysis failed:", e);
            // Log full error details for debugging
            if (e.response && e.response.promptFeedback) {
                console.error("[ProjectSyncer] Prompt Feedback:", JSON.stringify(e.response.promptFeedback, null, 2));
            }
        }
    }
}
