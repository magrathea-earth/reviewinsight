import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEvent } from "@polar-sh/sdk/webhooks";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const headers = {
            "x-polar-signature": req.headers.get("x-polar-signature") || "",
        };
        const secret = process.env.POLAR_WEBHOOK_SECRET;

        if (!secret) {
            return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
        }

        // 1. Verify Signature and Parse Event
        let event;
        try {
            event = validateEvent(body, headers, secret);
        } catch (err: any) {
            console.error("[Polar Webhook] Signature verification failed", err);
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // 2. Handle Events
        // console.log(`[Polar Webhook] Event Type: ${event.type}`);

        switch (event.type) {
            case "subscription.created":
            case "subscription.updated": {
                const sub = event.data;
                const organizationId = sub.metadata?.organization_id;

                if (!organizationId) {
                    console.warn(`[Polar Webhook] No organization_id in metadata for event ${event.type}`);
                    return NextResponse.json({ received: true });
                }

                const isPro = sub.status === "active";

                await prisma.organization.update({
                    where: { id: organizationId.toString() },
                    data: {
                        subscriptionId: sub.id,
                        subscriptionStatus: sub.status,
                        plan: isPro ? "PRO" : "STARTER",
                        stripeCustomerId: sub.customerId, // Polar uses stripe internally sometimes, but sub.customerId is standard
                    },
                });
                console.log(`[Polar Webhook] Org ${organizationId} updated. Status: ${sub.status}`);
                break;
            }

            case "subscription.revoked":
            case "subscription.canceled": {
                const sub = event.data;
                const organizationId = sub.metadata?.organization_id;

                if (organizationId) {
                    await prisma.organization.update({
                        where: { id: organizationId.toString() },
                        data: {
                            subscriptionStatus: 'canceled',
                            plan: 'STARTER'
                        }
                    });
                    console.log(`[Polar Webhook] Org ${organizationId} subscription cancelled/revoked`);
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("[Polar Webhook Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
