import { LemonsqueezyClient } from "lemonsqueezy.ts";

const apiKey = process.env.LEMONSQUEEZY_API_KEY!;

if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY is missing from environment variables");
}

export const lemonSqueezy = new LemonsqueezyClient(apiKey);
