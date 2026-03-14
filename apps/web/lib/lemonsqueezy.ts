import { LemonsqueezyClient } from "lemonsqueezy.ts";

const apiKey = process.env.LEMONSQUEEZY_API_KEY;

export const lemonSqueezy = apiKey 
    ? new LemonsqueezyClient(apiKey)
    : null as unknown as LemonsqueezyClient;

if (!apiKey && process.env.NODE_ENV === "production") {
    console.warn("LEMONSQUEEZY_API_KEY is missing. Checkout functionality will not work.");
}
