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
            const query = postUrls.length > 0 ? postUrls[0] : "";
            if (!query) return { items: [], errors: ["No query provided"] };

            let username = query;
            if (query.includes("instagram.com")) {
                const parts = query.split("/");
                const idx = parts.findIndex(p => p.includes("instagram.com"));
                if (idx !== -1 && parts[idx + 1]) {
                    username = parts[idx + 1];
                }
            }
            username = username.replace("@", "").split("?")[0].trim();
            if (!username) return { items: [], errors: ["No username in query"] };

            const accountUsernameLower = username.toLowerCase();
            const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const sinceDate = since && since > cutoff30 ? since : cutoff30;

            // Step 1: Get posts authored BY this account (using profile-scraper as it's most reliable for public data)
            console.log(`[InstagramAdapter] Step 1: Getting posts BY @${username} via apify/instagram-profile-scraper`);

            const profileRun = await this.client.actor("apify/instagram-profile-scraper").call({
                usernames: [username],
            });

            if (!profileRun.defaultDatasetId) {
                return { items: [], errors: ["Instagram profile scraper failed to start"] };
            }

            const { items: profileItems } = await this.client.dataset(profileRun.defaultDatasetId).listItems();
            const profile = Array.isArray(profileItems) && profileItems.length > 0 ? profileItems[0] : null;

            if (!profile) {
                console.warn(`[InstagramAdapter] Profile @${username} not found or private.`);
                return { items: [], errors: ["Profile not found"] };
            }

            let latestPosts: any[] = (profile as any).latestPosts || [];
            console.log(`[InstagramAdapter] Profile scraper found ${latestPosts.length} posts in 'latestPosts'`);

            // Sort by date desc (handle pinned posts which might be out of order)
            latestPosts.sort((a, b) => {
                const da = new Date(a.timestamp || a.date || 0).getTime();
                const db = new Date(b.timestamp || b.date || 0).getTime();
                return db - da;
            });

            const accountPostUrls = new Set<string>();

            for (const p of latestPosts) {
                const postDate = p.timestamp || p.date || p.takenAt;
                if (!postDate) continue;

                if (new Date(postDate) < sinceDate) {
                    // It's an old post, skip it
                    continue;
                }

                // Extract URL
                const url = p.url || p.link || (p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : null);
                if (url) {
                    const normalized = normalizePostUrl(url);
                    if (normalized) {
                        accountPostUrls.add(normalized);
                    }
                }
            }

            const postUrlsList = Array.from(accountPostUrls);
            console.log(`[InstagramAdapter] Identified ${postUrlsList.length} recent posts (since ${sinceDate.toISOString()}) to scrape comments from.`);
            if (postUrlsList.length > 0) {
                console.log(`[InstagramAdapter] Posts: ${postUrlsList.join(", ")}`);
            }

            if (postUrlsList.length === 0) {
                console.log("[InstagramAdapter] No recent posts found in the last 30 days (or profile scraper only returned old pinned posts).");
                return { items: [], errors: [] };
            }

            // Step 2: Get comments on those post URLs only
            // Increase limit to allow for comments across multiple posts
            console.log(`[InstagramAdapter] Step 2: Fetching comments ON those ${postUrlsList.length} posts (apify/instagram-comment-scraper)`);
            const commentsRun = await this.client.actor("apify/instagram-comment-scraper").call({
                directUrls: postUrlsList,
                resultsLimit: 1000,
            });

            const allItems: Partial<ReviewItem>[] = [];

            if (commentsRun.defaultDatasetId) {
                const { items: comments } = await this.client.dataset(commentsRun.defaultDatasetId).listItems();
                const raw = (comments || []) as any[];

                for (const comment of raw) {
                    const author = getCommentAuthor(comment);
                    if (!author) continue;

                    const authorLower = author.replace("@", "").trim().toLowerCase();
                    if (authorLower === accountUsernameLower) continue;
                    if (authorLower === username.toLowerCase()) continue;

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
        const m = u.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
        return m ? `https://www.instagram.com/p/${m[1]}/` : u;
    } catch {
        return url;
    }
}
