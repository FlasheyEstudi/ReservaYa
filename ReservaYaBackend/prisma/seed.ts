import { PrismaClient, EmployeeRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de base de datos...');

    // 1. Limpiar datos existentes (orden inverso para respetar FKs)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.subscription.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.table.deleteMany();
    await prisma.area.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.menuCategory.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.review.deleteMany();
    await prisma.marketingCampaign.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.plan.deleteMany();

    // 1.5 Crear Planes de Suscripción
    console.log('💳 Creando planes de suscripción...');
    const plans = [
        {
            name: 'free',
            displayName: 'Gratis',
            description: 'Menú digital básico para tu equipo.',
            priceMonthly: 0,
            priceYearly: 0,
            maxTables: 999999,  // Ilimitado
            maxEmployees: 3,
            maxReservationsMonth: 999999,  // Ilimitado
            features: JSON.stringify({
                menuDigital: true,      // Menú digital para meseros
                menuQR: false,          // Menú QR para clientes (de pago)
                inventory: false,
                marketing: false,
                reports: false,
                customers: false,
                invoices: false,
                advancedReports: false
            }),
            trialDays: 0,
            sortOrder: 0
        },
        {
            name: 'starter',
            displayName: 'Starter',
            description: 'Menú QR y gestión básica de clientes.',
            priceMonthly: 19,
            priceYearly: 190,
            maxTables: 999999,
            maxEmployees: 5,
            maxReservationsMonth: 999999,
            features: JSON.stringify({
                menuDigital: true,
                menuQR: true,           // Menú QR para clientes
                inventory: false,
                marketing: false,
                reports: true,
                customers: true,
                invoices: true,
                advancedReports: false
            }),
            trialDays: 14,
            sortOrder: 1
        },
        {
            name: 'professional',
            displayName: 'Profesional',
            description: 'Gestión completa con inventario y marketing.',
            priceMonthly: 49,
            priceYearly: 490,
            maxTables: 999999,
            maxEmployees: 15,
            maxReservationsMonth: 999999,
            features: JSON.stringify({
                menuDigital: true,
                menuQR: true,
                inventory: true,
                marketing: true,
                reports: true,
                customers: true,
                invoices: true,
                advancedReports: true
            }),
            trialDays: 14,
            sortOrder: 2
        },
        {
            name: 'enterprise',
            displayName: 'Empresarial',
            description: 'Para cadenas y alto volumen.',
            priceMonthly: 99,
            priceYearly: 990,
            maxTables: 999999,
            maxEmployees: 999999,  // Ilimitado
            maxReservationsMonth: 999999,
            features: JSON.stringify({
                menuDigital: true,
                menuQR: true,
                inventory: true,
                marketing: true,
                reports: true,
                customers: true,
                invoices: true,
                advancedReports: true,
                multiSucursal: true,
                apiAccess: true
            }),
            trialDays: 14,
            sortOrder: 3
        }
    ];
    for (const plan of plans) {
        await prisma.plan.create({ data: plan });
    }
    console.log('✅ Planes creados: Free, Starter, Profesional, Empresarial');

    // 2. Hash de contraseñas y PINs comunes
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const pinHash = await bcrypt.hash('123456', 10);

    // 3. Crear Administrador de Plataforma (Super Admin)
    const admin = await prisma.admin.create({
        data: {
            email: 'admin@reservaya.com',
            passwordHash: adminPasswordHash,
            fullName: 'Super Administrador',
            isActive: true,
        },
    });
    console.log('✅ Admin creado: admin@reservaya.com');

    // 4. Crear Usuario Final (Cliente)
    const user = await prisma.user.create({
        data: {
            email: 'cliente@test.com',
            passwordHash: passwordHash,
            fullName: 'Cliente De Prueba',
            phone: '555-0000',
            preferences: JSON.stringify({ diet: ['none'] }),
        },
    });
    console.log('✅ Usuario creado: cliente@test.com');

    // 4. Crear Restaurante de Prueba
    const restaurant = await prisma.restaurant.create({
        data: {
            businessCode: 'REST-TEST',
            name: 'ReservaYA Grill & Bar',
            taxId: '999999999',
            address: 'Calle Principal 123, Ciudad Demo',
            status: 'active',
            config: JSON.stringify({
                currency: 'USD',
                service_charge: 10,
                open_hours: [{ day: 'Mon', open: '08:00', close: '22:00' }],
            }),
        },
    });
    console.log('✅ Restaurante creado: REST-TEST');

    // 5. Crear Áreas y Mesas
    const area = await prisma.area.create({
        data: {
            name: 'Terraza Principal',
            restaurantId: restaurant.id
        },
    });
    console.log('✅ Área creada: Terraza Principal');

    await prisma.table.createMany({
        data: [
            {
                restaurantId: restaurant.id,
                areaId: area.id,
                tableNumber: 'T1',
                capacity: 2,
                posX: 50,
                posY: 50,
                currentStatus: 'free'
            },
            {
                restaurantId: restaurant.id,
                areaId: area.id,
                tableNumber: 'T2',
                capacity: 4,
                posX: 150,
                posY: 50,
                currentStatus: 'occupied'
            },
            {
                restaurantId: restaurant.id,
                areaId: area.id,
                tableNumber: 'T3',
                capacity: 6,
                posX: 250,
                posY: 50,
                currentStatus: 'free'
            },
            {
                restaurantId: restaurant.id,
                areaId: area.id,
                tableNumber: 'T4',
                capacity: 4,
                posX: 50,
                posY: 150,
                currentStatus: 'reserved'
            },
        ],
    });
    console.log('✅ Mesas creadas: T1, T2, T3, T4');

    // 7. Crear Empleados del Restaurante (Roles de Restaurante)
    const roles: EmployeeRole[] = ['manager', 'chef', 'waiter', 'host', 'bartender'];

    for (const role of roles) {
        await prisma.employee.create({
            data: {
                restaurantId: restaurant.id,
                fullName: `Empleado ${role.toUpperCase()}`,
                email: `${role}@test.com`,
                role: role,
                pinHash: pinHash,
                isActive: true,
            },
        });
        console.log(`✅ Empleado creado: ${role}@test.com (Rol: ${role})`);
    }

    // 7. Crear Categorías de Menú
    const categoryComida = await prisma.menuCategory.create({
        data: {
            restaurantId: restaurant.id,
            name: 'Hamburguesas',
            sortOrder: 1
        },
    });

    const categoryBebidas = await prisma.menuCategory.create({
        data: {
            restaurantId: restaurant.id,
            name: 'Bebidas',
            sortOrder: 2
        },
    });

    const categoryPostres = await prisma.menuCategory.create({
        data: {
            restaurantId: restaurant.id,
            name: 'Postres',
            sortOrder: 3
        },
    });
    console.log('✅ Categorías de menú creadas');

    // 8. Crear Menú Básico
    await prisma.menuItem.create({
        data: {
            restaurantId: restaurant.id,
            categoryId: categoryComida.id,
            name: 'Classic Burger',
            description: 'Queso cheddar, lechuga, tomate y nuestra salsa especial',
            price: 12.50,
            productionStation: 'kitchen',
            station: 'kitchen',
            isAvailable: true,
        },
    });

    await prisma.menuItem.create({
        data: {
            restaurantId: restaurant.id,
            categoryId: categoryComida.id,
            name: 'BBQ Bacon Burger',
            description: 'Tocino crujiente, queso cheddar, cebolla caramelizada y salsa BBQ',
            price: 15.00,
            productionStation: 'kitchen',
            station: 'kitchen',
            isAvailable: true,
        },
    });

    await prisma.menuItem.create({
        data: {
            restaurantId: restaurant.id,
            categoryId: categoryBebidas.id,
            name: 'Cerveza IPA',
            description: 'Cerveza artesanal local',
            price: 6.00,
            productionStation: 'bar',
            station: 'bar',
            isAvailable: true,
        },
    });

    await prisma.menuItem.create({
        data: {
            restaurantId: restaurant.id,
            categoryId: categoryBebidas.id,
            name: 'Limonada Natural',
            description: 'Limonada fresca con hierbabuena',
            price: 4.00,
            productionStation: 'bar',
            station: 'bar',
            isAvailable: true,
        },
    });

    await prisma.menuItem.create({
        data: {
            restaurantId: restaurant.id,
            categoryId: categoryPostres.id,
            name: 'Brownie con Helado',
            description: 'Brownie de chocolate caliente con helado de vainilla',
            price: 8.00,
            productionStation: 'kitchen',
            station: 'kitchen',
            isAvailable: true,
        },
    });
    console.log('✅ Items del menú creados');

    // ========================================
    // SEGUNDO RESTAURANTE: Café Luna
    // ========================================
    const restaurant2 = await prisma.restaurant.create({
        data: {
            businessCode: 'CAFE-LUNA',
            name: 'Café Luna',
            taxId: '888888888',
            address: 'Av. Central 456, Ciudad Demo',
            status: 'active',
            config: JSON.stringify({
                currency: 'USD',
                service_charge: 5,
                open_hours: [{ day: 'Mon', open: '07:00', close: '20:00' }],
            }),
        },
    });
    console.log('✅ Restaurante 2 creado: CAFE-LUNA');

    // Área para Café Luna
    const area2 = await prisma.area.create({
        data: {
            name: 'Salón Principal',
            restaurantId: restaurant2.id
        },
    });
    console.log('✅ Área creada para Café Luna: Salón Principal');

    // Mesas para Café Luna
    await prisma.table.createMany({
        data: [
            { restaurantId: restaurant2.id, areaId: area2.id, tableNumber: 'C1', capacity: 2, posX: 50, posY: 50, currentStatus: 'free' },
            { restaurantId: restaurant2.id, areaId: area2.id, tableNumber: 'C2', capacity: 2, posX: 150, posY: 50, currentStatus: 'free' },
            { restaurantId: restaurant2.id, areaId: area2.id, tableNumber: 'C3', capacity: 4, posX: 50, posY: 150, currentStatus: 'free' },
            { restaurantId: restaurant2.id, areaId: area2.id, tableNumber: 'C4', capacity: 4, posX: 150, posY: 150, currentStatus: 'free' },
        ],
    });
    console.log('✅ Mesas creadas para Café Luna: C1, C2, C3, C4');

    // Empleados para Café Luna (solo mesero y chef)
    const cafe2Roles: EmployeeRole[] = ['manager', 'waiter', 'chef'];
    for (const role of cafe2Roles) {
        await prisma.employee.create({
            data: {
                restaurantId: restaurant2.id,
                fullName: `${role.charAt(0).toUpperCase() + role.slice(1)} Café Luna`,
                email: `${role}@cafeluna.com`,
                role: role,
                pinHash: pinHash,
                isActive: true,
            },
        });
        console.log(`✅ Empleado Café Luna: ${role}@cafeluna.com (Rol: ${role})`);
    }

    // Categorías de Menú para Café Luna
    const catBebidas2 = await prisma.menuCategory.create({
        data: { restaurantId: restaurant2.id, name: 'Cafés y Bebidas', sortOrder: 1 },
    });
    const catPasteles = await prisma.menuCategory.create({
        data: { restaurantId: restaurant2.id, name: 'Pasteles y Postres', sortOrder: 2 },
    });
    const catAlmuerzos = await prisma.menuCategory.create({
        data: { restaurantId: restaurant2.id, name: 'Almuerzos Ligeros', sortOrder: 3 },
    });

    // Menu Items para Café Luna
    await prisma.menuItem.createMany({
        data: [
            { restaurantId: restaurant2.id, categoryId: catBebidas2.id, name: 'Café Americano', description: 'Café filtrado tradicional', price: 2.50, station: 'bar', productionStation: 'bar', isAvailable: true },
            { restaurantId: restaurant2.id, categoryId: catBebidas2.id, name: 'Latte', description: 'Espresso con leche cremosa', price: 4.00, station: 'bar', productionStation: 'bar', isAvailable: true },
            { restaurantId: restaurant2.id, categoryId: catBebidas2.id, name: 'Cappuccino', description: 'Espresso con espuma de leche', price: 3.75, station: 'bar', productionStation: 'bar', isAvailable: true },
            { restaurantId: restaurant2.id, categoryId: catBebidas2.id, name: 'Té Verde', description: 'Té verde importado', price: 2.00, station: 'bar', productionStation: 'bar', isAvailable: true },
            { restaurantId: restaurant2.id, categoryId: catPasteles.id, name: 'Croissant', description: 'Croissant de mantequilla recién horneado', price: 3.00, station: 'kitchen', productionStation: 'kitchen', isAvailable: true },
            { restaurantId: restaurant2.id, categoryId: catPasteles.id, name: 'Cheesecake', description: 'Pastel de queso estilo NY', price: 5.50, station: 'kitchen', productionStation: 'kitchen', isAvailable: true },
            { restaurantId: restaurant2.id, categoryId: catPasteles.id, name: 'Muffin de Arándano', description: 'Muffin casero con arándanos', price: 2.75, station: 'kitchen', productionStation: 'kitchen', isAvailable: true },
            { restaurantId: restaurant2.id, categoryId: catAlmuerzos.id, name: 'Sandwich Club', description: 'Triple piso con pollo, tocino, lechuga y tomate', price: 8.50, station: 'kitchen', productionStation: 'kitchen', isAvailable: true },
            { restaurantId: restaurant2.id, categoryId: catAlmuerzos.id, name: 'Ensalada César', description: 'Lechuga romana, crutones, parmesano', price: 7.00, station: 'kitchen', productionStation: 'kitchen', isAvailable: true },
            { restaurantId: restaurant2.id, categoryId: catAlmuerzos.id, name: 'Wrap de Pollo', description: 'Tortilla con pollo grillado y vegetales', price: 6.50, station: 'kitchen', productionStation: 'kitchen', isAvailable: true },
        ],
    });
    console.log('✅ Menú de Café Luna creado (10 items)');

    // 9. Crear Reservas (Datos para Screenshots)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reservas para HOY
    await prisma.reservation.create({
        data: {
            restaurantId: restaurant.id,
            userId: user.id,
            tableId: null, // mesa asignable
            reservationTime: new Date(today.setHours(19, 0, 0, 0)),
            partySize: 4,
            status: 'confirmed',
        }
    });
    await prisma.reservation.create({
        data: {
            restaurantId: restaurant.id,
            userId: user.id,
            tableId: null,
            reservationTime: new Date(today.setHours(20, 30, 0, 0)),
            partySize: 2,
            status: 'confirmed',
        }
    });
    await prisma.reservation.create({
        data: {
            restaurantId: restaurant.id,
            userId: user.id,
            tableId: null,
            reservationTime: new Date(today.setHours(21, 0, 0, 0)),
            partySize: 6,
            status: 'confirmed',
        }
    });

    // Reservas PASADAS (para historial)
    await prisma.reservation.create({
        data: {
            restaurantId: restaurant.id,
            userId: user.id,
            tableId: null,
            reservationTime: new Date(yesterday.setHours(14, 0, 0, 0)),
            partySize: 3,
            status: 'seated', // ya fueron atendidos
        }
    });

    console.log('✅ Reservas de prueba creadas');

    // 10. Crear Pedidos Activos (Para vista de Cocina/Bar/Mesero)
    // Pedido en T2 (Mesa Ocupada)
    const orderT2 = await prisma.order.create({
        data: {
            restaurantId: restaurant.id,
            tableId: (await prisma.table.findFirst({ where: { restaurantId: restaurant.id, tableNumber: 'T2' } }))!.id,
            status: 'open',
            total: 45.50,
            waiterId: (await prisma.employee.findFirst({ where: { email: 'waiter@test.com' } }))!.id,
            orderItems: {
                create: [
                    { menuItemId: (await prisma.menuItem.findFirst({ where: { name: 'Classic Burger' } }))!.id, quantity: 2, status: 'cooking', station: 'kitchen' },
                    { menuItemId: (await prisma.menuItem.findFirst({ where: { name: 'Cerveza IPA' } }))!.id, quantity: 2, status: 'served', station: 'bar' }
                ]
            }
        }
    });

    // Pedido en T1 (Recién abierta)
    const orderT1 = await prisma.order.create({
        data: {
            restaurantId: restaurant.id,
            tableId: (await prisma.table.findFirst({ where: { restaurantId: restaurant.id, tableNumber: 'T1' } }))!.id,
            status: 'open',
            total: 12.00,
            waiterId: (await prisma.employee.findFirst({ where: { email: 'waiter@test.com' } }))!.id,
            orderItems: {
                create: [
                    { menuItemId: (await prisma.menuItem.findFirst({ where: { name: 'Limonada Natural' } }))!.id, quantity: 3, status: 'pending', station: 'bar' }
                ]
            }
        }
    });
    console.log('✅ Pedidos activos creados');

    // 11. Crear Reseñas (Para Dashboard)
    await prisma.review.create({
        data: {
            restaurantId: restaurant.id,
            userId: user.id,
            rating: 5,
            comment: '¡Increíble servicio y la comida deliciosa! Definitivamente volveré.',
            createdAt: yesterday
        }
    });
    await prisma.review.create({
        data: {
            restaurantId: restaurant.id,
            userId: user.id,
            rating: 4,
            comment: 'Muy buena ambiente, aunque tardaron un poco en traer la cuenta.',
            createdAt: new Date(yesterday.getTime() - 86400000)
        }
    });
    console.log('✅ Reseñas creadas');

    // 12. Crear Inventario (Para módulo de Inventario)
    await prisma.inventoryItem.create({
        data: {
            restaurantId: restaurant.id,
            name: 'Carne de Res Premium',
            unit: 'kg',
            currentStock: 25.5,
            minStock: 10,
            unitCost: 15.00,
            movements: {
                create: [
                    { type: 'in', quantity: 30, reason: 'Compra semanal' },
                    { type: 'out', quantity: 4.5, reason: 'Consumo diario' }
                ]
            }
        }
    });
    await prisma.inventoryItem.create({
        data: {
            restaurantId: restaurant.id,
            name: 'Cerveza IPA Barril',
            unit: 'litros',
            currentStock: 45,
            minStock: 20,
            unitCost: 3.50,
            movements: {
                create: [
                    { type: 'in', quantity: 50, reason: 'Reposición proveedor' },
                    { type: 'out', quantity: 5, reason: 'Venta servicio' }
                ]
            }
        }
    });
    // Más items de inventario
    const inventoryIngredients = ['Tomates', 'Lechuga', 'Pan Burger', 'Queso Cheddar', 'Papas'];
    for (const item of inventoryIngredients) {
        await prisma.inventoryItem.create({
            data: {
                restaurantId: restaurant.id,
                name: item,
                unit: 'unidad/kg',
                currentStock: Math.floor(Math.random() * 50) + 10,
                unitCost: Math.random() * 5,
            }
        });
    }
    console.log('✅ Inventario creado');


    // 13. Crear Perfil de Cliente (Para CRM)
    await prisma.customerProfile.create({
        data: {
            restaurantId: restaurant.id,
            userId: user.id,
            name: 'Juan Pérez (Cliente Frecuente)',
            email: 'cliente@test.com',
            phone: '+52 555 123 4567',
            isVIP: true,
            totalVisits: 15,
            lastVisit: yesterday,
            notes: 'Prefiere mesa cerca de la ventana. Alérgico a los mariscos.'
        }
    });
    console.log('✅ CRM Cliente creado');

    // 14. Crear Campaña de Marketing (Para Marketing)
    await prisma.marketingCampaign.create({
        data: {
            restaurantId: restaurant.id,
            title: 'Descuento de Viernes',
            body: '¡Ven este viernes y obtén 2x1 en cócteles!',
            targetSegment: 'Todos',
            sentAt: new Date(today.getTime() - 86400000 * 5) // enviado hace 5 días
        }
    });
    await prisma.marketingCampaign.create({
        data: {
            restaurantId: restaurant.id,
            title: 'Menú Especial Fin de Mes',
            body: 'Prueba nuestros nuevos cortes premium.',
            targetSegment: 'VIP',
            // Sin enviar (Borrador)
        }
    });

    // 15. Crear Logs de Actividad (Libro Diario)
    await prisma.activityLog.create({
        data: {
            restaurantId: restaurant.id,
            action: 'caja_apertura',
            description: 'Apertura de caja inicial',
            metadata: JSON.stringify({ amount: 500.00 }),
            createdAt: new Date(today.setHours(9, 0, 0, 0))
        }
    });
    await prisma.activityLog.create({
        data: {
            restaurantId: restaurant.id,
            action: 'inventario_ajuste',
            description: 'Ajuste manual de stock: Tomates',
            metadata: JSON.stringify({ itemId: '...', diff: -2 }),
            createdAt: new Date(today.setHours(11, 30, 0, 0))
        }
    });

    // 16. Crear una Factura (Billing)
    await prisma.invoice.create({
        data: {
            restaurantId: restaurant.id,
            invoiceNumber: 'INV-00123',
            customerName: 'Juan Pérez',
            subtotal: 45.50,
            tax: 7.28,
            total: 52.78,
            status: 'paid',
            createdAt: yesterday
        }
    });

    console.log('✅ Datos adicionales (Marketing, CRM, Libro Diario, Caja) creados');

    console.log('');
    console.log('================================================');
    console.log('🎉 BASE DE DATOS POBLADA CON ÉXITO');
    console.log('================================================');
    console.log('');
    console.log('🔑 CREDENCIALES DE ACCESO:');
    console.log('');
    console.log('   📱 CLIENTE:');
    console.log('      Email: cliente@test.com');
    console.log('      Password: password123');
    console.log('');
    console.log('   🔐 ADMINISTRADOR (Plataforma):');
    console.log('      Email: admin@reservaya.com');
    console.log('      Password: admin123');
    console.log('');
    console.log('   🏪 RESTAURANTE:');
    console.log('      Código: REST-TEST');
    console.log('      Nombre: ReservaYA Grill & Bar');
    console.log('');
    console.log('   👥 EMPLEADOS RESTAURANTE (PIN: 123456):');
    console.log('      • manager@test.com (Manager)');
    console.log('      • chef@test.com (Chef/Cocina)');
    console.log('      • waiter@test.com (Mesero)');
    console.log('      • host@test.com (Host/Recepción)');
    console.log('      • bartender@test.com (Bartender/Bar)');
    console.log('');
    console.log('================================================');
}

main()
    .catch((e) => {
        console.error('❌ Error ejecutando seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
