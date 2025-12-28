const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log('--- Starting Sold Out Item Test ---');

    // [Step 1: Setup]
    const randomSuffix = Math.floor(Math.random() * 100000);
    const busName = `SoldOut${randomSuffix}`;
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
    const managerToken = regData.token;
    const rid = regData.restaurant.id;

    // 2. Create Table
    const layoutRes = await fetch(`${BASE_URL}/restaurant/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({
            tables: [{ table_number: 'T1', capacity: 4, pos_x: 0, pos_y: 0 }]
        })
    });
    const layoutData = await layoutRes.json();
    const tableId = layoutData.tables[0].id;

    // 3. Create Menu Item (Initially Available)
    console.log('[Setup] Creating Menu Item: "Special Cake"');
    const itemRes = await fetch(`${BASE_URL}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({
            name: 'Special Cake',
            description: 'Delicious',
            price: 10,
            category: 'Dessert',
            station: 'kitchen',
            isAvailable: true
        })
    });
    const itemData = await itemRes.json();
    const itemId = itemData.menu_item.id;

    // 4. Register Staff (Waiter)
    const waiterEmail = `waiter${randomSuffix}@test.com`;
    await fetch(`${BASE_URL}/restaurant/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({ fullName: 'Waiter Test', email: waiterEmail, role: 'waiter', pin: '1234' })
    });
    // Login Waiter
    const waiterRes = await fetch(`${BASE_URL}/auth/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_code: regData.restaurant.businessCode, email: waiterEmail, pin: '1234' })
    });
    const waiterToken = (await waiterRes.json()).token;

    // [Step 2: Mark Item as Unavailable]
    console.log('\n[2] Marking Item as "Unavailable" (Sold Out)...');
    // Using confirmed endpoint: PATCH /api/menu/[itemId]/availability
    const updateRes = await fetch(`${BASE_URL}/menu/${itemId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({ is_available: false })
    });

    if (!updateRes.ok) {
        console.error('Update failed:', await updateRes.text());
    } else {
        console.log('-> Item marked as unavailable.');
    }

    // [Step 3: Attempt to Order Unavailable Item]
    console.log('\n[3] Waiter attempting to order "Special Cake"...');

    const orderRes = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${waiterToken}` },
        body: JSON.stringify({
            table_id: tableId,
            items: [{ menu_item_id: itemId, quantity: 1 }]
        })
    });

    const orderResult = await orderRes.json();
    console.log(`\nOrder Response Status: ${orderRes.status}`);
    console.log('Order Response Data:', JSON.stringify(orderResult));

    if (orderRes.status !== 201) {
        if (JSON.stringify(orderResult).includes('not available')) {
            console.log('\n*** SOLD OUT TEST: PASSED (Order blocked correctly) ***');
        } else {
            console.log('\n*** SOLD OUT TEST: WARNING (Order failed but maybe for other reason) ***');
        }
    } else {
        console.error('\n*** SOLD OUT TEST: FAILED (Order succeeded on unavailable item) ***');
    }
}

runTest().catch(console.error);
