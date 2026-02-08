import type { Platform, ReviewItem } from "@repo/shared";
import type { IngestResult } from "./types";

export class MockInstagramAdapter {
    async fetchComments(postUrls: string[], since?: Date): Promise<IngestResult> {
        console.log("[MockInstagramAdapter] Generating mock Instagram comments...");

        const mockComments: Partial<ReviewItem>[] = [
            {
                externalId: "mock_ig_1",
                platform: "INSTAGRAM",
                text: "Love using this product! It's been a game changer for my daily routine. 😍",
                author: "@happy_customer_99",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                rating: 5,
                url: "https://www.instagram.com/p/C_mock_post_1/"
            },
            {
                externalId: "mock_ig_2",
                platform: "INSTAGRAM",
                text: "The shipping was a bit slow, but the quality is top notch.",
                author: "@user_feedback_daily",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                rating: 4,
                url: "https://www.instagram.com/p/C_mock_post_2/"
            },
            {
                externalId: "mock_ig_3",
                platform: "INSTAGRAM",
                text: "Does anyone know how to contact support? I have an issue with my order.",
                author: "@concerned_buyer",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
                rating: 2,
                url: "https://www.instagram.com/p/C_mock_post_3/"
            }
        ];

        // Filter by date if needed
        const filtered = since
            ? mockComments.filter(c => c.createdAt! >= since)
            : mockComments;

        console.log(`[MockInstagramAdapter] Returning ${filtered.length} mock items.`);
        return { items: filtered, errors: [] };
    }
}
