const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log('--- Starting Onboarding & Premium Upgrade Flow Test ---');

    const randomSuffix = Math.floor(Math.random() * 100000);
    const busName = `PremiumGrill${randomSuffix}`;
    const ownerEmail = `premium${randomSuffix}@test.com`;
    const ownerPass = 'password123';

    // 1. [Onboarding] Register new Business
    console.log(`\n[1] Registering Business: ${busName}`);
    const regRes = await fetch(`${BASE_URL}/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: busName,
            tax_id: `PREM-${randomSuffix}`,
            owner_email: ownerEmail,
            owner_password: ownerPass,
            owner_full_name: 'Premium Owner'
        })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);

    const restaurantId = regData.restaurant.id;
    console.log(`-> Registered ID: ${restaurantId} (Status: ${regData.restaurant.status})`);

    // 2. [Super Admin] Approve Restaurant
    console.log('\n[2] Super Admin Login & Approval...');

    // Login as Super Admin (Credentials from Seed)
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@reservaya.com', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    const adminToken = adminLoginData.token;
    console.log('-> Admin Logged In');

    // Approve (Force status active just to test Admin Endpoint)
    const approveRes = await fetch(`${BASE_URL}/admin/restaurants`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            restaurantId: restaurantId,
            status: 'active'
        })
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
    console.log(`-> Restaurant Approved (Status: ${approveData.restaurant.status})`);

    // 3. [Manager] Purchase Premium Plan
    console.log('\n[3] Manager Login & Plan Upgrade...');

    // Login Manager
    const managerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ownerEmail, password: ownerPass })
    });
    const managerLoginData = await managerLoginRes.json();
    if (!managerLoginRes.ok) throw new Error(`Manager login failed: ${JSON.stringify(managerLoginData)}`);
    const managerToken = managerLoginData.token;

    // Check current plan (Should be none or free/trial depending on logic, let's see)
    // Actually our logic creates subscription on registration? No, the code in register-business didn't create subscription.
    // So it should be null or empty.

    // Upgrade to 'professional'
    console.log('-> Purchasing "Professional" Plan...');
    const upgradeRes = await fetch(`${BASE_URL}/billing/subscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${managerToken}`
        },
        body: JSON.stringify({ planName: 'professional' })
    });
    const upgradeData = await upgradeRes.json();

    console.log(`Upgrade Status: ${upgradeRes.status}`);
    console.log('Upgrade Response:', JSON.stringify(upgradeData, null, 2));

    if (!upgradeRes.ok) throw new Error('Upgrade Failed');

    // Verify Subscription
    const subRes = await fetch(`${BASE_URL}/billing/subscription`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    const subData = await subRes.json();

    /* 
       Note: The GET /billing/subscription endpoint returns 'usageStats', 
       which might include plan details or strictly usage. 
       Let's check what it returns in the logs.
       If it doesn't return plan name, we might need another endpoint or check the POST response.
       The POST response explicitly returns 'subscription' object with 'plan'.
    */

    if (upgradeData.subscription && upgradeData.subscription.plan.name === 'professional') {
        console.log('\n*** ONBOARDING & PREMIUM UPGRADE TEST: PASSED ***');
    } else {
        console.error('\n*** ONBOARDING & PREMIUM UPGRADE TEST: FAILED (Plan mismatch) ***');
    }
}

runTest().catch(console.error);
