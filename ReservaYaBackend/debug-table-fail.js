
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkTable() {
    const tableId = 'cmjaf8se700064tdd5r26a8z6';

    console.log(`Checking table: ${tableId}`);
    const table = await db.table.findUnique({
        where: { id: tableId },
        include: { restaurant: true }
    });

    if (!table) {
        console.log('Table not found');
    } else {
        console.log('Table found:', table);
        console.log(`Belongs to Restaurant: ${table.restaurantId}`);
        if (table.restaurantId === 'mockup_rest_9') {
            console.log('MATCHES mockup_rest_9');
        } else {
            console.log('DOES NOT MATCH mockup_rest_9');
        }
    }
}

checkTable()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
