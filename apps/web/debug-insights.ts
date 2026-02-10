/**
 * Debug AI Insights
 * Check if analysis exists and manually trigger if needed
 */

import { prisma } from "./lib/prisma";
import { ProjectSyncer } from "./lib/sync/project-syncer";

async function main() {
    const projectId = process.argv[2];

    if (!projectId) {
        console.error("Usage: npx tsx debug-insights.ts <project-id>");
        process.exit(1);
    }

    console.log(`\n🔍 Debugging AI Insights for project: ${projectId}\n`);

    // Check project exists
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { sources: true }
    });

    if (!project) {
        console.error("❌ Project not found");
        process.exit(1);
    }

    console.log(`✅ Project: ${project.name}`);
    console.log(`   Sources: ${project.sources.length}\n`);

    // Check review counts
    const totalReviews = await prisma.reviewItem.count({ where: { projectId } });
    const criticalReviews = await prisma.reviewItem.count({
        where: {
            projectId,
            OR: [
                { rating: { lte: 3 } },
                { sentiment: "NEG" }
            ]
        }
    });
    const positiveReviews = await prisma.reviewItem.count({
        where: {
            projectId,
            OR: [
                { rating: { gte: 4 } },
                { sentiment: "POS" }
            ]
        }
    });

    console.log(`📊 Review Stats:`);
    console.log(`   Total: ${totalReviews}`);
    console.log(`   Critical: ${criticalReviews}`);
    console.log(`   Positive: ${positiveReviews}\n`);

    // Check if analysis exists
    const analyses = await prisma.projectAnalysis.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" }
    });

    console.log(`🧠 AI Analysis Records: ${analyses.length}`);

    if (analyses.length > 0) {
        const latest = analyses[0];
        console.log(`   Latest analysis: ${latest.createdAt.toISOString()}`);
        console.log(`   Data structure:`);
        const data = latest.json as any;
        console.log(`     - Score: ${data.score || 'N/A'}`);
        console.log(`     - Criticisms summary: ${data.criticisms?.summary || 'N/A'}`);
        console.log(`     - Criticism bullets: ${data.criticisms?.bullets?.length || 0}`);
        console.log(`     - Suggestions: ${data.criticisms?.suggestions?.length || 0}`);
        console.log(`     - Praises summary: ${data.praises?.summary || 'N/A'}`);
        console.log(`     - Praise bullets: ${data.praises?.bullets?.length || 0}\n`);

        if (data.criticisms?.bullets?.length > 0) {
            console.log(`   Top 3 Complaints:`);
            data.criticisms.bullets.slice(0, 3).forEach((b: any, i: number) => {
                console.log(`     ${i + 1}. ${b.title}`);
            });
        }
    } else {
        console.log(`   ⚠️  No analysis found!\n`);
        console.log(`🔄 Triggering AI analysis now...\n`);

        const syncer = new ProjectSyncer();
        // @ts-ignore - accessing private method for debugging
        await syncer.analyzeProject(projectId);

        console.log(`\n✅ Analysis complete! Check the Insights page now.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
