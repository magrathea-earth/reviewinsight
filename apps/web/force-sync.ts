import { ProjectSyncer } from "./lib/sync/project-syncer";
import { prisma } from "./lib/prisma";

async function forceSync() {
    console.log("🚀 FORCING SYNC NOW (TS Mode)");

    // Find project "d"
    const project = await prisma.project.findFirst({
        where: { name: "d" },
        include: { sources: true }
    });

    if (!project) {
        console.error("❌ Project 'd' not found!");
        return;
    }

    console.log(`✅ Found Project: ${project.name} (${project.id})`);
    console.log(`   Sources: ${project.sources.length}`);

    if (project.sources.length > 0) {
        console.log("   --- Source Configs ---");
        project.sources.forEach(src => {
            console.log(`   [${src.platform}] config:`, JSON.stringify(src.config, null, 2));
        });
    }

    try {
        console.log("\n⏳ Starting Sync...");
        await ProjectSyncer.sync(project.id);
        console.log("\n✅ Sync Completed Successfully!");
    } catch (e) {
        console.error("\n❌ SYNC FAILED WITH ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

forceSync();
