const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log('--- Starting Multi-Branch (Sucursales) Test ---');

    // [Step 1: Setup - Registra Restaurant A (Main)]
    const randomSuffix = Math.floor(Math.random() * 100000);
    const mainBranchName = `MainBranch${randomSuffix}`;
    const email = `manager${randomSuffix}@test.com`;

    console.log(`\n[1] Registering Main Branch: ${mainBranchName}`);
    const regRes = await fetch(`${BASE_URL}/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: mainBranchName,
            tax_id: `TAX-${randomSuffix}`,
            owner_email: email,
            owner_password: 'password123',
            owner_full_name: 'Manager Multi'
        })
    });
    const regData = await regRes.json();
    const tokenA = regData.token;
    const ridA = regData.restaurant.id;

    console.log(`-> Main Branch Created (ID: ${ridA})`);

    // [Step 2: Create Second Branch (Branch B)]
    console.log('\n[2] Creating Second Branch (Side Branch)...');

    const branchRes = await fetch(`${BASE_URL}/organization/branches`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenA}`
        },
        body: JSON.stringify({
            name: `SideBranch${randomSuffix}`,
            address: '123 Side St',
            phone: '555-9999'
        })
    });
    const branchData = await branchRes.json();

    if (!branchRes.ok) throw new Error(`Branch creation failed: ${JSON.stringify(branchData)}`);
    const ridB = branchData.branch.id;
    console.log(`-> Side Branch Created (ID: ${ridB})`);

    // [Step 3: List Branches]
    console.log('\n[3] Listing Branches...');
    const listRes = await fetch(`${BASE_URL}/organization/branches`, {
        headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const listData = await listRes.json();
    console.log(`-> Total Branches: ${listData.totalBranches}`);
    console.log(`-> Branches: ${listData.branches.map(b => b.name).join(', ')}`);

    if (listData.totalBranches !== 2) throw new Error('Expected 2 branches');

    // [Step 4: Create Data in Branch A (Table)]
    console.log('\n[4] Creating Table in Main Branch (A)...');
    await fetch(`${BASE_URL}/restaurant/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
        body: JSON.stringify({ tables: [{ table_number: 'TA1', capacity: 4, pos_x: 0, pos_y: 0 }] })
    });

    // [Step 5: Switch to Branch B]
    console.log('\n[5] Switching to Side Branch (B)...');
    const switchRes = await fetch(`${BASE_URL}/organization/switch-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
        body: JSON.stringify({ branchId: ridB })
    });
    const switchData = await switchRes.json();
    const tokenB = switchData.token;

    if (!switchRes.ok) throw new Error('Switch failed');
    console.log(`-> Switched to: ${switchData.restaurant.name}`);

    // [Step 6: Verify Isolation (Check Tables in B)]
    console.log('\n[6] Verifying Data Isolation (Checking Tables in B)...');
    const layoutRes = await fetch(`${BASE_URL}/restaurant/layout`, {
        headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const layoutData = await layoutRes.json();
    console.log('Layout Data B (Raw):', JSON.stringify(layoutData));

    const areas = layoutData.areas || [];
    const unassigned = layoutData.unassigned_tables || [];
    const tablesInB = areas.flatMap(a => a.tables || []).concat(unassigned);
    console.log(`-> Tables in Branch B: ${tablesInB.length}`);

    if (tablesInB.length === 0) {
        console.log('\n*** MULTI-BRANCH TEST: PASSED (Isolation Verified) ***');
    } else {
        console.error('\n*** MULTI-BRANCH TEST: FAILED (Found tables from A in B or unexpected data) ***');
    }
}

runTest().catch(console.error);
