const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testXAdapter() {
    let apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) {
        try {
            const envPath = path.resolve(__dirname, 'apps/web/.env');
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                const match = content.match(/SERPAPI_API_KEY=(.+)/);
                if (match) apiKey = match[1].trim();
            }
        } catch (e) { }
    }

    if (!apiKey || apiKey === "your_serpapi_key_here") {
        console.error("❌ SERPAPI_API_KEY missing");
        return;
    }

    console.log(`🔎 Testing X (SerpApi) for query: "site:twitter.com @nike" ...\n`);

    try {
        const response = await axios.get("https://serpapi.com/search.json", {
            params: {
                engine: "google",
                q: 'site:twitter.com "@nike"',
                api_key: apiKey,
                num: 5
            }
        });

        if (response.data.error) {
            console.error(`❌ SerpApi Error: ${response.data.error}`);
            return;
        }

        const results = response.data.organic_results || [];
        console.log(`✅ SerpApi Success! Found ${results.length} results.`);
        if (results.length > 0) {
            console.log("   First Result:", results[0].title);
            console.log("   Link:", results[0].link);
        }

    } catch (error) {
        console.error("❌ Request failed:", error.response?.data?.error || error.message);
    }
}

testXAdapter();
