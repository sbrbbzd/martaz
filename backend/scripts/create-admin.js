const { User } = require('../src/models');
const bcrypt = require('bcryptjs');
const logger = require('../src/utils/logger');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
    try {
        console.log('\n=== Create Admin User ===\n');

        // Get user input
        const firstName = await question('First Name: ');
        const lastName = await question('Last Name: ');
        const email = await question('Email: ');
        const password = await question('Password: ');
        const phone = await question('Phone (optional): ');

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            logger.error('❌ First name, last name, email, and password are required');
            process.exit(1);
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            logger.error(`❌ User with email ${email} already exists`);
            process.exit(1);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone: phone || null,
            role: 'admin',
            status: 'active'
        });

        logger.success(`✅ Admin user created successfully!`);
        logger.info(`Email: ${email}`);
        logger.info(`Name: ${firstName} ${lastName}`);
        logger.info(`Role: admin`);

        process.exit(0);
    } catch (error) {
        logger.error(`❌ Error creating admin user: ${error.message}`);
        logger.error(error.stack);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run the script
createAdminUser();
