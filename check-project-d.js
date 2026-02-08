const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProject() {
    const projectId = 'cmlb0rbmq004qvhux48s3z1qe'; // Project "d"

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                sources: true,
                items: {
                    orderBy: { fetchedAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!project) {
            console.log("❌ Project not found!");
            return;
        }

        console.log("📋 Project Details:\n");
        console.log(`Name: ${project.name}`);
        console.log(`ID: ${project.id}`);
        console.log(`Created: ${project.createdAt}`);
        console.log();

        console.log("📡 Data Sources:");
        project.sources.forEach((source, i) => {
            console.log(`\n[${i + 1}] ${source.platform}`);
            console.log(`    Status: ${source.status}`);
            console.log(`    Last Sync: ${source.lastSync || 'Never'}`);
            console.log(`    Config: ${JSON.stringify(source.config, null, 2)}`);
        });

        console.log(`\n\n💾 Review Items: ${project.items.length} total`);

        if (project.items.length === 0) {
            console.log("\n⚠️  NO ITEMS FOUND - This confirms sync is not working!");
            console.log("\nPossible reasons:");
            console.log("1. The config query might be wrong");
            console.log("2. The adapter might be failing silently");
            console.log("3. Database save might be failing");
        } else {
            console.log("\n✅ Items found! Here are the most recent:\n");
            project.items.slice(0, 5).forEach((item, i) => {
                console.log(`[${i + 1}] ${item.platform}`);
                console.log(`    Text: ${item.text.substring(0, 80)}...`);
                console.log(`    Author: ${item.author}`);
                console.log(`    Created: ${item.createdAt}`);
                console.log(`    Fetched: ${item.fetchedAt}`);
                console.log(`    URL: ${item.url}`);
                console.log();
            });
        }

    } catch (error) {
        console.error("Error:", error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

checkProject();
