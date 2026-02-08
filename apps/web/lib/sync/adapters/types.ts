import type { ReviewItem } from "@repo/shared";

export interface IngestResult {
    items: Partial<ReviewItem>[];
    errors: string[];
}
