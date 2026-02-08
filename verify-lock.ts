
import { ProjectSyncer } from "./apps/web/lib/sync/project-syncer";
import { prisma } from "./packages/db";

async function main() {
    const project = await prisma.project.findFirst();
    if (!project) {
        console.log("No project found to test");
        return;
    }

    console.log(`Testing Sync Lock on Project: ${project.id}`);

    // Simulate concurrent requests
    console.log("Triggering Sync 1...");
    const p1 = ProjectSyncer.sync(project.id);

    console.log("Triggering Sync 2 (Should Fail)...");
    const p2 = ProjectSyncer.sync(project.id);

    try {
        await Promise.all([p1, p2]);
    } catch (e) {
        console.log("Caught expected error:", e);
    }
}

main();
