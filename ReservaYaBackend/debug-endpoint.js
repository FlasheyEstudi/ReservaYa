
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function testEndpointLogic() {
    const restaurantId = 'mockup_rest_9';
    console.log(`Testing query for restaurant: ${restaurantId}`);

    const tables = await db.table.findMany({
        where: {
            restaurantId: restaurantId,
            currentStatus: 'free'
        },
        select: {
            id: true,
            restaurantId: true,
            tableNumber: true,
            capacity: true
        }
    });

    console.log(`Found ${tables.length} tables.`);
    if (tables.length > 0) {
        console.log('Sample table:', tables[0]);
        if (tables[0].restaurantId !== restaurantId) {
            console.error('CRITICAL: Returned table for WRONG restaurant!');
        } else {
            console.log('Verification passed: Table belongs to correct restaurant.');
        }
    } else {
        console.log('No tables found. Seed might have failed?');
    }
}

testEndpointLogic()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
