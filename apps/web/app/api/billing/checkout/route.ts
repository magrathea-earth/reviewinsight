import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lemonSqueezy } from "@/lib/lemonsqueezy";

export async function POST(req: Request) {
    try {
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
        const newCheckout = await lemonSqueezy.checkouts.create({
            storeId: parseInt(storeId),
            variantId: parseInt(variantId),
            checkoutData: {
                email: session.user.email,
                name: org.name,
                custom: {
                    organization_id: org.id, // Custom data passed to webhook
                },
            },
            productOptions: {
                redirectUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
                receiptButtonText: "Go to Dashboard",
                receiptThankYouNote: "Thank you for upgrading to Pro!",
            }
        });

        return NextResponse.json({ url: newCheckout.data.attributes.url });
    } catch (error: any) {
        console.error("[Lemon Squeezy Checkout Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
