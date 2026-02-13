import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectSyncer } from "@/lib/sync/project-syncer";

// Allow this function to run for up to 60 seconds (Vercel Hobby) or longer on Pro
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await req.json();

    // Verify user has access to project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organization: {
                users: { some: { userId: (session.user as any).id } }
            }
        },
        include: {
            sources: { select: { lastSync: true } }
        }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    console.log(`[API] Starting sync for project ${projectId}`);

    // CHECK PLAN LIMITS
    const org = await prisma.organization.findFirst({
        where: { projects: { some: { id: projectId } } }
    });

    const isFree = !org?.subscriptionStatus || org.subscriptionStatus === "FREE";

    if (isFree) {
        // Check sync count
        const currentSyncCount = project.syncCount || 0;
        const SYNC_LIMIT = 1;

        if (currentSyncCount >= SYNC_LIMIT) {
            return NextResponse.json({
                error: "Sync Limit Reached",
                code: "LIMIT_REACHED",
                message: "You have reached your sync limit for the Free Plan. Upgrade to continue monitoring new reviews."
            }, { status: 429 });
        }

        // Increment sync count
        await prisma.project.update({
            where: { id: projectId },
            data: { syncCount: { increment: 1 } }
        });
    }

    // In a serverless environment like Vercel, we can't reliably fire-and-forget 
    // without using Inngest or QStash. For simplicity/MVP, we'll await it.
    // If it takes too long, Vercel might time out, but we can optimize later.
    try {
        await ProjectSyncer.sync(projectId);
        return NextResponse.json({ success: true, message: "Sync completed successfully" });
    } catch (e: any) {
        console.error("Sync failed:", e);
        return NextResponse.json({ error: e.message || "Sync failed" }, { status: 500 });
    }
}
