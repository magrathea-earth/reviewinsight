import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

        if (!secret) {
            return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
        }

        // 1. Verify Signature
        const signature = req.headers.get("x-signature");
        const hmac = crypto.createHmac("sha256", secret);
        const digest = hmac.update(body).digest("hex");

        if (!signature || signature !== digest) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = JSON.parse(body);
        const { meta, data } = event;
        const eventName = meta.event_name;

        // 2. Handle Events
        // The custom data we passed during checkout is in `meta.custom_data`
        const customData = meta.custom_data || {};
        const organizationId = customData.organization_id;

        if (!organizationId) {
            console.warn(`[LemonWebhook] No organization_id in custom_data for event ${eventName}`);
            return NextResponse.json({ received: true });
        }

        if (eventName === "subscription_created" || eventName === "subscription_updated") {
            const subscriptionId = data.id;
            const customerId = data.attributes.customer_id;
            const status = data.attributes.status; // 'active', 'past_due', 'paused', 'cancelled', 'expired'

            // Map Lemon Squeezy status to our internal status
            const isPro = status === "active";

            await prisma.organization.update({
                where: { id: organizationId.toString() },
                data: {
                    subscriptionId: subscriptionId.toString(),
                    subscriptionStatus: status,
                    plan: isPro ? "PRO" : "STARTER",
                    stripeCustomerId: customerId.toString(),
                },
            });
            console.log(`[LemonWebhook] Org ${organizationId} updated. Status: ${status}`);
        } else if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
            await prisma.organization.update({
                where: { id: organizationId.toString() },
                data: {
                    subscriptionStatus: 'canceled',
                    plan: 'STARTER'
                }
            });
            console.log(`[LemonWebhook] Org ${organizationId} subscription cancelled/expired`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("[Lemon Squeezy Webhook Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
