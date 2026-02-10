import * as dotenv from "dotenv";
import * as path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppStoreAdapter, GooglePlayAdapter } from "./lib/sync/adapters";
import { writeFile } from "fs/promises";

type ReviewItem = {
    externalId?: string | null;
    platform?: string;
    text?: string | null;
    rating?: number | null;
    author?: string | null;
    createdAt?: Date | null;
    url?: string | null;
};

type StoreResult = {
    store: "APP_STORE" | "GOOGLE_PLAY";
    reviews: ReviewItem[];
};

type AppConfig = {
    name: string;
    appStoreId: string;
    googlePlayId: string;
};

type GeminiOutput = {
    top_3_critical_bugs: Array<{
        title: string;
        symptoms: string;
        likely_root_cause: string;
        impact: string;
        evidence_examples: string[];
    }>;
    pain_points: string[];
    actionable_fixes: string[];
    cold_dm: string;
};

dotenv.config({ path: path.resolve(__dirname, ".env") });

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GENAI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

const APPS: AppConfig[] = [
    {
        name: "IRCTC Rail Connect",
        appStoreId: "1386197253",
        googlePlayId: "cris.org.in.prs.ima",
    },
    {
        name: "McDonald's (Global)",
        appStoreId: "1217507712",
        googlePlayId: "com.mcdonalds.mobileapp",
    },
    {
        name: "HDFC Bank Mobile",
        appStoreId: "515891771",
        googlePlayId: "com.hdfcbank.android.now",
    },
    {
        name: "Truth Social",
        appStoreId: "1586018825",
        googlePlayId: "com.truthsocial.android.app",
    },
];

const MAX_PER_STORE = 100;
const MIN_TARGET = 50;

function cleanText(input: string | null | undefined): string {
    return (input || "").replace(/\s+/g, " ").trim();
}

function sortByRecency(reviews: ReviewItem[]) {
    return reviews.sort((a, b) => {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bd - ad;
    });
}

async function fetchStoreReviews(app: AppConfig, since: Date): Promise<StoreResult[]> {
    const appStoreAdapter = new AppStoreAdapter();
    const googlePlayAdapter = new GooglePlayAdapter();

    const [appStore, googlePlay] = await Promise.all([
        appStoreAdapter.fetchReviews(app.appStoreId, since),
        googlePlayAdapter.fetchReviews(app.googlePlayId, since),
    ]);

    const appStoreFiltered = sortByRecency(
        (appStore.items || [])
            .filter((r: any) => typeof r.rating === "number" && r.rating <= 2)
            .slice(0, MAX_PER_STORE)
    );

    const googlePlayFiltered = sortByRecency(
        (googlePlay.items || [])
            .filter((r: any) => typeof r.rating === "number" && r.rating <= 2)
            .slice(0, MAX_PER_STORE)
    );

    return [
        { store: "APP_STORE", reviews: appStoreFiltered },
        { store: "GOOGLE_PLAY", reviews: googlePlayFiltered },
    ];
}

