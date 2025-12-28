const { io } = require('socket.io-client');
const fetch = require('node-fetch'); // If node version < 18. Native fetch in Node 18+

const BASE_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:8002';

async function runTest() {
    console.log('--- Starting Collaboration Test (Waiter -> Kitchen) ---');

    // 1. Register Business
    const randomSuffix = Math.floor(Math.random() * 10000);
    const busName = `CollabResto${randomSuffix}`;
    const email = `owner${randomSuffix}@test.com`;
    const password = 'password123';

    console.log(`[1] Registering Business: ${busName}`);
    const regRes = await fetch(`${BASE_URL}/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: busName,
            tax_id: `TAX-${randomSuffix}`,
            owner_email: email,
            owner_password: password,
            owner_full_name: 'Owner Collab'
        })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Reg failed: ${JSON.stringify(regData)}`);

    const managerToken = regData.token;
    const businessCode = regData.restaurant.businessCode;
    console.log('-> Business Registered.');

    // 2. Setup Resources (Table & Menu Item)
    console.log('[2] Setting up Table and Menu Item...');

    // Using layout endpoint
    const layoutRes = await fetch(`${BASE_URL}/restaurant/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({
            tables: [{ table_number: 'T1', capacity: 4, pos_x: 0, pos_y: 0 }]
        })
    });
    const layoutData = await layoutRes.json();
    if (!layoutRes.ok) throw new Error(`Layout failed: ${JSON.stringify(layoutData)}`);
    const tableId = layoutData.tables[0].id;

    // Create Menu Item using /menu
    const itemRes = await fetch(`${BASE_URL}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({
            name: 'Burger',
            description: 'Good burger',
            price: 15,
            category: 'Main',
            station: 'kitchen',
            is_available: true
        })
    });
    const itemData = await itemRes.json();
    if (!itemRes.ok) throw new Error(`Item failed: ${JSON.stringify(itemData)}`);
    const itemId = itemData.menu_item.id;
    console.log('-> Resources Created.');

    // 3. Create Staff (Chef & Waiter)
    console.log('[3] Creating Staff (Chef & Waiter)...');

    // Chef
    const chefEmail = `chef${randomSuffix}@test.com`;
    await fetch(`${BASE_URL}/restaurant/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({ fullName: 'Chef Gordon', email: chefEmail, role: 'chef', pin: '1234' })
    });

    // Waiter
    const waiterEmail = `waiter${randomSuffix}@test.com`;
    await fetch(`${BASE_URL}/restaurant/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
        body: JSON.stringify({ fullName: 'Waiter John', email: waiterEmail, role: 'waiter', pin: '1234' })
    });
    console.log('-> Staff Created.');

    // 4. Login Staff
    console.log('[4] Logging in Staff...');

    // Chef Login
    const chefLoginRes = await fetch(`${BASE_URL}/auth/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_code: businessCode, email: chefEmail, pin: '1234' })
    });
    const chefToken = (await chefLoginRes.json()).token;

    // Waiter Login
    const waiterLoginRes = await fetch(`${BASE_URL}/auth/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_code: businessCode, email: waiterEmail, pin: '1234' })
    });
    const waiterToken = (await waiterLoginRes.json()).token;


    // 5. Connect Chef to Socket
    console.log('[5] Connecting Chef to Socket...');
    const chefSocket = io(SOCKET_URL, {
        auth: { token: chefToken },
        transports: ['websocket']
    });

    const socketPromise = new Promise((resolve, reject) => {
        chefSocket.on('connect', () => {
            console.log('-> Chef Connected to Socket');
            // Emulate client joining room
            const rid = regData.restaurant.id;
            const kitchenRoom = `restaurant_${rid}_kitchen`;
            console.log(`-> Joining room: ${kitchenRoom}`);
            chefSocket.emit('join_room', kitchenRoom);
        });

        chefSocket.on('new_ticket', (data) => {
            console.log('!!! RECEIVED EVENT: new_ticket !!!');
            console.log('Data:', data);
            resolve(true); // Success!
        });

        // Timeout
        setTimeout(() => {
            reject(new Error('Timeout waiting for event'));
        }, 15000);
    });

    // 6. Waiter Creates Order
    console.log('[6] Waiter creating order...');
    // Give socket a moment to join rooms
    await new Promise(r => setTimeout(r, 1000));

    const orderRes = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${waiterToken}` },
        body: JSON.stringify({
            table_id: tableId,
            items: [
                { menu_item_id: itemId, quantity: 2, notes: 'No onions' }
            ]
        })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(`Order failed: ${JSON.stringify(orderData)}`);
    console.log('-> Order Created via API.');

    // 7. Await Event
    console.log('-> Waiting for socket event...');
    try {
        await socketPromise;
        console.log('\n*** COLLABORATION TEST PASSED ***');
        console.log('The Chef received the order created by the Waiter.');
    } catch (e) {
        console.error('\n*** COLLABORATION TEST FAILED ***');
        console.error(e);
    } finally {
        chefSocket.disconnect();
    }
}

runTest().catch(console.error);
