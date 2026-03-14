import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lemonSqueezy } from "@/lib/lemonsqueezy";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        if (!lemonSqueezy) {
            return NextResponse.json({ error: "Lemon Squeezy client not initialized" }, { status: 500 });
        }
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get user's organization
        const userOrg = await prisma.userOrganization.findFirst({
            where: { user: { email: session.user.email } },
            include: { organization: true },
        });

        if (!userOrg) {
            return NextResponse.json({ error: "No organization found" }, { status: 404 });
        }

        const org = userOrg.organization;
        const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
        const storeId = process.env.LEMONSQUEEZY_STORE_ID;

        if (!variantId || !storeId) {
            return NextResponse.json({ error: "Lemon Squeezy config missing" }, { status: 500 });
        }

        // 2. Create Checkout
        const newCheckout = await lemonSqueezy.createCheckout({
            store: storeId,
            variant: variantId,
            checkout_data: {
                email: session.user.email,
                name: org.name,
                custom: {
                    organization_id: org.id, // Custom data passed to webhook
                },
            },
            product_options: {
                redirect_url: `${process.env.NEXTAUTH_URL}/dashboard`,
                receipt_button_text: "Go to Dashboard",
                receipt_thank_you_note: "Thank you for upgrading to Pro!",
            }
        });

        return NextResponse.json({ url: newCheckout.data.attributes.url });
    } catch (error: any) {
        console.error("[Lemon Squeezy Checkout Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
