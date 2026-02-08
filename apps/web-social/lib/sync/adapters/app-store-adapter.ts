import type { Platform, ReviewItem } from "@repo/shared";
import type { IngestResult } from "./types";
import axios from "axios";

export class AppStoreAdapter {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.SERPAPI_API_KEY || "";
    }

    async fetchReviews(input: string, since?: Date): Promise<IngestResult> {
        let appId = input.trim();

        // Extract ID from URL if provided (e.g., https://apps.apple.com/us/app/twitter/id333903271)
        // Matches "id" followed by digits
        const idMatch = input.match(/id(\d+)/);
        if (idMatch) {
            appId = idMatch[1];
        }

        console.log(`Fetching App Store reviews for ${appId} (Input: ${input}) via SerpApi`);

        if (!this.apiKey || this.apiKey === "your_serpapi_key_here") {
            console.warn("SerpApi key not set, returning empty results");
            return { items: [], errors: ["SerpApi key not configured"] };
        }

        try {
            let allReviews: any[] = [];
            let page = 1;
            const MAX_REVIEWS = 100;

            while (allReviews.length < MAX_REVIEWS) {
                console.log(`Fetching App Store reviews page ${page}...`);
                const response = await axios.get("https://serpapi.com/search", {
                    params: {
                        engine: "apple_reviews",
                        product_id: appId,
                        api_key: this.apiKey,
                        page: page, // Use page parameter for pagination
                        num: 10 // Requesting more, though it seems capped at 10-25 per page often
                    }
                });

                const reviews = response.data.reviews || [];
                if (reviews.length === 0) break;

                // Check dates to see if we reached past the 'since' window
                let stopPaging = false;
                if (since) {
                    for (const r of reviews) {
                        const rDate = r.review_date ? new Date(r.review_date) : (r.date ? new Date(r.date) : new Date());
                        if (rDate < since) {
                            stopPaging = true;
                            // We don't break here because we want to include the current batch potentially, 
                            // or just filter later. But we know we don't need *next* page.
                        }
                    }
                }

                allReviews = [...allReviews, ...reviews];

                if (stopPaging) {
                    console.log("Reached reviews older than sync window, stopping pagination.");
                    break;
                }

                // Check if we have a next page
                if (!response.data.serpapi_pagination?.next) break;

                page++;
                // Safety break to avoid infinite loops
                if (page > 10) break;
            }

            console.log(`Found total ${allReviews.length} reviews for App Store ID ${appId}`);

            const items: Partial<ReviewItem>[] = allReviews.map((r: any) => ({
                externalId: r.id || `as_${Math.random()}`,
                platform: "APP_STORE" as Platform,
                text: r.text || r.title || "",
                rating: r.rating || 0,
                author: r.author?.name || r.user_name || "Anonymous",
                createdAt: r.review_date ? new Date(r.review_date) : (r.date ? new Date(r.date) : new Date()),
                url: r.link || `https://apps.apple.com/app/id${appId}`
            }));

            // Deduplicate by externalId just in case
            const uniqueItems = Array.from(new Map(items.map(item => [item.externalId, item])).values())
                .filter(item => {
                    if (!since) return true;
                    return item.createdAt ? item.createdAt >= since : true;
                });

            return { items: uniqueItems, errors: [] };
        } catch (error: any) {
            console.error("SerpApi App Store error:", error.response?.data || error.message);
            return { items: [], errors: [error.message] };
        }
    }
}
