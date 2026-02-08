export type Platform = "GOOGLE_PLAY" | "INSTAGRAM" | "X" | "CSV" | "APP_STORE";

export interface ReviewItem {
    id: string;
    projectId: string;
    platform: Platform;
    externalId: string | null;
    url: string | null;
    rating: number | null;
    sentiment: "POS" | "NEU" | "NEG" | null;
    text: string;
    author: string | null;
    createdAt: Date;
    fetchedAt: Date;
    language: string | null;
    metadata: any;
}
