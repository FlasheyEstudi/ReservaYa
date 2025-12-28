const fetch = require('node-fetch');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3000/api';
const CONCURRENCY_LEVEL = 50; // Number of concurrent requests

async function runTest() {
    console.log(`--- Starting Stress Test (Concurrency: ${CONCURRENCY_LEVEL}) ---`);

    // [Step 1: Setup]
    const randomSuffix = Math.floor(Math.random() * 100000);
    const busName = `Stress${randomSuffix}`;
    const email = `owner${randomSuffix}@test.com`;

    console.log(`[Setup] Registering Business...`);
    const regRes = await fetch(`${BASE_URL}/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: busName,
            tax_id: `TAX-${randomSuffix}`,
            owner_email: email,
            owner_password: 'password123',
            owner_full_name: 'Owner Flow'
        })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Reg failed: ${JSON.stringify(regData)}`);
    const managerToken = regData.token;
    const rid = regData.restaurant.id;

    // Create 50 Tables
    console.log(`[Setup] Creating ${CONCURRENCY_LEVEL} Tables...`);
    const tables = [];
    for (let i = 1; i <= CONCURRENCY_LEVEL; i++) {
        tables.push({ table_number: `ST${i}`, capacity: 4, pos_x: i, pos_y: 0 });
    }
    const layoutRes = await fetch(`${BASE_URL}/restaurant/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({ tables })
    });
    const layoutData = await layoutRes.json();
    const tableIds = layoutData.tables.map(t => t.id);

    // Register 50 Users (for Reservations)
    console.log(`[Setup] Creating ${CONCURRENCY_LEVEL} Users...`);
    const userTokens = [];
    // We'll just register one user and reuse token to save setup time, or register few.
    // Let's register 5 users and cycle them to simulate realistic load
    const usersCount = 5;
    for (let i = 0; i < usersCount; i++) {
        const uEmail = `user${i}_${randomSuffix}@test.com`;
        const uRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName: `User ${i}`, email: uEmail, password: 'password123', phone: '555-0000' })
        });
        userTokens.push((await uRes.json()).token);
    }

    // [Phase 1: Concurrent Reservations]
    // Goal: 50 requests hitting endpoint at once for DIFFERENT tables.
    // Expected: 100% Success (High Throughput)
    console.log('\n[Phase 1] Launching Concurrent Reservations (Throughput Test)...');

    const resDate = new Date();
    resDate.setDate(resDate.getDate() + 1);
    resDate.setHours(20, 0, 0, 0);

    const requests = tableIds.map((tableId, index) => {
        const token = userTokens[index % usersCount];
        return fetch(`${BASE_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                restaurant_id: rid,
                party_size: 2,
                reservation_time: resDate.toISOString(), // Same time
                table_id: tableId, // Different tables
                special_requests: `Stress Test ${index}`
            })
        });
    });

    const startTime = performance.now();
    const responses = await Promise.all(requests);
    const endTime = performance.now();

    const duration = endTime - startTime;
    const successes = responses.filter(r => r.ok).length;
    const failures = responses.filter(r => !r.ok).length;

    console.log(`\n--- Results Phase 1 ---`);
    console.log(`Total Requests: ${CONCURRENCY_LEVEL}`);
    console.log(`Duration: ${duration.toFixed(2)} ms`);
    console.log(`Successes: ${successes}`);
    console.log(`Failures: ${failures}`);
    console.log(`RPS (Req/Sec): ${(CONCURRENCY_LEVEL / (duration / 1000)).toFixed(2)}`);

    if (failures > 0) {
        console.log('Sample Failure:', await responses.find(r => !r.ok).text());
    }

    // [Phase 2: Database Locking Stress]
    // Goal: 20 requests for the SAME table.
    // Expected: 1 Success, 19 Failures (Correct Locking)
    console.log('\n[Phase 2] Launching Contention Test (Same Table)...');
    const targetTableId = tableIds[0];
    const contentionLevel = 20;

    // Shift time slightly just in case
    resDate.setDate(resDate.getDate() + 1);

    const contentionRequests = [];
    for (let i = 0; i < contentionLevel; i++) {
        const token = userTokens[i % usersCount];
        contentionRequests.push(fetch(`${BASE_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                restaurant_id: rid,
                party_size: 2,
                reservation_time: resDate.toISOString(),
                table_id: targetTableId, // SAME TABLE
                special_requests: `Contention Test ${i}`
            })
        }));
    }

    const startC = performance.now();
    const resC = await Promise.all(contentionRequests);
    const endC = performance.now();

    const succC = resC.filter(r => r.ok).length;
    const failC = resC.filter(r => !r.ok).length;

    console.log(`\n--- Results Phase 2 ---`);
    console.log(`Total Requests: ${contentionLevel}`);
    console.log(`Successes: ${succC} (Expected: 1)`);
    console.log(`Failures: ${failC} (Expected: ${contentionLevel - 1})`);
}

runTest().catch(console.error);
