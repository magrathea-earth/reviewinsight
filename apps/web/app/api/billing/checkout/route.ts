import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { polar } from "@/lib/polar";

export const dynamic = "force-dynamic";

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
        const productId = process.env.POLAR_PRODUCT_ID;

        if (!productId) {
            return NextResponse.json({ error: "Polar configuration missing" }, { status: 500 });
        }

        // 2. Create Checkout
        const result = await polar.checkouts.create({
            products: [productId],
            successUrl: `${process.env.NEXTAUTH_URL}/dashboard?checkout_id={CHECKOUT_ID}`,
            customerEmail: session.user.email,
            metadata: {
                organization_id: org.id,
            },
        });

        return NextResponse.json({ url: result.url });
    } catch (error: any) {
        console.error("[Polar Checkout Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
