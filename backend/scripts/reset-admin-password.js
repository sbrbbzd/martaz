const { User } = require('../src/models');
const { sequelize } = require('../src/database/connection');
const bcrypt = require('bcryptjs');
const logger = require('../src/utils/logger');

async function resetAdminPassword() {
    try {
        console.log('\n=== Reset Admin Password ===\n');

        // Find admin user
        const admin = await User.findOne({
            where: { email: 'admin@mart.az' }
        });

        if (!admin) {
            logger.error('❌ Admin user not found');
            process.exit(1);
        }

        // Generate new password hash
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password directly in database to bypass beforeUpdate hook
        await sequelize.query(
            'UPDATE users SET password = :password, "updatedAt" = NOW() WHERE email = :email',
            {
                replacements: { password: hashedPassword, email: 'admin@mart.az' }
            }
        );

        // Reload user to get updated password
        await admin.reload();

        // Verify the update
        const isValid = await bcrypt.compare(password, admin.password);

        if (isValid) {
            logger.success('✅ Admin password reset successfully!');
            logger.info('Email: admin@mart.az');
            logger.info('Password: admin123');
            logger.warn('⚠️  Please change this password after logging in!');
        } else {
            logger.error('❌ Password verification failed');
        }

        process.exit(0);
    } catch (error) {
        logger.error(`❌ Error resetting admin password: ${error.message}`);
        logger.error(error.stack);
        process.exit(1);
    }
}

// Run the script
resetAdminPassword();
