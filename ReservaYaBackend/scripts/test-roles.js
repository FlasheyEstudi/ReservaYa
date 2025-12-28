const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log('--- Starting System Test ---');

    // 1. Register Business
    const randomSuffix = Math.floor(Math.random() * 10000);
    const busName = `TestResto${randomSuffix}`;
    const email = `owner${randomSuffix}@test.com`;
    const password = 'password123';

    console.log(`[1] Registering Business: ${busName} (${email})`);

    const regRes = await fetch(`${BASE_URL}/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: busName,
            tax_id: `TAX-${randomSuffix}`,
            owner_email: email,
            owner_password: password,
            owner_full_name: 'Test Owner'
        })
    });

    if (!regRes.ok) {
        console.error('Registration Failed:', await regRes.text());
        return;
    }

    const regData = await regRes.json();
    console.log('Registration Success!');
    console.log(`- Restaurant: ${regData.restaurant.name} (${regData.restaurant.businessCode})`);
    console.log(`- Token: ${regData.token.substring(0, 20)}...`);

    const managerToken = regData.token;
    const businessCode = regData.restaurant.businessCode;

    // 2. Create Employee (Waiter)
    const waiterEmail = `waiter${randomSuffix}@test.com`;
    const waiterPin = '1234';

    console.log(`\n[2] Creating Waiter Employee: ${waiterEmail}`);

    // Endpoint update based on listing
    const staffRes = await fetch(`${BASE_URL}/restaurant/staff`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${managerToken}`
        },
        body: JSON.stringify({
            fullName: 'Pepe Waiter',
            email: waiterEmail,
            role: 'waiter',
            pin: waiterPin
        })
    });

    if (!staffRes.ok) {
        console.error('Create Staff Failed:', await staffRes.text());
        // Don't stop, try login maybe? No point.
        return;
    }

    const staffData = await staffRes.json();
    console.log('Staff Created Success:', staffData);

    // 3. Login as Waiter
    console.log(`\n[3] Logging in as Waiter`);
    const loginRes = await fetch(`${BASE_URL}/auth/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            restaurant_code: businessCode,
            email: waiterEmail,
            pin: waiterPin
        })
    });

    if (!loginRes.ok) {
        console.error('Waiter Login Failed:', await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    console.log('Waiter Login Success!');
    console.log(`- Logged in as: ${loginData.user.role} (${loginData.user.email})`);
    console.log(`- Token: ${loginData.token.substring(0, 20)}...`);

    console.log('\n--- Test Completed Successfully ---');
}

runTest().catch(console.error);
