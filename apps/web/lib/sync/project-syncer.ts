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
        // User requested Gemini 2.5 Flash
        const model = "gemini-2.5-flash";
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

                // STRICT 30-DAY HARD CAP: Drop any review older than 30 days
                const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

                const validItems = result.items
                    .filter(item => item.externalId && item.text)
                    .filter(item => {
                        if (!item.createdAt) return false; // drop if no date at all
                        return new Date(item.createdAt) >= cutoff;
                    })
                    .map(item => ({
                        ...item,
                        projectId,
                        platform: source.platform,
                        text: item.text!,
                        fetchedAt: new Date()
                    }));

                const dropped = result.items.length - validItems.length;
                console.log(`[ProjectSyncer] ${validItems.length} items within 30-day window, ${dropped} dropped (too old or no date)`);

                if (validItems.length > 0) {
                    console.log(`[ProjectSyncer] Bulk inserting ${validItems.length} items...`);
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

        const prompt = `You are helping a product team understand what their users are saying in plain, simple English.

COMPLAINTS (what users are unhappy about):
${poorItems.map(i => `- ${i.text}`).join("\n")}

PRAISE (what users love):
${goodItems.map(i => `- ${i.text}`).join("\n")}

Your job: Summarize this feedback so a non-technical founder can instantly read and understand it. Rules:
- Use simple, everyday words. No jargon.
- Summaries must be 1-2 short sentences max.
- Bullet titles must be 3-5 words, like a news headline.
- Bullet details must explain the problem in plain English, as if talking to a friend.
- Suggestions must be one clear action sentence starting with a verb, like "Add a way to..." or "Fix the issue where..."
- Count must be the rough number of users mentioning that theme.

Return ONLY a JSON object:
{
  "score": 85,
  "criticisms": {
    "summary": "Short 1-2 sentence summary of the main complaints in plain English.",
    "bullets": [
      {
        "title": "Short Theme Title",
        "details": "Plain English explanation of what users are complaining about and why it matters.",
        "count": 12,
        "examples": ["exact quote from a review", "another quote"]
      }
    ],
    "suggestions": [
      "Fix the login screen so users don't get logged out unexpectedly.",
      "Add a way to recover a deleted item."
    ]
  },
  "praises": {
    "summary": "Short 1-2 sentence summary of what users love, in plain English.",
    "bullets": [
      {
        "title": "Short Praise Title",
        "details": "Plain English description of what users are happy about.",
        "count": 20,
        "examples": ["exact quote from a review"]
      }
    ]
  }
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
