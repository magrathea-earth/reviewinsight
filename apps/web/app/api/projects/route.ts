import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const projects = await prisma.project.findMany({
        where: {
            organization: {
                users: { some: { userId } }
            }
        },
        include: {
            sources: {
                select: {
                    platform: true,
                    lastSync: true,
                    config: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const formattedProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        status: "Idle",
        sourceCount: p.sources.length,
        sources: p.sources.map(s => ({
            platform: s.platform,
            name: s.platform === 'GOOGLE_PLAY' ? 'Google Play' :
                s.platform === 'APP_STORE' ? 'App Store' :
                    s.platform === 'INSTAGRAM' ? 'Instagram' :
                        s.platform === 'X' ? 'X' : s.platform
        })),
        lastSync: p.sources[0]?.lastSync ? new Date(p.sources[0].lastSync).toLocaleString() : "Never"
    }));

    return NextResponse.json(formattedProjects);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    console.log("POST /api/projects - Body:", body);
    const { name, platform, config } = body;
    const userId = (session.user as any).id;
    console.log("POST /api/projects - UserId:", userId);

    // Find or create user's organization
    let userOrg = await prisma.userOrganization.findFirst({
        where: { userId }
    });

    let orgId: string;

    if (!userOrg) {
        console.log("No organization found for user, creating one...");
        const newOrg = await prisma.organization.create({
            data: {
                name: `${session.user?.name || 'My'}'s Org`,
                users: {
                    create: { userId, role: "OWNER" }
                }
            }
        });
        orgId = newOrg.id;
        console.log("Created new org:", orgId);
    } else {
        orgId = userOrg.organizationId;
        console.log("Found existing org:", orgId);
    }

    // CHECK PLAN LIMITS
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { _count: { select: { projects: true } } }
    });

    console.log(`[API] Checking limits for Org: ${orgId}, Plan: ${org?.plan}, Project Count: ${org?._count?.projects}`);

    if (org?.plan === "STARTER" && org._count.projects >= 1) {
        return NextResponse.json({
            error: "Free Plan Limit Reached",
            code: "LIMIT_REACHED",
            message: "You can only create 1 project on the Free Plan. Please upgrade to Pro to add more."
        }, { status: 403 });
    }

    console.log("Creating project with orgId:", orgId);
    const project = await prisma.project.create({
        data: {
            name,
            organizationId: orgId,
            sources: {
                create: {
                    platform: platform as any,
                    config: config || {},
                    status: "IDLE"
                }
            }
        }
    });
    console.log("Project created successfully:", project.id);

    // Fire and forget sync (smart sync will handle the "Initial Deep Pull")
    // We don't await this so the UI returns immediately.
    import("../../../lib/sync/project-syncer").then(({ ProjectSyncer }) => {
        console.log(`[API] Triggering auto-sync for new project ${project.id}`);
        ProjectSyncer.sync(project.id).catch(err =>
            console.error(`[API] Auto-sync failed for ${project.id}:`, err)
        );
    });

    return NextResponse.json(project);
}
