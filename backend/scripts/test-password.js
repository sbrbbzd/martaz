const bcrypt = require('bcryptjs');

const storedHash = '$2a$10$ywMNY5xyRABjDu/OGtS.XuI5rc2t0RFFRooBr0hQBt2mCpMQYQQPK';
const password = 'admin123';

bcrypt.compare(password, storedHash)
    .then(result => {
        console.log('Password match:', result);
        if (result) {
            console.log('✅ Password "admin123" matches the stored hash');
        } else {
            console.log('❌ Password "admin123" does NOT match the stored hash');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
