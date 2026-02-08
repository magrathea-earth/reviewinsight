import type { Platform, ReviewItem } from "@repo/shared";
import type { IngestResult } from "./types";
import { ApifyClient } from "apify-client";

/**
 * Fetches ONLY comments/replies ON the account's posts (from other people).
 * Does NOT fetch replies BY the account (comments the account wrote elsewhere).
 * Uses profile scraper to get posts authored by the account, then comment scraper on those post URLs.
 */
export class InstagramAdapter {
    private client: ApifyClient;

    constructor() {
        this.client = new ApifyClient({
            token: process.env.APIFY_API_TOKEN || "",
        });
    }

    async fetchComments(postUrls: string[], since?: Date): Promise<IngestResult> {
        console.log(`[InstagramAdapter] Fetching REPLIES ON the account's posts only (not replies BY the account)`);

        if (!process.env.APIFY_API_TOKEN) {
            console.warn("APIFY_API_TOKEN not set");
            return { items: [], errors: ["APIFY_API_TOKEN not set"] };
        }

        try {
            const inputUrls = (postUrls || []).map(v => String(v || "").trim()).filter(Boolean);
            const explicitPostUrls = inputUrls.filter(isInstagramPostUrl).map(normalizePostUrl).filter(Boolean);

            const profileInput = inputUrls.find(v => !isInstagramPostUrl(v)) || "";
            let username = profileInput;
            if (profileInput.includes("instagram.com")) {
                const parts = profileInput.split("/");
                const idx = parts.findIndex(p => p.includes("instagram.com"));
                if (idx !== -1 && parts[idx + 1]) {
                    username = parts[idx + 1];
                }
            }
            username = username.replace("@", "").split("?")[0].trim();

            if (!username && explicitPostUrls.length === 0) {
                return { items: [], errors: ["No username or post URLs provided"] };
            }

            const accountUsernameLower = username ? username.toLowerCase() : "";
            const maxPosts = 24;
            const cutoffDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
            const postDateByUrl = new Map<string, Date>();

            // Step 1: Get posts authored BY this account (using profile-scraper as it's most reliable for public data)
            const accountPostUrls = new Set<string>(explicitPostUrls);

            if (username) {
                console.log(`[InstagramAdapter] Step 1: Getting posts BY @${username} via apify/instagram-scraper (searchType: user, resultsType: posts)`);

                // Use instagram-scraper which is more reliable for lists of posts
                const postsRun = await this.client.actor("apify/instagram-scraper").call({
                    search: username,
                    searchType: "user",
                    resultsType: "posts",
                    resultsLimit: 25,
                });

                if (!postsRun.defaultDatasetId) {
                    return { items: [], errors: ["Instagram scraper failed to start"] };
                }

                const { items: postsItems } = await this.client.dataset(postsRun.defaultDatasetId).listItems();
                console.log(`[InstagramAdapter] Scraper found ${postsItems.length} raw posts`);

                const seenUrls = new Set<string>();
                for (const p of postsItems) {
                    const item = p as any;
                    // Check for various date fields
                    const postDate = item.timestamp || item.date || item.takenAt;

                    if (postDate && cutoffDate && new Date(postDate) < cutoffDate) {
                        continue;
                    }

                    const url = item.url || item.link || (item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/` : null);
                    if (url) {
                        const normalized = normalizePostUrl(url);
                        if (normalized && !seenUrls.has(normalized)) {
                            seenUrls.add(normalized);
                            accountPostUrls.add(normalized);
                        }
                    }
                }
            }

            const postUrlsList = Array.from(accountPostUrls);
            console.log(`[InstagramAdapter] Identified ${postUrlsList.length} posts to scrape comments from (profile posts within last 15 days; max ${maxPosts}).`);
            if (postUrlsList.length > 0) {
                console.log(`[InstagramAdapter] Posts: ${postUrlsList.join(", ")}`);
            }

            if (postUrlsList.length === 0) {
                console.log("[InstagramAdapter] No posts found for the account (or profile scraper returned empty results).");
                return { items: [], errors: [] };
            }

            // Step 2: Get comments on those post URLs only
            // Increase limit to allow for comments across multiple posts
            console.log(`[InstagramAdapter] Step 2: Fetching comments ON those ${postUrlsList.length} posts (apify/instagram-comment-scraper)`);
            const commentsRun = await this.client.actor("apify/instagram-comment-scraper").call({
                directUrls: postUrlsList,
            });

            const allItems: Partial<ReviewItem>[] = [];

            if (commentsRun.defaultDatasetId) {
                const { items: comments } = await this.client.dataset(commentsRun.defaultDatasetId).listItems();
                const raw = (comments || []) as any[];

                for (const comment of raw) {
                    const author = getCommentAuthor(comment);
                    if (!author) continue;

                    if (accountUsernameLower) {
                        const authorLower = author.replace("@", "").trim().toLowerCase();
                        if (authorLower === accountUsernameLower) continue;
                        if (authorLower === username.toLowerCase()) continue;
                    }

                    const commentPostUrl = comment.postUrl || comment.url || comment.link || "";
                    const normalizedCommentPost = normalizePostUrl(commentPostUrl);
                    if (normalizedCommentPost && !accountPostUrls.has(normalizedCommentPost)) continue;

                    const createdAt = new Date(comment.timestamp || comment.date || Date.now());
                    if (since && createdAt < since) continue;

                    allItems.push({
                        externalId: String(comment.id),
                        platform: "INSTAGRAM" as Platform,
                        text: comment.text || "",
                        rating: 0,
                        author: author.startsWith("@") ? author : `@${author}`,
                        createdAt,
                        url: commentPostUrl || postUrlsList[0] || "",
                    });
                }
            }

            console.log(`[InstagramAdapter] Returning ${allItems.length} comments (replies ON @${username}'s posts, excluding @${username}'s own replies)`);
            return { items: allItems, errors: [] };
        } catch (error: any) {
            console.error("[InstagramAdapter] Error:", error);
            return { items: [], errors: [error.message || "Unknown Apify error"] };
        }
    }
}

function getCommentAuthor(c: any): string {
    const v = c.ownerUsername || c.owner?.username || c.user?.username || c.username || c.author || "";
    return String(v || "").replace(/^@/, "").trim();
}

function normalizePostUrl(url: string): string {
    if (!url) return "";
    try {
        const u = String(url).trim().replace(/\/$/, "");
        const m = u.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        return m ? `https://www.instagram.com/${m[1]}/${m[2]}/` : u;
    } catch {
        return url;
    }
}

function isInstagramPostUrl(value: string): boolean {
    if (!value) return false;
    return /instagram\.com\/(p|reel|tv)\//i.test(value);
}
