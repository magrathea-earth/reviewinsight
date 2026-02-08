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
            return await this.fetchUserReplies(username, since);

        } catch (error: any) {
            console.error("SerpApi X search error:", error.response?.data || error.message);
            return { items: [], errors: [error.message] };
        }
    }

    /**
     * 2-STEP PROCESS:
     * 1. Discovery: Find user's own posts (timeline)
     * 2. Collection: Find replies to those specific posts
     */
    private async fetchUserReplies(username: string, since?: Date): Promise<IngestResult> {
        console.log(`\n[X ADAPTER] 2-Step Sync for @${username}`);
        const allItems: Partial<ReviewItem>[] = [];
        const errors: string[] = [];

        // STEP 1: DISCOVERY - Get User's Own Posts
        console.log(`[Step 1] Fetching @${username}'s posts from last 30 days...`);
        const postsQuery = `site:x.com/${username}/status OR site:twitter.com/${username}/status`;

        try {
            const timelineResponse = await axios.get("https://serpapi.com/search", {
                params: {
                    engine: "google",
                    q: postsQuery,
                    api_key: this.apiKey,
                    num: 20, // Fetch top 20 recent posts
                    tbs: "qdr:m" // Past month only
                }
            });

            const userPosts = timelineResponse.data.organic_results || [];
            console.log(`✅ Found ${userPosts.length} posts by @${username}`);

            if (userPosts.length === 0) {
                return { items: [], errors: ["No recent posts found for user"] };
            }

            // STEP 2: COLLECTION - Get Replies for each post
            console.log(`[Step 2] Fetching replies to these ${userPosts.length} posts...`);

            // Limit to 10 posts to avoid excessive API calls/time per sync
            const postsToScrape = userPosts.slice(0, 10);

            for (const [index, post] of postsToScrape.entries()) {
                const link = post.link || "";
                const postIdMatch = link.match(/status\/(\d+)/);

                if (!postIdMatch) continue;

                const postId = postIdMatch[1];
                console.log(`   [${index + 1}/${postsToScrape.length}] Checking replies for post ${postId}...`);

                try {
                    // Start searching for replies
                    // Query: "{postId}" "Replying to @{username}"
                    // This is specific to Google's indexing of X replies
                    const repliesQuery = `"${postId}" "Replying to @${username}"`;

                    const repliesResponse = await axios.get("https://serpapi.com/search", {
                        params: {
                            engine: "google",
                            q: repliesQuery,
                            api_key: this.apiKey,
                            num: 20 // Get up to 20 replies per post
                        }
                    });

                    const replies = repliesResponse.data.organic_results || [];

                    for (const r of replies) {
                        const replyLink = r.link || "";

                        // Filter out the user's OWN replies/threads
                        if (replyLink.includes(`/${username}/status`)) {
                            continue;
                        }

                        // Parse author from Title or Snippet
                        // Format often: "Reply to @JohnDeere" or "User (@handle) on X: ..."
                        let author = "One of your followers";
                        const title = r.title || "";

                        // Try to extract handle from title
                        // "Bob (@bob123) on X: ..."
                        const authorMatch = title.match(/(.+) \(@([a-zA-Z0-9_]+)\)/);
                        if (authorMatch) {
                            author = `@${authorMatch[2]}`;
                        }

                        // Date parsing
                        let createdAt = new Date();
                        if (r.date) {
                            createdAt = parseRelativeDate(r.date);
                        }

                        if (since && createdAt < since) continue;

                        allItems.push({
                            externalId: replyLink,
                            platform: "X" as Platform,
                            text: r.snippet || title,
                            rating: 0,
                            author: author,
                            createdAt: createdAt,
                            url: replyLink,
                            metadata: {
                                parentPostId: postId,
                                parentPostUrl: link
                            }
                        });
                    }

                    // Respectful delay between calls
                    await new Promise(r => setTimeout(r, 500));

                } catch (err: any) {
                    console.error(`   Failed to fetch replies for post ${postId}: ${err.message}`);
                    errors.push(`Post ${postId}: ${err.message}`);
                }
            }

        } catch (error: any) {
            console.error("Step 1 (Discovery) failed:", error.message);
            return { items: [], errors: [error.message] };
        }

        console.log(`[X ADAPTER] Completed. Found ${allItems.length} total replies.`);
        return { items: allItems, errors };
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
