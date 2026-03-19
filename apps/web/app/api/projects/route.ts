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
                s.platform === 'APP_STORE' ? 'App Store' : s.platform
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

    console.log(`[API] Triggering rapid ingestion for project ${project.id}...`);
    try {
        const { ProjectSyncer } = await import("../../../lib/sync/project-syncer");
        
        // 1. Await ONLY ingestion (fast)
        await ProjectSyncer.ingestOnly(project.id);
        console.log(`[API] Rapid ingestion completed for ${project.id}`);

        // 2. Background the full sync (includes analysis)
        ProjectSyncer.fullSync(project.id).catch(err => 
            console.error(`[API] Background full sync failed for ${project.id}:`, err)
        );
        
    } catch (syncErr) {
        console.error(`[API] Initial sync phase failed for ${project.id}:`, syncErr);
    }

    return NextResponse.json(project);
}
