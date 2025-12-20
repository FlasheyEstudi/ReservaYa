
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkCapacity() {
    console.log('Starting check for mockup_rest_9...');
    const restaurantId = 'mockup_rest_9';

    try {
        const restaurant = await db.restaurant.findUnique({
            where: { id: restaurantId },
            include: { tables: true }
        });

        if (!restaurant) {
            console.log('Restaurant not found');
        } else {
            const totalCapacity = restaurant.tables.reduce((sum, t) => sum + t.capacity, 0);
            console.log(`Restaurant: ${restaurant.name}`);
            console.log(`Total Tables: ${restaurant.tables.length}`);
            console.log(`Total Capacity: ${totalCapacity}`);

            const targetTime = new Date('2025-12-26T01:30:00.000Z');
            const start = new Date(targetTime.getTime() - 1.5 * 3600 * 1000);
            const end = new Date(targetTime.getTime() + 1.5 * 3600 * 1000);

            const reservations = await db.reservation.findMany({
                where: {
                    restaurantId,
                    reservationTime: {
                        gte: start,
                        lte: end
                    },
                    status: {
                        in: ['confirmed', 'seated']
                    }
                }
            });

            const occupied = reservations.reduce((sum, r) => sum + r.partySize, 0);
            console.log(`Reservations in window: ${reservations.length}`);
            console.log(`Occupied Seats: ${occupied}`);
            console.log(`Available: ${totalCapacity - occupied}`);
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await db.$disconnect();
    }
}

checkCapacity();
