/**
 * Test script to verify project creation limits
 * Run with: npx tsx test-limits.ts
 */

async function testProjectLimit() {
    const baseUrl = 'http://localhost:3000';

    console.log('🧪 Testing Project Creation Limit...\n');

    // You'll need to replace this with a valid session cookie from your browser
    console.log('⚠️  IMPORTANT: You need to:');
    console.log('1. Login to http://localhost:3000 in your browser');
    console.log('2. Open DevTools (F12) → Application → Cookies');
    console.log('3. Copy the value of "next-auth.session-token" cookie');
    console.log('4. Paste it in this script at line 18\n');

    const sessionToken = 'PASTE_YOUR_SESSION_TOKEN_HERE';

    if (sessionToken === 'PASTE_YOUR_SESSION_TOKEN_HERE') {
        console.log('❌ Please update the sessionToken variable first!');
        return;
    }

    // Test creating first project
    console.log('📝 Attempting to create first project...');
    const response1 = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `next-auth.session-token=${sessionToken}`
        },
        body: JSON.stringify({
            name: 'Test Project 1',
            platform: 'GOOGLE_PLAY',
            config: { packageName: 'com.test.app1' }
        })
    });

    console.log(`Status: ${response1.status}`);
    const data1 = await response1.json();
    console.log('Response:', JSON.stringify(data1, null, 2));

    if (response1.status === 200) {
        console.log('✅ First project created successfully\n');
    } else {
        console.log('❌ First project creation failed\n');
        return;
    }

    // Test creating second project (should fail with 403)
    console.log('📝 Attempting to create second project (should be blocked)...');
    const response2 = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `next-auth.session-token=${sessionToken}`
        },
        body: JSON.stringify({
            name: 'Test Project 2',
            platform: 'GOOGLE_PLAY',
            config: { packageName: 'com.test.app2' }
        })
    });

    console.log(`Status: ${response2.status}`);
    const data2 = await response2.json();
    console.log('Response:', JSON.stringify(data2, null, 2));

    if (response2.status === 403 && data2.code === 'LIMIT_REACHED') {
        console.log('✅ Limit enforcement working! Second project was blocked.');
    } else if (response2.status === 200) {
        console.log('❌ BUG: Second project was created (should have been blocked!)');
    } else {
        console.log('⚠️  Unexpected response');
    }
}

testProjectLimit().catch(console.error);
