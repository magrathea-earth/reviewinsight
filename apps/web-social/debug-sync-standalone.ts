import { PrismaClient } from "@prisma/client";
import { ApifyClient } from "apify-client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from apps/web/.env
dotenv.config({ path: path.resolve(__dirname, ".env") });

const prisma = new PrismaClient();

async function runDebugSync() {
    console.log("🚀 STARTING DEBUG SYNC (Standalone Mode)");
    console.log("   Loading env from:", path.resolve(__dirname, ".env"));
    console.log("   APIFY_API_TOKEN:", process.env.APIFY_API_TOKEN ? "✅ FOUND" : "❌ MISSING");

    if (!process.env.APIFY_API_TOKEN) {
        console.error("❌ Cannot proceed without APIFY_API_TOKEN");
        return;
    }

    const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

    // 1. Get Project 'd'
    const project = await prisma.project.findFirst({
        where: { name: "d" },
        include: { sources: true }
    });

    if (!project) {
        console.error("❌ Project 'd' not found");
        return;
    }

    console.log(`✅ Found Project: ${project.name}`);

    // 2. Process Sources
    for (const source of project.sources) {
        console.log(`\n--------------------------------------------------`);
        console.log(`Processing Source: ${source.platform} (ID: ${source.id})`);

        try {
            if (source.platform === "X") {
                await processX(source, apify);
            } else if (source.platform === "INSTAGRAM") {
                await processInstagram(source, apify);
            } else {
                console.log("   Skipping (only debugging X/Instagram)");
            }
        } catch (e: any) {
            console.error(`❌ Error processing source:`, e.message);
        }
    }
}

async function processX(source: any, client: ApifyClient) {
    const config = source.config as any;
    const query = config.query || "";
    let username = query;
    if (query.includes("x.com/") || query.includes("twitter.com/")) {
        const match = query.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/);
        if (match) username = match[1];
    }
    username = username.replace("@", "").trim();
    console.log(`   Target User: @${username}`);

    const variations = [
        {
            name: "quacker/twitter-scraper (standard)",
            actor: "quacker/twitter-scraper",
            input: {
                searchTerms: [`from:${username}`],
                tweetsDesired: 5,
                proxyConfig: { useApifyProxy: true }
            }
        },
        {
            name: "apidojo/tweet-scraper",
            actor: "apidojo/tweet-scraper",
            input: {
                startUrls: [`https://twitter.com/${username}`],
                maxTweets: 5
            }
        },
        {
            name: "vdv/twitter-scraper",
            actor: "vdv/twitter-scraper",
            input: {
                searchTerms: [`from:${username}`],
                tweetsDesired: 5
            }
        }
    ];

    for (const v of variations) {
        console.log(`\n   👉 Testing Variation: ${v.name}`);
        try {
            const run = await client.actor(v.actor).call(v.input);
            console.log(`      Run ID: ${run.id}`);

            if (run.defaultDatasetId) {
                const { items } = await client.dataset(run.defaultDatasetId).listItems();
                console.log(`      Found ${items.length} items (raw)`);

                // Validate items are real tweets
                const validItems = items.filter((i: any) => i.full_text || i.text);

                if (validItems.length > 0) {
                    console.log(`      ✅ SUCCESS! Found ${validItems.length} valid tweets.`);
                    console.log(`      First item:`, JSON.stringify(validItems[0]).substring(0, 100));
                    return; // Stop after first success
                } else {
                    console.log(`      ⚠️  Items invalid (e.g. No Results). Trying next...`);
                    if (items.length > 0) console.log(`      Sample invalid item:`, JSON.stringify(items[0]).substring(0, 100));
                }
            }
        } catch (e: any) {
            console.log(`      ❌ Failed: ${e.message.split('\n')[0]}`);
        }
    }

    console.log(`\n   ❌ All variations failed for X adapter.`);
}

async function processInstagram(source: any, client: ApifyClient) {
    const config = source.config as any;
    const urls = config.postUrls || [];
    console.log(`   Config URLs: ${urls.join(", ")}`);

    // Extract Username
    let username = urls[0] || "";
    if (username.includes("instagram.com/")) {
        const parts = username.split("/");
        const idx = parts.findIndex(p => p.includes("instagram.com"));
        if (idx !== -1 && parts[idx + 1]) username = parts[idx + 1];
    }
    username = username.replace("@", "").split("?")[0];
    console.log(`   Target User: @${username}`);

    // Run Actor
    console.log(`   🚀 Calling Actor: apify/instagram-scraper`);
    const run = await client.actor("apify/instagram-scraper").call({
        usernames: [username],
        resultsLimit: 5,
        searchType: "posts",
    });

    console.log(`   ✅ Actor Run Finished! Run ID: ${run.id}`);

    if (run.defaultDatasetId) {
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`   ✅ Found ${items.length} items in dataset`);
    }
}

runDebugSync().catch(console.error).finally(() => prisma.$disconnect());
