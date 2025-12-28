import { db } from './src/lib/db';

async function fixCoordinates() {
    const result = await db.restaurant.updateMany({
        where: {
            OR: [
                { latitude: null },
                { longitude: null }
            ]
        },
        data: {
            latitude: 12.1150,
            longitude: -86.2362
        }
    });
    console.log(`Updated ${result.count} restaurants with coordinates`);
    process.exit(0);
}

fixCoordinates();
