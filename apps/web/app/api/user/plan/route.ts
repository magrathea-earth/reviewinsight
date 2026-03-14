import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userOrg = await prisma.userOrganization.findFirst({
            where: { user: { email: session.user.email } },
            include: { organization: true },
        });

        if (!userOrg) {
            return NextResponse.json({ error: "No organization found" }, { status: 404 });
        }

        return NextResponse.json({
            plan: userOrg.organization.plan,
            orgName: userOrg.organization.name,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
