import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projectId = params.id;
    const userId = (session.user as any).id;

    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organization: {
                users: { some: { userId } }
            }
        },
        include: {
            items: {
                orderBy: { createdAt: "desc" },
                take: 50
            },
            analyses: {
                orderBy: { createdAt: "desc" },
                take: 1
            },
            sources: true
        }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Calculate real stats
    const totalReviews = await prisma.reviewItem.count({ where: { projectId } });
    const poorReviews = await prisma.reviewItem.count({
        where: {
            projectId,
            OR: [
                { rating: { lte: 3 } },
                { sentiment: "NEG" }
            ]
        }
    });
    const goodReviews = await prisma.reviewItem.count({
        where: {
            projectId,
            OR: [
                { rating: { gte: 4 } },
                { sentiment: "POS" }
            ]
        }
    });

    const analysis = project.analyses[0]?.json as any;

    // Support legacy and new structure
    let criticisms = analysis?.criticisms || {
        summary: analysis?.summary || "No complaints found.",
        bullets: analysis?.bullets || []
    };

    // Ensure suggestions exist
    if (criticisms && !criticisms.suggestions) {
        criticisms.suggestions = [];
    }

    const praises = analysis?.praises || {
        summary: "No positive highlights available yet.",
        bullets: []
    };

    return NextResponse.json({
        id: project.id,
        name: project.name,
        stats: [
            { label: "Total Reviews", value: totalReviews.toLocaleString(), sub: "Real-time data" },
            { label: "Positive Reviews", value: goodReviews.toLocaleString(), sub: `${((goodReviews / (totalReviews || 1)) * 100).toFixed(1)}% of total`, color: "text-green-500" },
            { label: "Critical Issues", value: poorReviews.toLocaleString(), sub: `${((poorReviews / (totalReviews || 1)) * 100).toFixed(1)}% of total`, color: "text-red-500" },
        ],
        // Default to criticisms for the main Insights page
        summary: criticisms.summary,
        bullets: criticisms.bullets,
        // Separate objects for specific pages
        criticisms,
        praises,
        sources: project.sources,
        recentReviews: project.items.map(item => ({
            text: item.text,
            author: item.author || "Anonymous",
            platform: item.platform,
            rating: item.rating,
            url: item.url,
            date: new Date(item.createdAt).toLocaleDateString('en-GB'),
            dateISO: item.createdAt.toISOString()
        }))
    });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projectId = params.id;
    const userId = (session.user as any).id;

    try {
        // Verify ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organization: {
                    users: { some: { userId } }
                }
            }
        });

        if (!project) return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });

        // Manually delete related records first since Cascade is not set in Prisma schema
        // We use a transaction to ensure atomicity
        await prisma.$transaction([
            prisma.reviewItem.deleteMany({ where: { projectId } }),
            prisma.projectAnalysis.deleteMany({ where: { projectId } }),
            prisma.dataSource.deleteMany({ where: { projectId } }),
            prisma.project.delete({ where: { id: projectId } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete project:", error);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
