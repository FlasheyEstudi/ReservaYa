
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DEBUG LOGIN START ---');

    const email = 'manager@test.com';
    const inputPin = '123456';

    console.log(`Checking Employee: ${email}`);

    const employee = await prisma.employee.findFirst({
        where: { email: email }
    });

    if (!employee) {
        console.log('❌ Employee NOT FOUND in database.');
    } else {
        console.log('✅ Employee FOUND:');
        console.log(`   ID: ${employee.id}`);
        console.log(`   Details: ${JSON.stringify(employee, null, 2)}`);
        console.log(`   Role: '${employee.role}' (Expected: 'manager')`);

        // Check credentials logic from api/auth/login/route.ts
        // It filters by role='manager'
        if (employee.role !== 'manager') {
            console.log(`❌ Role mismatch! Query expects 'manager', got '${employee.role}'`);
        } else {
            console.log(`✅ Role matches 'manager'`);
        }

        console.log('--- Verifying PIN ---');
        console.log(`   Input PIN: ${inputPin}`);
        console.log(`   Stored Hash: ${employee.pinHash}`);

        const isValid = await bcrypt.compare(inputPin, employee.pinHash);
        console.log(`   Match Result: ${isValid ? '✅ VALID MATCH' : '❌ INVALID MATCH'}`);

        if (!isValid) {
            console.log('   Attempting to re-hash 123456 to see what it looks like...');
            const newHash = await bcrypt.hash(inputPin, 10);
            console.log(`   New Hash: ${newHash}`);
        }
    }

    // Also check Admin just in case
    console.log('\nChecking Admin: admin@reservaya.com');
    const admin = await prisma.admin.findUnique({ where: { email: 'admin@reservaya.com' } });
    if (admin) {
        console.log('✅ Admin found');
        const validAdmin = await bcrypt.compare('admin123', admin.passwordHash);
        console.log(`   Password 'admin123' valid: ${validAdmin}`);
    } else {
        console.log('❌ Admin not found');
    }

    console.log('--- DEBUG LOGIN END ---');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
