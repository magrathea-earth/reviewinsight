import type { Platform, ReviewItem } from "@repo/shared";
import type { IngestResult } from "./types";
import axios from "axios";

export class GooglePlayAdapter {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.SERPAPI_API_KEY || "";
    }

    async fetchReviews(input: string, since?: Date): Promise<IngestResult> {
        let packageName = input.trim();

        // Extract package name from URL if provided
        if (input.includes("id=")) {
            packageName = input.split("id=")[1].split("&")[0];
        } else if (input.includes("details/")) {
            packageName = input.split("details/")[1].split("/")[0].split("?")[0];
        }

        console.log(`Fetching Google Play reviews for ${packageName} via SerpApi`);

        if (!this.apiKey || this.apiKey === "your_serpapi_key_here") {
            console.warn("SerpApi key not set, returning empty results");
            return { items: [], errors: ["SerpApi key not configured"] };
        }

        try {
            const response = await axios.get("https://serpapi.com/search", {
                params: {
                    no_cache: "true",
                    engine: "google_play_product",
                    store: "apps",
                    product_id: packageName,
                    api_key: this.apiKey,
                    all_reviews: "true",
                    sort: "1", // 1 = Newest, 0 = Helpful
                    num: 100
                }
            });

            console.log("SerpApi Response Keys:", Object.keys(response.data));
            const reviews = response.data.reviews || [];

            if (!response.data.reviews) {
                console.warn("WARNING: 'reviews' key missing in SerpApi response. Full Response:", JSON.stringify(response.data).substring(0, 1000));
            }
            console.log(`Found ${reviews.length} reviews in response`);
            if (reviews.length > 0) {
                console.log(`First review date: ${reviews[0].iso_date || reviews[0].date}`);
            }

            const items: Partial<ReviewItem>[] = reviews.map((r: any) => {
                // Handle various date formats if iso_date is missing
                let createdAt = new Date();
                if (r.iso_date) {
                    createdAt = new Date(r.iso_date);
                } else if (r.date) {
                    // Try parsing "January 21, 2024"
                    const parsed = Date.parse(r.date);
                    if (!isNaN(parsed)) {
                        createdAt = new Date(parsed);
                    } else {
                        console.warn(`Could not parse date: ${r.date}`);
                    }
                }

                return {
                    externalId: r.id || `gp_${Math.random()}`,
                    platform: "GOOGLE_PLAY" as Platform,
                    text: r.snippet || r.text || "",
                    rating: r.rating || 0,
                    author: r.title || "Anonymous",
                    createdAt,
                    url: r.link || `https://play.google.com/store/apps/details?id=${packageName}&reviewId=${r.id}`
                };
            }).filter(item => {
                if (!since) return true;
                return item.createdAt ? item.createdAt >= since : true;
            });

            return { items, errors: [] };
        } catch (error: any) {
            console.error("SerpApi error:", error.response?.data || error.message);
            return { items: [], errors: [error.message] };
        }
    }
}
