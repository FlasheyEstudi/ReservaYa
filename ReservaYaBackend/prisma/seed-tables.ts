
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const restaurantId = 'mockup_rest_9';

    console.log(`Seeding tables for restaurant: ${restaurantId}`);

    // Determine if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
    });

    if (!restaurant) {
        console.error(`Restaurant ${restaurantId} not found!`);
        return;
    }

    // Define areas
    const areas = [
        { id: 'area_main', name: 'Main Dining', restaurantId },
        { id: 'area_terrace', name: 'Terrace', restaurantId },
        { id: 'area_bar', name: 'Bar Area', restaurantId }
    ];

    // Try creating areas if they don't exist (optional, or just use IDs directly if the schema allows nullable areaId)
    // For simplicity, we'll assume areas might not exist or we skip them if relation is optional

    // Clear existing tables for this restaurant to avoid duplicates if re-running
    await prisma.table.deleteMany({
        where: { restaurantId }
    });

    const tables: any[] = [];

    // 10 Tables of 2 people
    for (let i = 1; i <= 10; i++) {
        tables.push({
            restaurantId,
            tableNumber: `T${i}`,
            capacity: 2,
            posX: i * 20,
            posY: 20,
            shape: 'round',
            currentStatus: 'free'
        });
    }

    // 10 Tables of 4 people
    for (let i = 11; i <= 20; i++) {
        tables.push({
            restaurantId,
            tableNumber: `T${i}`,
            capacity: 4,
            posX: (i - 10) * 20,
            posY: 60,
            shape: 'rectangle',
            currentStatus: 'free'
        });
    }

    // 5 Tables of 6 people
    for (let i = 21; i <= 25; i++) {
        tables.push({
            restaurantId,
            tableNumber: `T${i}`,
            capacity: 6,
            posX: (i - 20) * 30,
            posY: 100,
            shape: 'rectangle',
            currentStatus: 'free'
        });
    }

    // 5 Tables of 8 people
    for (let i = 26; i <= 30; i++) {
        tables.push({
            restaurantId,
            tableNumber: `T${i}`,
            capacity: 8,
            posX: (i - 25) * 30,
            posY: 140,
            shape: 'rectangle',
            currentStatus: 'free'
        });
    }


    await prisma.table.createMany({
        data: tables
    });

    console.log(`Successfully created ${tables.length} tables for ${restaurantId}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
