import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLimits() {
    console.log('🔍 Checking database state...\n');

    // Get all organizations
    const orgs = await prisma.organization.findMany({
        include: {
            projects: true,
            users: {
                include: {
                    user: true
                }
            }
        }
    });

    console.log(`Found ${orgs.length} organization(s):\n`);

    for (const org of orgs) {
        console.log(`📊 Organization: ${org.name}`);
        console.log(`   ID: ${org.id}`);
        console.log(`   Plan: ${org.plan}`);
        console.log(`   Projects: ${org.projects.length}`);
        console.log(`   Users: ${org.users.map(u => u.user.email).join(', ')}`);
        console.log(`   Project names: ${org.projects.map(p => p.name).join(', ')}`);
        console.log('');
    }

    // Simulate the limit check logic
    if (orgs.length > 0) {
        const org = orgs[0];
        const projectCount = org.projects.length;
        const isFreePlan = !org.plan || org.plan === 'STARTER';

        console.log('🧪 Simulating limit check:');
        console.log(`   isFreePlan: ${isFreePlan}`);
        console.log(`   projectCount: ${projectCount}`);
        console.log(`   Should block? ${isFreePlan && projectCount >= 1}`);

        if (isFreePlan && projectCount >= 1) {
            console.log('   ✅ Limit should be enforced!');
        } else {
            console.log('   ❌ Limit will NOT be enforced');
            if (!isFreePlan) {
                console.log(`   Reason: Plan is "${org.plan}", not STARTER`);
            }
            if (projectCount < 1) {
                console.log(`   Reason: Only ${projectCount} projects exist`);
            }
        }
    }

    await prisma.$disconnect();
}

checkLimits().catch(console.error);
