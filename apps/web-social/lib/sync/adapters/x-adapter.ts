import type { Platform, ReviewItem } from "@repo/shared";
import type { IngestResult } from "./types";
import axios from "axios";
import { parseRelativeDate } from "../utils/date-parser";

export class XAdapter {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.SERPAPI_API_KEY || "";
    }

    async fetchMentions(query: string, since?: Date): Promise<IngestResult> {
        console.log(`[XAdapter] Fetching X content for query: ${query} via SerpApi`);

        if (!this.apiKey || this.apiKey === "your_serpapi_key_here") {
            console.warn("SerpApi key not set");
            return { items: [], errors: ["SerpApi key not configured"] };
        }

        try {
            // Clean the query - extract username from URL if provided
            let cleanedQuery = query.trim();
            if (cleanedQuery.includes("x.com/") || cleanedQuery.includes("twitter.com/")) {
                const urlMatch = cleanedQuery.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/);
                if (urlMatch && urlMatch[1]) {
                    cleanedQuery = urlMatch[1];
                }
            }

            const isHandle = cleanedQuery.startsWith("@") || (!cleanedQuery.includes(" ") && !cleanedQuery.includes("http"));

            if (!isHandle) {
                // Fallback for keyword searches (not profile sync)
                const q = `site:x.com "${cleanedQuery}" OR site:twitter.com "${cleanedQuery}"`;
                return await this.simpleSearch(q, "", since);
            }

            const username = cleanedQuery.replace("@", "").trim();
            return await this.fetchUserMentions(username, since);

        } catch (error: any) {
            console.error("SerpApi X search error:", error.response?.data || error.message);
            return { items: [], errors: [error.message] };
        }
    }
    /**
     * Account-centric search:
     * Search for mentions/replies to @username, then filter out the user's own posts.
     * This avoids relying on Google's indexing of "Replying to" pages (often missing).
     */
    private async fetchUserMentions(username: string, since?: Date): Promise<IngestResult> {
        console.log(`\n[X ADAPTER] Mention/Reply search for @${username}`);
        const allItems: Partial<ReviewItem>[] = [];

        try {
            const mentionsQuery = `site:x.com OR site:twitter.com "@${username}" -from:${username}`;
            const mentionsResponse = await axios.get("https://serpapi.com/search", {
                params: {
                    engine: "google",
                    q: mentionsQuery,
                    api_key: this.apiKey,
                    num: 30,
                    tbs: "qdr:m"
                }
            });

            const results = mentionsResponse.data.organic_results || [];
            console.log(`[X ADAPTER] Found ${results.length} mention results for @${username}`);

            for (const [index, r] of results.entries()) {
                const link = r.link || r.url || "";
                const title = r.title || "";
                const snippet = r.snippet || "";

                // Skip the user's own posts
                if (link.includes(`/${username}/status`)) continue;

                let author = "One of your followers";
                const authorMatch = title.match(/(.+) \(@([a-zA-Z0-9_]+)\)/);
                if (authorMatch) author = `@${authorMatch[2]}`;

                let createdAt = new Date();
                if (r.date) createdAt = parseRelativeDate(r.date);
                if (since && createdAt < since) continue;

                allItems.push({
                    externalId: link || `x_${username}_${Date.now()}_${index}`,
                    platform: "X" as Platform,
                    text: snippet || title,
                    rating: 0,
                    author,
                    createdAt,
                    url: link
                });
            }

            console.log(`[X ADAPTER] Completed. Found ${allItems.length} total items.`);
            return { items: allItems, errors: [] };
        } catch (error: any) {
            console.error("Mention search failed:", error.message);
            return { items: [], errors: [error.message] };
        }
    }

    private async simpleSearch(q: string, username: string, since?: Date): Promise<IngestResult> {
        // ... (Existing simple search implementation, mostly for keyword monitoring)
        const response = await axios.get("https://serpapi.com/search", {
            params: {
                engine: "google",
                q: q,
                api_key: this.apiKey,
                num: 20,
                tbs: "qdr:m"
            }
        });

        const results = response.data.organic_results || [];
        const items: Partial<ReviewItem>[] = results.map((r: any) => ({
            externalId: r.link || `x_${Math.random()}`,
            platform: "X" as Platform,
            text: r.snippet || "",
            rating: 0,
            author: "Combined Search Result",
            createdAt: r.date ? parseRelativeDate(r.date) : new Date(),
            url: r.link
        })).filter(item => !since || (item.createdAt && item.createdAt >= since));

        return { items, errors: [] };
    }
}

