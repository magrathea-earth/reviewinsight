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

        const userId = (session.user as any).id;

        let userOrg = await prisma.userOrganization.findFirst({
            where: {
                OR: [
                    { userId: userId },
                    { user: { email: session.user.email } }
                ]
            },
            include: { organization: true },
        });

        if (!userOrg) {
            console.log("No organization found for user in plan fetch, creating one...");
            const newOrg = await prisma.organization.create({
                data: {
                    name: `${session.user?.name || 'My'}'s Org`,
                    users: {
                        create: {
                            userId: userId || (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id || '',
                            role: "OWNER"
                        }
                    }
                },
                include: { users: true }
            });
            
            return NextResponse.json({
                plan: newOrg.plan,
                orgName: newOrg.name,
            });
        }

        return NextResponse.json({
            plan: userOrg.organization.plan,
            orgName: userOrg.organization.name,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