async function runGemini(app: AppConfig, allReviews: ReviewItem[]): Promise<GeminiOutput> {
    if (!GENAI_KEY) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is missing in .env");
    }

    const genAI = new GoogleGenerativeAI(GENAI_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const reviewLines = allReviews
        .map((r, idx) => {
            const dateStr = r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "unknown-date";
            return `#${idx + 1} [${r.rating || "?"}★ ${dateStr}] ${cleanText(r.text)}`.trim();
        })
        .filter(Boolean)
        .join("\n");

    const prompt = `You are an analyst for mobile app quality. Analyze ONLY the recent 1-2 star reviews below for "${app.name}".

Goal: Identify the Top 3 Critical Bugs (not generic complaints), plus the deeper "why" behind 1-star ratings, and propose actionable fixes.

Output strict JSON with this exact structure:
{
  "top_3_critical_bugs": [
    {
      "title": "Short bug title",
      "symptoms": "What users experience",
      "likely_root_cause": "Plausible technical cause",
      "impact": "Who it impacts and severity",
      "evidence_examples": ["Short paraphrases from reviews"]
    }
  ],
  "pain_points": ["Why 1-star users are mad (root causes)"],
  "actionable_fixes": ["Specific fix actions for founders"],
  "cold_dm": "A concise, personalized cold DM template for this app"
}

Reviews:
${reviewLines}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    const slice = jsonStart >= 0 && jsonEnd > jsonStart ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;
    const sanitized = slice.replace(/[\u0000-\u001F\u007F]/g, " ");

    try {
        return JSON.parse(sanitized) as GeminiOutput;
    } catch (err) {
        const fixPrompt = `Fix this into valid JSON only. Do not add any commentary or markdown.\n\n${sanitized}`;
        const fixResult = await model.generateContent(fixPrompt);
        const fixText = fixResult.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const fixStart = fixText.indexOf("{");
        const fixEnd = fixText.lastIndexOf("}");
        const fixSlice = fixStart >= 0 && fixEnd > fixStart ? fixText.slice(fixStart, fixEnd + 1) : fixText;
        const fixSanitized = fixSlice.replace(/[\u0000-\u001F\u007F]/g, " ");
        return JSON.parse(fixSanitized) as GeminiOutput;
    }
}

function formatSection(title: string, items: string[]) {
    if (items.length === 0) return `- ${title}: No recurring items found`;
    return items.map((item) => `- ${item}`).join("\n");
}

function buildReportSection(app: AppConfig, storeResults: StoreResult[], gemini: GeminiOutput) {
    const appStoreCount = storeResults.find((s) => s.store === "APP_STORE")?.reviews.length || 0;
    const googlePlayCount = storeResults.find((s) => s.store === "GOOGLE_PLAY")?.reviews.length || 0;
    const totalCount = appStoreCount + googlePlayCount;
    const countNote =
        appStoreCount < MIN_TARGET || googlePlayCount < MIN_TARGET
            ? `Note: Review counts below 50 for one or both stores. App Store=${appStoreCount}, Google Play=${googlePlayCount}.`
            : `Collected ${appStoreCount} (App Store) + ${googlePlayCount} (Google Play) recent 1-2 star reviews.`;

    const bugs = gemini.top_3_critical_bugs
        .slice(0, 3)
        .map((bug, index) => {
            const examples = bug.evidence_examples?.length
                ? `Evidence: ${bug.evidence_examples.join("; ")}`
                : "Evidence: Not provided";
            return [
                `${index + 1}. ${bug.title}`,
                `   - Symptoms: ${bug.symptoms}`,
                `   - Likely root cause: ${bug.likely_root_cause}`,
                `   - Impact: ${bug.impact}`,
                `   - ${examples}`,
            ].join("\n");
        })
        .join("\n");

    return [
        `## ${app.name}`,
        "",
        countNote,
        "",
        "### Current Pain Points",
        formatSection("Pain points", gemini.pain_points),
        "",
        "### Top 3 Critical Bugs",
        bugs || "- No critical bugs detected",
        "",
        "### Actionable Fixes",
        formatSection("Fixes", gemini.actionable_fixes),
        "",
        "### Cold DM Draft",
        gemini.cold_dm,
        "",
    ].join("\n");
}

async function main() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sections: string[] = [];

    for (const app of APPS) {
        console.log(`Fetching reviews for ${app.name}...`);
        const storeResults = await fetchStoreReviews(app, since);
        const allReviews = storeResults.flatMap((s) => s.reviews);

        if (allReviews.length === 0) {
            sections.push(
                [
                    `## ${app.name}`,
                    "",
                    "No 1-2 star reviews fetched within the last 30 days from either store.",
                    "",
                ].join("\n")
            );
            continue;
        }

        console.log(`Running Gemini analysis for ${app.name} (${allReviews.length} reviews)...`);
        const gemini = await runGemini(app, allReviews);
        sections.push(buildReportSection(app, storeResults, gemini));
    }

    const header = [
        "# Competitor Audits Report",
        "",
        `Generated: ${new Date().toISOString()}`,
        "",
    ].join("\n");

    const report = [header, ...sections].join("\n");
    await writeFile(path.resolve(__dirname, "memory/competitor_audits_report.md"), report, "utf8");
    console.log("✅ Report saved to memory/competitor_audits_report.md");
}

main().catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
});
