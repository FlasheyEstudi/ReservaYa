const { io } = require('socket.io-client');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:8002';

async function runTest() {
    console.log('--- Starting Walk-in Flow Test (No Reservation -> Host Manual Seat -> Waiter -> Pay) ---');

    // [Step 1: Setup]
    const randomSuffix = Math.floor(Math.random() * 10000);
    const busName = `WalkIn${randomSuffix}`;
    const email = `owner${randomSuffix}@test.com`;

    // Register Business
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
    const businessCode = regData.restaurant.businessCode;
    const rid = regData.restaurant.id;

    // Create Table
    console.log('[Setup] Creating Table T10');
    const layoutRes = await fetch(`${BASE_URL}/restaurant/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({
            tables: [{ table_number: 'T10', capacity: 2, pos_x: 5, pos_y: 5 }]
        })
    });
    const layoutData = await layoutRes.json();
    const tableId = layoutData.tables[0].id;

    // Create Menu Item
    console.log('[Setup] Creating Menu Item');
    const itemRes = await fetch(`${BASE_URL}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({
            name: 'Soda',
            description: 'Cold drink',
            price: 5,
            category: 'Drinks',
            station: 'bar',
            isAvailable: true
        })
    });
    const itemData = await itemRes.json();
    const itemId = itemData.menu_item.id;

    // Create Staff
    console.log('[Setup] Creating Staff...');
    const hostEmail = `host${randomSuffix}@test.com`;
    const waiterEmail = `waiter${randomSuffix}@test.com`;
    const commonPin = '1234';

    await fetch(`${BASE_URL}/restaurant/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({ fullName: 'Host Helen', email: hostEmail, role: 'host', pin: commonPin })
    });
    await fetch(`${BASE_URL}/restaurant/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({ fullName: 'Waiter Wayne', email: waiterEmail, role: 'waiter', pin: commonPin })
    });

    // Login Staff
    const login = async (email) => {
        const res = await fetch(`${BASE_URL}/auth/employee/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurant_code: businessCode, email, pin: commonPin })
        });
        return (await res.json()).token;
    };
    const hostToken = await login(hostEmail);
    const waiterToken = await login(waiterEmail);

    // [Step 2: Host Manually Seats Guests (Walk-in)]
    console.log('\n[2] Host manually marking table as Occupied (Walk-in)...');
    const manualSeatRes = await fetch(`${BASE_URL}/restaurant/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hostToken}` },
        body: JSON.stringify({ status: 'occupied' })
    });

    if (!manualSeatRes.ok) {
        console.error('Manual seat failed:', await manualSeatRes.text());
        throw new Error('Host failed to seat guests');
    }
    const seatData = await manualSeatRes.json();
    console.log(`-> Table ${seatData.table.tableNumber} status: ${seatData.table.status}`);

    // [Step 3: Waiter Takes Order]
    console.log('\n[3] Waiter taking order...');
    const orderRes = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${waiterToken}` },
        body: JSON.stringify({
            table_id: tableId,
            items: [{ menu_item_id: itemId, quantity: 2 }]
        })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(`Order failed: ${JSON.stringify(orderData)}`);
    const orderId = orderData.order.id;
    console.log('-> Order Created:', orderId);

    // [Step 4: Payment & Close]
    console.log('\n[4] Payment & Closing...');
    const closeRes = await fetch(`${BASE_URL}/restaurant/orders/${orderId}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${waiterToken}` },
        body: JSON.stringify({ paymentMethod: 'cash', tip: 2 })
    });
    console.log('-> Order Closed:', await closeRes.json());

    // [Step 5: Freeing Table]
    console.log('\n[5] Freeing Table...');
    const freeRes = await fetch(`${BASE_URL}/restaurant/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${waiterToken}` },
        body: JSON.stringify({ status: 'free' })
    });
    const freeData = await freeRes.json();
    console.log('-> Final Table Status:', freeData.table ? freeData.table.status : 'unknown');

    if (freeData.table && (freeData.table.status === 'free' || freeData.table.currentStatus === 'free')) {
        console.log('\n*** WALK-IN FLOW TEST: SUCCESS ***');
    } else {
        console.error('\n*** WALK-IN FLOW TEST: FAILED ***');
    }
}

runTest().catch(console.error);
