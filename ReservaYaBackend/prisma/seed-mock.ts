import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de datos masivos (MOCKUP)...');

    // 1. Limpiar datos existentes
    console.log('🧹 Limpiando base de datos...');
    try {
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.reservation.deleteMany();
        await prisma.table.deleteMany();
        await prisma.menuItem.deleteMany();
        await prisma.menuCategory.deleteMany();
        await prisma.review.deleteMany();
        await prisma.restaurant.deleteMany();
        await prisma.user.deleteMany();
    } catch (e) {
        console.log('⚠️ Error limpiando, continuando...', e);
    }

    // 2. Hash de contraseñas
    const passwordHash = await bcrypt.hash('password123', 10);

    // 3. Crear Usuarios (20 usuarios)
    console.log('👥 Creando usuarios...');
    const users = [];
    for (let i = 1; i <= 20; i++) {
        const user = await prisma.user.create({
            data: {
                email: `usuario${i}@test.com`,
                passwordHash,
                fullName: `Cliente ${i} Mockup`,
                phone: `555-00${i.toString().padStart(2, '0')}`,
                preferences: JSON.stringify({
                    diet: i % 3 === 0 ? ['vegetarian'] : [],
                    allergies: i % 5 === 0 ? ['nuts'] : []
                }),
            },
        });
        users.push(user);
    }

    // 4. Crear Restaurantes con temas diversos
    console.log('🍽️ Creando restaurantes...');

    const restaurantThemes = [
        {
            name: 'La Trattoria Romana',
            category: 'Italiana',
            image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200',
            desc: 'Auténtica pasta fresca y pizzas al horno de leña.',
            menu: [
                { name: 'Spaghetti Carbonara', price: 18.50, cat: 'Pasta' },
                { name: 'Pizza Margherita', price: 15.00, cat: 'Pizza' },
                { name: 'Tiramisu', price: 8.00, cat: 'Postres' },
                { name: 'Lasagna Bolognese', price: 22.00, cat: 'Pasta' }
            ]
        },
        {
            name: 'Sakura Sushi Bar',
            category: 'Japonesa',
            image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=1200',
            desc: 'El mejor sushi de la ciudad con pescado fresco diario.',
            menu: [
                { name: 'Dragon Roll', price: 12.00, cat: 'Sushi' },
                { name: 'Sashimi Mix', price: 25.00, cat: 'Sashimi' },
                { name: 'Miso Soup', price: 5.00, cat: 'Entradas' },
                { name: 'Ramen Tonkotsu', price: 16.00, cat: 'Ramen' }
            ]
        },
        {
            name: 'El Asador Argentino',
            category: 'Carnes',
            image: 'https://images.unsplash.com/photo-1544025162-d76690b6d029?w=1200',
            desc: 'Cortes premium a la parrilla y vinos selectos.',
            menu: [
                { name: 'Bife de Chorizo', price: 35.00, cat: 'Carnes' },
                { name: 'Empanadas', price: 4.00, cat: 'Entradas' },
                { name: 'Vino Malbec', price: 45.00, cat: 'Bebidas' },
                { name: 'Parrillada Mixta', price: 60.00, cat: 'Carnes' }
            ]
        },
        {
            name: 'Green & Fresh',
            category: 'Saludable',
            image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200',
            desc: 'Bowls, ensaladas y jugos naturales.',
            menu: [
                { name: 'Quinoa Bowl', price: 14.00, cat: 'Bowls' },
                { name: 'Avocado Toast', price: 10.00, cat: 'Desayuno' },
                { name: 'Green Detox Juice', price: 6.00, cat: 'Bebidas' },
                { name: 'Vegan Burger', price: 16.00, cat: 'Principal' }
            ]
        },
        {
            name: 'Tacos & Tequila',
            category: 'Mexicana',
            image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200',
            desc: 'Los tacos más picantes y auténticos.',
            menu: [
                { name: 'Tacos al Pastor', price: 12.00, cat: 'Tacos' },
                { name: 'Guacamole', price: 8.00, cat: 'Entradas' },
                { name: 'Margarita', price: 10.00, cat: 'Bebidas' },
                { name: 'Enchiladas', price: 14.00, cat: 'Principal' }
            ]
        }
    ];

    for (const theme of restaurantThemes) {
        const rest = await prisma.restaurant.create({
            data: {
                name: theme.name,
                businessCode: theme.name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000),
                address: `Calle ${theme.category} 123`,
                status: 'active',
                description: theme.desc,
                category: theme.category,
                image: theme.image,
                phone: '555-' + Math.floor(Math.random() * 9000 + 1000),
                config: JSON.stringify({ currency: 'USD' }),
            }
        });

        // Mesas
        await prisma.table.createMany({
            data: Array.from({ length: 10 }).map((_, i) => ({
                restaurantId: rest.id,
                tableNumber: `M${i + 1}`,
                capacity: i % 2 === 0 ? 2 : 4,
                currentStatus: 'free'
            }))
        });

        // Menú
        const cats = [...new Set(theme.menu.map(m => m.cat))];
        for (const catName of cats) {
            const cat = await prisma.menuCategory.create({
                data: {
                    name: catName,
                    restaurantId: rest.id
                }
            });

            const items = theme.menu.filter(m => m.cat === catName);
            await prisma.menuItem.createMany({
                data: items.map(item => ({
                    name: item.name,
                    description: `Delicioso ${item.name} preparado al momento`,
                    price: item.price,
                    category: catName,
                    restaurantId: rest.id,
                    categoryId: cat.id,
                    image: `https://source.unsplash.com/400x300/?food,${item.name.replace(' ', ',')}`
                }))
            });
        }

        // Reseñas (5-10 por restaurante)
        const reviewCount = Math.floor(Math.random() * 6) + 5;
        for (let j = 0; j < reviewCount; j++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            await prisma.review.create({
                data: {
                    restaurantId: rest.id,
                    userId: randomUser.id,
                    rating: Math.floor(Math.random() * 3) + 3, // 3-5 estrellas
                    comment: `Excelente experiencia en ${theme.name}. La comida estuvo deliciosa.`,
                }
            });
        }
    }

    console.log('✅ Mockup masivo completado.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
