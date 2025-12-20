/**
 * Seed Mockup - Datos de demostración para capturas de pantalla
 * 
 * Uso: npx tsx prisma/seed-mockup.ts
 * Para limpiar: npx tsx prisma/seed-mockup.ts --clean
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// IDs fijos para poder identificar y borrar datos mockup
const MOCKUP_PREFIX = 'mockup_';

async function cleanMockupData() {
    console.log('🧹 Limpiando datos mockup...');

    // Delete in correct order to respect foreign keys
    await prisma.activityLog.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.inventoryMovement.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.inventoryItem.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.orderItem.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.order.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.invoice.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.customerProfile.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.reservation.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.review.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.like.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.marketingCampaign.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.menuItem.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.menuCategory.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.table.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.area.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.employee.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.user.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.restaurant.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });
    await prisma.admin.deleteMany({ where: { id: { startsWith: MOCKUP_PREFIX } } });

    console.log('✅ Datos mockup eliminados');
}

async function seedMockupData() {
    console.log('🌱 Creando datos mockup...');

    const PIN_HASH = await bcrypt.hash('1234', 10);
    const PASSWORD_HASH = await bcrypt.hash('password123', 10);

    // ============ ADMIN ============
    const admin = await prisma.admin.upsert({
        where: { email: 'admin@reservaya.com' },
        update: {},
        create: {
            id: `${MOCKUP_PREFIX}admin_1`,
            email: 'admin@reservaya.com',
            passwordHash: PASSWORD_HASH,
            fullName: 'Admin Principal',
            isActive: true
        }
    });
    console.log('✅ Admin creado');

    // ============ USERS (Customers) ============
    const usersData = [
        { name: 'María García', email: 'maria@email.com', phone: '+52 555 123 4567' },
        { name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: '+52 555 234 5678' },
        { name: 'Ana López', email: 'ana@email.com', phone: '+52 555 345 6789' },
        { name: 'Pedro Martínez', email: 'pedro@email.com', phone: '+52 555 456 7890' },
        { name: 'Laura Sánchez', email: 'laura@email.com', phone: '+52 555 567 8901' },
        { name: 'Roberto Hernández', email: 'roberto@email.com', phone: '+52 555 678 9012' },
        { name: 'Sofía Ramírez', email: 'sofia@email.com', phone: '+52 555 789 0123' },
        { name: 'Diego Torres', email: 'diego@email.com', phone: '+52 555 890 1234' },
        { name: 'Valentina Cruz', email: 'valentina@email.com', phone: '+52 555 901 2345' },
        { name: 'Fernando Morales', email: 'fernando@email.com', phone: '+52 555 012 3456' },
    ];

    const users = await Promise.all(usersData.map((u, i) => prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
            id: `${MOCKUP_PREFIX}user_${i + 1}`,
            email: u.email,
            passwordHash: PASSWORD_HASH,
            fullName: u.name,
            phone: u.phone
        }
    })));
    console.log(`✅ ${users.length} usuarios creados`);


    // ============ RESTAURANTS ============
    // First, try to find existing REST-TEST restaurant, otherwise create it
    let mainRestaurant = await prisma.restaurant.findFirst({ where: { businessCode: 'REST-TEST' } });

    if (!mainRestaurant) {
        mainRestaurant = await prisma.restaurant.create({
            data: {
                id: `${MOCKUP_PREFIX}rest_main`,
                businessCode: 'REST-TEST',
                name: 'ReservaYA Grill & Bar',
                category: 'Americana',
                description: 'El mejor restaurante americano con hamburguesas gourmet, cortes premium y cócteles artesanales.',
                address: 'Calle Principal 123, Ciudad Demo',
                phone: '+52 55 1234 5678',
                status: 'active',
                taxId: 'RFC999999999'
            }
        });
    }
    console.log(`✅ Restaurante principal: ${mainRestaurant.name} (${mainRestaurant.businessCode})`);

    // Create additional mockup restaurants for variety (with images for feed)
    const additionalRestaurants = await Promise.all([
        { name: 'La Trattoria Italiana', code: 'TRAT001', category: 'Italiana', desc: 'Auténtica cocina italiana con ingredientes importados directamente de Italia. Pastas frescas hechas a mano todos los días.', address: 'Av. Reforma 234, Col. Juárez, CDMX', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop' },
        { name: 'Tacos El Patrón', code: 'TACO001', category: 'Mexicana', desc: 'Los mejores tacos al pastor de la ciudad con receta familiar de 50 años. Tortillas hechas a mano.', address: 'Calle Madero 567, Centro Histórico, CDMX', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop' },
        { name: 'Sushi Zen', code: 'SUSH001', category: 'Japonesa', desc: 'Experiencia gastronómica japonesa con pescado fresco diario importado. Ambiente zen y elegante.', address: 'Polanco IV Sección, CDMX', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop' },
        { name: 'Café Parisien', code: 'CAFE001', category: 'Francesa', desc: 'Bistró francés con croissants recién horneados, crepes y el mejor café de especialidad.', address: 'Roma Norte, CDMX', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop' },
        { name: 'La Parrilla Argentina', code: 'PARR001', category: 'Argentina', desc: 'Cortes premium de carne angus argentina a las brasas. El mejor asado fuera de Buenos Aires.', address: 'Av. Insurgentes Sur 1234, Del Valle, CDMX', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop' },
        { name: 'Thai Garden', code: 'THAI001', category: 'Tailandesa', desc: 'Auténticos sabores tailandeses con especias importadas. Pad Thai tradicional y curries aromáticos.', address: 'Condesa, CDMX', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop' },
        { name: 'Mariscos El Puerto', code: 'MARI001', category: 'Mariscos', desc: 'Pescados y mariscos frescos del día. Ceviche, aguachile y el mejor cóctel de camarón.', address: 'Narvarte, CDMX', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=600&fit=crop' },
        { name: 'Veggie House', code: 'VEGG001', category: 'Vegetariana', desc: 'Cocina vegetariana gourmet. Ingredientes orgánicos y opciones veganas creativas.', address: 'Coyoacán, CDMX', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop' },
        { name: 'BBQ Smokehouse', code: 'BBQ001', category: 'Americana', desc: 'Auténtico BBQ texano ahumado por 12 horas. Brisket, pulled pork y costillas de cerdo.', address: 'Santa Fe, CDMX', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&h=600&fit=crop' },
        { name: 'Dragon Palace', code: 'CHIN001', category: 'China', desc: 'Gastronomía cantonesa y sichuan auténtica. Dim sum los fines de semana.', address: 'Zona Rosa, CDMX', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop' },
    ].map((r, i) => prisma.restaurant.create({
        data: {
            id: `${MOCKUP_PREFIX}rest_${i + 1}`,
            businessCode: r.code,
            name: r.name,
            category: r.category,
            description: r.desc,
            address: r.address,
            phone: `+52 55 ${1000 + i * 111} ${2000 + i * 222}`,
            status: 'active',
            taxId: `RFC${String(i + 1).padStart(10, '0')}`,
            image: r.image
        }
    })));
    const restaurants = [mainRestaurant, ...additionalRestaurants];
    console.log(`✅ ${restaurants.length} restaurantes en total`);



    // ============ EMPLOYEES ============
    const employees = await Promise.all([
        { name: 'Juan Pérez', email: 'juan@trattoria.com', role: 'manager' },
        { name: 'Rosa Mendoza', email: 'rosa@trattoria.com', role: 'host' },
        { name: 'Miguel Ángel', email: 'miguel@trattoria.com', role: 'chef' },
        { name: 'Carmen Silva', email: 'carmen@trattoria.com', role: 'waiter' },
        { name: 'Luis García', email: 'luis@trattoria.com', role: 'waiter' },
        { name: 'Andrea Ruiz', email: 'andrea@trattoria.com', role: 'bartender' },
        { name: 'Pablo Ortiz', email: 'pablo@trattoria.com', role: 'chef' },
    ].map((e, i) => prisma.employee.create({
        data: {
            id: `${MOCKUP_PREFIX}emp_${i + 1}`,
            restaurantId: mainRestaurant.id,
            fullName: e.name,
            email: e.email,
            pinHash: PIN_HASH,
            role: e.role,
            isActive: true
        }
    })));
    console.log(`✅ ${employees.length} empleados creados`);

    // ============ AREAS & TABLES ============
    const areas = await Promise.all([
        { name: 'Terraza', tables: 6 },
        { name: 'Salón Principal', tables: 12 },
        { name: 'Salón Privado', tables: 4 },
        { name: 'Barra', tables: 8 },
    ].map((a, i) => prisma.area.create({
        data: {
            id: `${MOCKUP_PREFIX}area_${i + 1}`,
            restaurantId: mainRestaurant.id,
            name: a.name
        }
    })));
    console.log(`✅ ${areas.length} áreas creadas`);

    let tableNum = 1;
    const tables: any[] = [];
    for (const area of areas) {
        const tableCounts = { 'Terraza': 6, 'Salón Principal': 12, 'Salón Privado': 4, 'Barra': 8 };
        const count = tableCounts[area.name as keyof typeof tableCounts] || 4;
        for (let i = 0; i < count; i++) {
            const statuses = ['free', 'occupied', 'reserved', 'free', 'free', 'occupied'];
            tables.push(await prisma.table.create({
                data: {
                    id: `${MOCKUP_PREFIX}table_${tableNum}`,
                    restaurantId: mainRestaurant.id,
                    areaId: area.id,
                    tableNumber: `${tableNum}`,
                    capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
                    currentStatus: statuses[i % statuses.length],
                    posX: (i % 4) * 120 + 50,
                    posY: Math.floor(i / 4) * 100 + 50
                }
            }));
            tableNum++;
        }
    }
    console.log(`✅ ${tables.length} mesas creadas`);

    // ============ MENU CATEGORIES & ITEMS ============
    const menuCategories = await Promise.all([
        'Entradas', 'Pastas', 'Carnes', 'Mariscos', 'Postres', 'Bebidas', 'Vinos', 'Cócteles'
    ].map((name, i) => prisma.menuCategory.create({
        data: {
            id: `${MOCKUP_PREFIX}cat_${i + 1}`,
            restaurantId: mainRestaurant.id,
            name,
            sortOrder: i
        }
    })));
    console.log(`✅ ${menuCategories.length} categorías de menú creadas`);

    const menuItemsData = [
        // Entradas
        { cat: 0, name: 'Bruschetta Clásica', desc: 'Pan tostado con tomate, albahaca y aceite de oliva', price: 95, station: 'kitchen' },
        { cat: 0, name: 'Carpaccio de Res', desc: 'Finas láminas de res con parmesano y rúcula', price: 185, station: 'kitchen' },
        { cat: 0, name: 'Antipasto Mixto', desc: 'Selección de embutidos, quesos y aceitunas', price: 220, station: 'kitchen' },
        { cat: 0, name: 'Calamares Fritos', desc: 'Calamares dorados servidos con aioli', price: 165, station: 'kitchen' },
        // Pastas
        { cat: 1, name: 'Spaghetti Carbonara', desc: 'Con pancetta, huevo y parmesano', price: 195, station: 'kitchen' },
        { cat: 1, name: 'Fettuccine Alfredo', desc: 'Crema, mantequilla y parmesano', price: 175, station: 'kitchen' },
        { cat: 1, name: 'Penne Arrabbiata', desc: 'Salsa de tomate picante con ajo', price: 165, station: 'kitchen' },
        { cat: 1, name: 'Lasagna Bolognesa', desc: 'Capas de pasta con ragú de carne', price: 225, station: 'kitchen' },
        { cat: 1, name: 'Ravioli de Ricotta', desc: 'Rellenos de ricotta y espinaca', price: 195, station: 'kitchen' },
        // Carnes
        { cat: 2, name: 'Ossobuco alla Milanese', desc: 'Chambarete de res estofado con gremolata', price: 345, station: 'kitchen' },
        { cat: 2, name: 'Saltimbocca', desc: 'Ternera con jamón serrano y salvia', price: 285, station: 'kitchen' },
        { cat: 2, name: 'Bistecca Fiorentina', desc: 'Ribeye de 500g a la parrilla', price: 485, station: 'kitchen' },
        { cat: 2, name: 'Pollo Parmigiana', desc: 'Pechuga empanizada con mozzarella', price: 245, station: 'kitchen' },
        // Mariscos
        { cat: 3, name: 'Risotto Frutti di Mare', desc: 'Arroz cremoso con mariscos mixtos', price: 295, station: 'kitchen' },
        { cat: 3, name: 'Salmón a la Parrilla', desc: 'Con vegetales mediterráneos', price: 285, station: 'kitchen' },
        { cat: 3, name: 'Linguine alle Vongole', desc: 'Con almejas en vino blanco', price: 265, station: 'kitchen' },
        // Postres
        { cat: 4, name: 'Tiramisú', desc: 'Clásico postre italiano con café', price: 95, station: 'kitchen' },
        { cat: 4, name: 'Panna Cotta', desc: 'Con coulis de frutos rojos', price: 85, station: 'kitchen' },
        { cat: 4, name: 'Cannoli Siciliani', desc: 'Rellenos de ricotta y chocolate', price: 75, station: 'kitchen' },
        { cat: 4, name: 'Gelato Artesanal', desc: '3 bolas de helado italiano', price: 65, station: 'kitchen' },
        // Bebidas
        { cat: 5, name: 'Agua Mineral', desc: 'San Pellegrino 500ml', price: 45, station: 'bar' },
        { cat: 5, name: 'Limonada Italiana', desc: 'Con limón siciliano y menta', price: 55, station: 'bar' },
        { cat: 5, name: 'Espresso', desc: 'Café italiano tradicional', price: 40, station: 'bar' },
        { cat: 5, name: 'Cappuccino', desc: 'Espresso con leche espumada', price: 55, station: 'bar' },
        // Vinos
        { cat: 6, name: 'Chianti Classico', desc: 'Copa de vino tinto toscano', price: 95, station: 'bar' },
        { cat: 6, name: 'Pinot Grigio', desc: 'Copa de vino blanco italiano', price: 85, station: 'bar' },
        { cat: 6, name: 'Prosecco', desc: 'Copa de espumante italiano', price: 90, station: 'bar' },
        // Cócteles
        { cat: 7, name: 'Aperol Spritz', desc: 'Aperol, prosecco y soda', price: 145, station: 'bar' },
        { cat: 7, name: 'Negroni', desc: 'Gin, Campari y vermut rojo', price: 155, station: 'bar' },
        { cat: 7, name: 'Bellini', desc: 'Prosecco y puré de durazno', price: 125, station: 'bar' },
    ];

    const menuItems = await Promise.all(menuItemsData.map((item, i) => prisma.menuItem.create({
        data: {
            id: `${MOCKUP_PREFIX}item_${i + 1}`,
            restaurantId: mainRestaurant.id,
            categoryId: menuCategories[item.cat].id,
            name: item.name,
            description: item.desc,
            price: item.price,
            productionStation: item.station,
            station: item.station,
            category: menuCategories[item.cat].name,
            isAvailable: Math.random() > 0.1
        }
    })));
    console.log(`✅ ${menuItems.length} items de menú creados`);

    // ============ RESERVATIONS ============
    const today = new Date();
    const reservationsData: { id: string; restaurantId: string; userId: string; tableId: string; reservationTime: Date; partySize: number; status: string }[] = [];
    for (let i = 0; i < 25; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + Math.floor(Math.random() * 14) - 7);
        date.setHours(12 + Math.floor(Math.random() * 10), Math.random() > 0.5 ? 0 : 30, 0, 0);

        reservationsData.push({
            id: `${MOCKUP_PREFIX}res_${i + 1}`,
            restaurantId: mainRestaurant.id,
            userId: users[i % users.length].id,
            tableId: tables[i % tables.length].id,
            reservationTime: date,
            partySize: Math.floor(Math.random() * 5) + 2,
            status: ['confirmed', 'confirmed', 'seated', 'cancelled', 'no_show'][Math.floor(Math.random() * 5)]
        });
    }
    const reservations = await Promise.all(reservationsData.map(r => prisma.reservation.create({ data: r })));
    console.log(`✅ ${reservations.length} reservaciones creadas`);

    // ============ ORDERS ============
    const waiterEmployees = employees.filter(e => e.role === 'waiter');
    const ordersData: { id: string; restaurantId: string; tableId: string; waiterId: string; status: string; total: number; createdAt: Date }[] = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - Math.floor(Math.random() * 30));
        date.setHours(12 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);

        ordersData.push({
            id: `${MOCKUP_PREFIX}order_${i + 1}`,
            restaurantId: mainRestaurant.id,
            tableId: tables[i % tables.length].id,
            waiterId: waiterEmployees[i % waiterEmployees.length].id,
            status: i < 5 ? 'open' : i < 10 ? 'payment_pending' : 'closed',
            total: 0,
            createdAt: date
        });
    }
    const orders = await Promise.all(ordersData.map(o => prisma.order.create({ data: o })));
    console.log(`✅ ${orders.length} órdenes creadas`);

    // ============ ORDER ITEMS ============
    let orderItemCount = 0;
    for (const order of orders) {
        const numItems = Math.floor(Math.random() * 5) + 2;
        let orderTotal = 0;

        for (let i = 0; i < numItems; i++) {
            const item = menuItems[Math.floor(Math.random() * menuItems.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;
            orderTotal += Number(item.price) * quantity;

            await prisma.orderItem.create({
                data: {
                    id: `${MOCKUP_PREFIX}oi_${++orderItemCount}`,
                    orderId: order.id,
                    menuItemId: item.id,
                    quantity,
                    station: item.station || 'kitchen',
                    status: order.status === 'closed' ? 'served' : ['pending', 'cooking', 'ready'][Math.floor(Math.random() * 3)],
                    notes: Math.random() > 0.7 ? 'Sin cebolla' : null
                }
            });
        }

        await prisma.order.update({
            where: { id: order.id },
            data: { total: orderTotal }
        });
    }
    console.log(`✅ ${orderItemCount} items de orden creados`);

    // ============ REVIEWS ============
    const reviewsData = [
        { rating: 5, comment: 'Excelente comida y servicio. El ambiente es muy acogedor. Definitivamente volveré.' },
        { rating: 4, comment: 'Muy buena experiencia, aunque la espera fue un poco larga. La pasta estaba deliciosa.' },
        { rating: 5, comment: 'El mejor restaurante italiano de la ciudad. El tiramisú es increíble.' },
        { rating: 3, comment: 'La comida bien, pero el servicio podría mejorar. Los precios son razonables.' },
        { rating: 5, comment: 'Celebramos nuestro aniversario aquí. Todo perfecto, desde la atención hasta la comida.' },
        { rating: 4, comment: 'Muy recomendado el risotto. El vino de la casa también es muy bueno.' },
        { rating: 5, comment: 'Auténtica cocina italiana. El chef sabe lo que hace.' },
        { rating: 4, comment: 'Buen lugar para una cena romántica. Ambiente tranquilo y elegante.' },
        { rating: 5, comment: 'Los calamares fritos son los mejores que he probado. Porción generosa.' },
        { rating: 4, comment: 'Excelente relación precio-calidad. Volveremos pronto.' },
    ];

    const reviews = await Promise.all(reviewsData.map((r, i) => prisma.review.create({
        data: {
            id: `${MOCKUP_PREFIX}review_${i + 1}`,
            restaurantId: mainRestaurant.id,
            userId: users[i % users.length].id,
            rating: r.rating,
            comment: r.comment,
            replyText: i < 3 ? 'Gracias por tu visita, ¡esperamos verte pronto!' : null,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }
    })));
    console.log(`✅ ${reviews.length} reseñas creadas`);

    // ============ LIKES ============
    for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < restaurants.length; j++) {
            if (Math.random() > 0.4) {
                await prisma.like.create({
                    data: {
                        id: `${MOCKUP_PREFIX}like_${i}_${j}`,
                        userId: users[i].id,
                        restaurantId: restaurants[j].id
                    }
                }).catch(() => { }); // Ignore duplicates
            }
        }
    }
    console.log(`✅ Likes creados`);

    // ============ INVENTORY ============
    const inventoryData = [
        { name: 'Harina 00', sku: 'HAR001', cat: 'Secos', unit: 'kg', stock: 25, min: 10, cost: 45 },
        { name: 'Tomate San Marzano', sku: 'TOM001', cat: 'Frescos', unit: 'kg', stock: 15, min: 5, cost: 120 },
        { name: 'Mozzarella Bufala', sku: 'MOZ001', cat: 'Lácteos', unit: 'kg', stock: 8, min: 3, cost: 280 },
        { name: 'Aceite de Oliva Extra Virgen', sku: 'ACE001', cat: 'Aceites', unit: 'litro', stock: 12, min: 4, cost: 180 },
        { name: 'Parmesano Reggiano', sku: 'PAR001', cat: 'Lácteos', unit: 'kg', stock: 5, min: 2, cost: 450 },
        { name: 'Albahaca Fresca', sku: 'ALB001', cat: 'Hierbas', unit: 'manojo', stock: 20, min: 8, cost: 25 },
        { name: 'Pancetta', sku: 'PAN001', cat: 'Embutidos', unit: 'kg', stock: 4, min: 2, cost: 320 },
        { name: 'Huevos Orgánicos', sku: 'HUE001', cat: 'Frescos', unit: 'pza', stock: 60, min: 24, cost: 8 },
        { name: 'Prosecco', sku: 'PRO001', cat: 'Vinos', unit: 'botella', stock: 24, min: 12, cost: 180 },
        { name: 'Chianti Classico', sku: 'CHI001', cat: 'Vinos', unit: 'botella', stock: 18, min: 6, cost: 250 },
        { name: 'Aperol', sku: 'APE001', cat: 'Licores', unit: 'botella', stock: 6, min: 2, cost: 350 },
        { name: 'Café Espresso', sku: 'CAF001', cat: 'Bebidas', unit: 'kg', stock: 8, min: 3, cost: 280 },
        { name: 'Calamares', sku: 'CAL001', cat: 'Mariscos', unit: 'kg', stock: 3, min: 2, cost: 180 },
        { name: 'Salmón Fresco', sku: 'SAL001', cat: 'Mariscos', unit: 'kg', stock: 4, min: 2, cost: 420 },
        { name: 'Ricotta', sku: 'RIC001', cat: 'Lácteos', unit: 'kg', stock: 6, min: 2, cost: 160 },
    ];

    const inventoryItems = await Promise.all(inventoryData.map((item, i) => prisma.inventoryItem.create({
        data: {
            id: `${MOCKUP_PREFIX}inv_${i + 1}`,
            restaurantId: mainRestaurant.id,
            name: item.name,
            sku: item.sku,
            category: item.cat,
            unit: item.unit,
            currentStock: item.stock,
            minStock: item.min,
            unitCost: item.cost
        }
    })));
    console.log(`✅ ${inventoryItems.length} items de inventario creados`);

    // Inventory movements
    let movementCount = 0;
    for (const item of inventoryItems) {
        for (let i = 0; i < 5; i++) {
            await prisma.inventoryMovement.create({
                data: {
                    id: `${MOCKUP_PREFIX}mov_${++movementCount}`,
                    itemId: item.id,
                    type: ['in', 'out', 'out', 'in', 'adjustment'][i],
                    quantity: Math.floor(Math.random() * 10) + 1,
                    reason: ['Compra proveedor', 'Uso en cocina', 'Uso en cocina', 'Compra proveedor', 'Ajuste inventario'][i],
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                }
            });
        }
    }
    console.log(`✅ ${movementCount} movimientos de inventario creados`);

    // ============ CUSTOMER PROFILES ============
    const customerProfiles = await Promise.all(users.map((user, i) => prisma.customerProfile.create({
        data: {
            id: `${MOCKUP_PREFIX}cp_${i + 1}`,
            restaurantId: mainRestaurant.id,
            userId: user.id,
            name: user.fullName || 'Cliente',
            email: user.email,
            phone: user.phone,
            isVIP: i < 3,
            totalVisits: Math.floor(Math.random() * 20) + 1,
            noShows: Math.floor(Math.random() * 2),
            lastVisit: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
            notes: i < 3 ? 'Cliente frecuente, prefiere mesa en terraza' : null
        }
    })));
    console.log(`✅ ${customerProfiles.length} perfiles de cliente creados`);

    // ============ INVOICES ============
    const invoicesData: { id: string; restaurantId: string; invoiceNumber: string; customerName: string; customerTaxId: string | null; subtotal: number; tax: number; total: number; status: string; createdAt: Date }[] = [];
    for (let i = 0; i < 20; i++) {
        const subtotal = Math.floor(Math.random() * 2000) + 500;
        const tax = subtotal * 0.16;
        invoicesData.push({
            id: `${MOCKUP_PREFIX}inv_${i + 1}`,
            restaurantId: mainRestaurant.id,
            invoiceNumber: `FAC-${String(i + 1).padStart(6, '0')}`,
            customerName: users[i % users.length].fullName || 'Cliente',
            customerTaxId: i % 3 === 0 ? `RFC${String(i).padStart(10, '0')}` : null,
            subtotal,
            tax,
            total: subtotal + tax,
            status: i < 15 ? 'paid' : i < 18 ? 'pending' : 'cancelled',
            createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
        });
    }
    const invoices = await Promise.all(invoicesData.map(inv => prisma.invoice.create({ data: inv })));
    console.log(`✅ ${invoices.length} facturas creadas`);

    // ============ MARKETING CAMPAIGNS ============
    const campaigns = await Promise.all([
        { title: 'Happy Hour 2x1', body: '¡Todos los cócteles al 2x1 de 5 a 7pm!', segment: 'all' },
        { title: 'Noche Italiana', body: 'Pasta ilimitada los jueves por $299', segment: 'all' },
        { title: 'Programa VIP', body: 'Acumula puntos y obtén descuentos exclusivos', segment: 'vip' },
        { title: 'Descuento Cumpleaños', body: '20% de descuento en tu cumpleaños', segment: 'birthday' },
        { title: 'Brunch Dominical', body: 'Nuevo menú de brunch con opciones ilimitadas', segment: 'all' },
    ].map((c, i) => prisma.marketingCampaign.create({
        data: {
            id: `${MOCKUP_PREFIX}camp_${i + 1}`,
            restaurantId: mainRestaurant.id,
            title: c.title,
            body: c.body,
            targetSegment: c.segment,
            sentAt: i < 3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null
        }
    })));
    console.log(`✅ ${campaigns.length} campañas de marketing creadas`);

    // ============ ACTIVITY LOGS ============
    const activityTypes = [
        { action: 'order_created', desc: 'Nueva orden creada en mesa ' },
        { action: 'reservation_checkin', desc: 'Check-in de reservación para ' },
        { action: 'table_status_change', desc: 'Mesa cambiada a estado ' },
        { action: 'payment_received', desc: 'Pago recibido por $' },
        { action: 'inventory_update', desc: 'Actualización de inventario: ' },
    ];

    for (let i = 0; i < 50; i++) {
        const actType = activityTypes[i % activityTypes.length];
        await prisma.activityLog.create({
            data: {
                id: `${MOCKUP_PREFIX}log_${i + 1}`,
                restaurantId: mainRestaurant.id,
                employeeId: employees[i % employees.length].id,
                action: actType.action,
                description: actType.desc + (i + 1),
                metadata: JSON.stringify({ mockup: true }),
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            }
        });
    }
    console.log(`✅ 50 registros de actividad creados`);

    console.log('\n🎉 ¡Datos mockup creados exitosamente!\n');
    console.log('Credenciales de prueba:');
    console.log('========================');
    console.log('Admin: admin@reservaya.com / password123');
    console.log('Manager: juan@trattoria.com / PIN: 1234');
    console.log('Host: rosa@trattoria.com / PIN: 1234');
    console.log('Chef: miguel@trattoria.com / PIN: 1234');
    console.log('Waiter: carmen@trattoria.com / PIN: 1234');
    console.log('Bartender: andrea@trattoria.com / PIN: 1234');
    console.log('Cliente: maria@email.com / password123');
    console.log('========================');
    console.log(`Restaurante principal: ${mainRestaurant.name} (${mainRestaurant.businessCode})`);
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--clean')) {
        await cleanMockupData();
    } else {
        // Clean first then seed
        await cleanMockupData();
        await seedMockupData();
    }
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
