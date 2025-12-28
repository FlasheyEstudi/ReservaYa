const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log('--- Starting Double Booking Integrity Test ---');

    // [Step 1: Setup]
    const randomSuffix = Math.floor(Math.random() * 100000);
    const busName = `DbBook${randomSuffix}`;
    const email = `owner${randomSuffix}@test.com`;

    // 1. Register Business
    console.log(`[1] Registering Business: ${busName}`);
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

    // 2. Create ONE Table
    console.log('[Setup] Creating Single Table T1');
    const layoutRes = await fetch(`${BASE_URL}/restaurant/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({
            tables: [{ table_number: 'T1', capacity: 4, pos_x: 0, pos_y: 0 }]
        })
    });
    const layoutData = await layoutRes.json();
    const tableId = layoutData.tables[0].id;
    console.log(`-> Table ID: ${tableId}`);

    // 3. Register User
    const userEmail = `user${randomSuffix}@test.com`;
    const userRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'Racer One', email: userEmail, password: 'password123', phone: '555-0000' })
    });
    const userToken = (await userRes.json()).token;

    // [Step 2: Concurrent Reservation Attempt]
    console.log('\n[2] Attempting Double Booking (Concurrent Requests)...');

    // Target time: Tomorrow at 8 PM
    const resDate = new Date();
    resDate.setDate(resDate.getDate() + 1);
    resDate.setHours(20, 0, 0, 0);

    const reservationPayload = {
        restaurant_id: rid,
        party_size: 2,
        reservation_time: resDate.toISOString(),
        table_id: tableId, // Target specific table to force conflict
        special_requests: 'Race Condition Test'
    };

    // Fire two requests simultaneously
    const req1 = fetch(`${BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify(reservationPayload)
    });

    const req2 = fetch(`${BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify(reservationPayload)
    });

    const [res1, res2] = await Promise.all([req1, req2]);
    const data1 = await res1.json();
    const data2 = await res2.json();

    console.log(`\nResponse 1 Status: ${res1.status}`);
    console.log('Response 1 Data:', JSON.stringify(data1));
    console.log(`\nResponse 2 Status: ${res2.status}`);
    console.log('Response 2 Data:', JSON.stringify(data2));

    const successCount = [res1.ok, res2.ok].filter(Boolean).length;

    if (successCount === 1) {
        console.log('\n*** DOUBLE BOOKING TEST: PASSED (Only one succeeded) ***');
    } else if (successCount === 0) {
        console.error('\n*** DOUBLE BOOKING TEST: FAILED (Both failed - unexpected) ***');
    } else {
        console.error('\n*** DOUBLE BOOKING TEST: FAILED (Both succeeded - INTEGRITY ERROR) ***');
    }
}

runTest().catch(console.error);
