
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkTable() {
    const tableId = 'mockup_table_5'; // From the request payload

    const table = await db.table.findUnique({
        where: { id: tableId },
        include: { restaurant: true }
    });

    if (!table) {
        console.log(`Table ${tableId} not found`);
    } else {
        console.log(`Table found: ${table.id}`);
        console.log(`Capacity: ${table.capacity}`);
        console.log(`Data: `, table);
        console.log(`Belongs to Restaurant: ${table.restaurantId} (${table.restaurant?.name})`);
    }
}

checkTable()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
