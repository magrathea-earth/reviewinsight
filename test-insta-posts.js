const { ApifyClient } = require('apify-client');
const fs = require('fs');
const path = require('path');

async function testInstaPosts() {
    let apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
        try {
            const envPath = path.resolve(__dirname, 'apps/web/.env');
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                const match = content.match(/APIFY_API_TOKEN=(.+)/);
                if (match) apiToken = match[1].trim();
            }
        } catch (e) { }
    }

    if (!apiToken) {
        console.error("❌ APIFY_API_TOKEN missing");
        return;
    }

    const client = new ApifyClient({ token: apiToken });
    const username = "nike"; // High volume poster

    console.log(`🔎 Testing Instagram Post Discovery for @${username}...\n`);

    // METHOD A: profile-scraper (Standard)
    try {
        console.log("--- Method A: apify/instagram-profile-scraper (Default) ---");
        const profileRun = await client.actor("apify/instagram-profile-scraper").call({
            usernames: [username],
        });
        const { items: profileItems } = await client.dataset(profileRun.defaultDatasetId).listItems();
        const profile = profileItems[0];
        const latestPosts = profile ? (profile.latestPosts || []) : [];
        console.log(`✅ Method A found ${latestPosts.length} posts in 'latestPosts'`);
        if (latestPosts.length > 0) {
            console.log("   Latest Post:", latestPosts[0].url || latestPosts[0].shortCode);
            console.log("   Oldest Post (in list):", latestPosts[latestPosts.length - 1].url || latestPosts[latestPosts.length - 1].shortCode);
        }
    } catch (e) {
        console.error("❌ Method A failed:", e.message);
    }

    console.log("\n------------------------------------------------\n");

    // METHOD B: instagram-scraper with search
    try {
        console.log("--- Method B: apify/instagram-scraper (Search User) ---");
        const scraperRun = await client.actor("apify/instagram-scraper").call({
            search: username,
            searchType: "user",
            resultsLimit: 15,
        });
        const { items: scraperItems } = await client.dataset(scraperRun.defaultDatasetId).listItems();
        console.log(`✅ Method B found ${scraperItems.length} items`);
    } catch (e) {
        console.error("❌ Method B failed:", e.message);
    }
}

testInstaPosts();
