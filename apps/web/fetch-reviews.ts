/**
 * Fetch Reviews Script
 * 
 * This script triggers a sync for a project to fetch all reviews from the last 30 days.
 * 
 * Usage:
 *   npx tsx fetch-reviews.ts <project-id>
 * 
 * Or create a new project and sync:
 *   npx tsx fetch-reviews.ts --new --name "My App" --app-store-id "123456" --google-play-id "com.example.app"
 */

import { prisma } from "./lib/prisma";
import { ProjectSyncer } from "./lib/sync/project-syncer";

async function main() {
    const args = process.argv.slice(2);

    if (args.includes("--help") || args.length === 0) {
        console.log(`
Usage:
  Sync existing project:
    npx tsx fetch-reviews.ts <project-id>
  
  Create new project and sync:
    npx tsx fetch-reviews.ts --new --name "App Name" --app-store-id "12345" --google-play-id "com.example.app"
  
  List all projects:
    npx tsx fetch-reviews.ts --list
        `);
        process.exit(0);
    }

    // List projects
    if (args.includes("--list")) {
        const projects = await prisma.project.findMany({
            include: { sources: true }
        });

        console.log("\n📋 Your Projects:\n");
        for (const project of projects) {
            console.log(`  ID: ${project.id}`);
            console.log(`  Name: ${project.name}`);
            console.log(`  Sources: ${project.sources.length}`);
            project.sources.forEach(source => {
                const config = typeof source.config === 'string' ? JSON.parse(source.config) : source.config;
                console.log(`    - ${source.type}: ${config.appId || config.packageName || 'N/A'}`);
            });
            console.log("");
        }
        process.exit(0);
    }

    // Create new project
    if (args.includes("--new")) {
        const nameIndex = args.indexOf("--name");
        const appStoreIndex = args.indexOf("--app-store-id");
        const googlePlayIndex = args.indexOf("--google-play-id");

        if (nameIndex === -1) {
            console.error("❌ Error: --name is required");
            process.exit(1);
        }

        const projectName = args[nameIndex + 1];
        const appStoreId = appStoreIndex !== -1 ? args[appStoreIndex + 1] : null;
        const googlePlayId = googlePlayIndex !== -1 ? args[googlePlayIndex + 1] : null;

        if (!appStoreId && !googlePlayId) {
            console.error("❌ Error: At least one of --app-store-id or --google-play-id is required");
            process.exit(1);
        }

        console.log(`\n🔨 Creating project: ${projectName}\n`);

        // Create project (you'll need to add organizationId)
        const project = await prisma.project.create({
            data: {
                name: projectName,
                organizationId: "default", // Replace with actual org ID
            }
        });

        // Create sources
        if (appStoreId) {
            await prisma.source.create({
                data: {
                    projectId: project.id,
                    type: "APP_STORE",
                    config: JSON.stringify({ appId: appStoreId })
                }
            });
            console.log(`  ✅ Added App Store source: ${appStoreId}`);
        }

        if (googlePlayId) {
            await prisma.source.create({
                data: {
                    projectId: project.id,
                    type: "GOOGLE_PLAY",
                    config: JSON.stringify({ packageName: googlePlayId })
                }
            });
            console.log(`  ✅ Added Google Play source: ${googlePlayId}`);
        }

        console.log(`\n✅ Project created with ID: ${project.id}`);
        console.log(`\n🔄 Starting sync...\n`);

        const syncer = new ProjectSyncer();
        await syncer.run(project.id);

        console.log("\n✅ Sync complete!");
        process.exit(0);
    }

    // Sync existing project
    const projectId = args[0];

    console.log(`\n🔄 Fetching reviews for project: ${projectId}\n`);

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { sources: true }
    });

    if (!project) {
        console.error(`❌ Error: Project ${projectId} not found`);
        process.exit(1);
    }

    console.log(`  Project: ${project.name}`);
    console.log(`  Sources: ${project.sources.length}`);
    console.log("");

    const syncer = new ProjectSyncer();
    await syncer.run(projectId);

    console.log("\n✅ Sync complete! Reviews from the last 30 days have been fetched.");

    // Show stats
    const reviewCount = await prisma.review.count({
        where: { projectId }
    });

    console.log(`\n📊 Total reviews in database: ${reviewCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
