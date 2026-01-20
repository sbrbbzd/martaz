# Admin User Management

## Default Admin User

When the database is initialized, a default admin user is automatically created with the following credentials:

- **Email**: `admin@mart.az`
- **Password**: `admin123`
- **Phone**: `+994501234567`
- **Role**: `admin`
- **Status**: `active`

⚠️ **IMPORTANT**: Change this password immediately in production!

## Creating Additional Admin Users

### Method 1: Interactive Script (Recommended)

Run the interactive script to create a new admin user:

```bash
cd backend
npm run admin:create
```

You will be prompted to enter:
- First Name
- Last Name
- Email
- Password
- Phone (optional)

### Method 2: Using the Seeder

You can modify the seeder file at `backend/src/seeders/seed-admin.js` to create additional admin users, then run:

```bash
cd backend
npm run db:seed
```

### Method 3: Direct Database Query

If you have direct database access, you can create an admin user with SQL:

```sql
-- First, hash your password using bcrypt (cost factor 10)
-- For example, 'admin123' becomes: $2a$10$ywMNY5xyRABjDu/OGtS.XuI5rc2t0RFFRooBr0hQBt2mCpMQYQQPK

INSERT INTO users (
  id,
  email,
  password,
  "firstName",
  "lastName",
  phone,
  role,
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'your-email@example.com',
  '$2a$10$ywMNY5xyRABjDu/OGtS.XuI5rc2t0RFFRooBr0hQBt2mCpMQYQQPK', -- This is 'admin123'
  'Your',
  'Name',
  '+994501234567',
  'admin',
  'active',
  NOW(),
  NOW()
);
```

### Method 4: Via API (After Authentication System is Set Up)

Once your authentication endpoints are ready, you can create admin users programmatically through the API.

## Changing Admin Password

### Quick Reset to Default Password

To reset the admin password back to `admin123`:

```bash
cd backend
npm run admin:reset-password
```

This will reset the password for `admin@mart.az` to `admin123`.

### Manual Password Change

To change an admin user's password:

1. **Via Database**:
```sql
-- First generate a bcrypt hash for your new password
-- You can use the generate-hash.js script:
-- node scripts/generate-hash.js

-- Then update the database:
UPDATE users 
SET password = '$2a$10$YOUR_HASHED_PASSWORD_HERE'
WHERE email = 'admin@mart.az';
```

2. **Via API**: Use the password reset or update password endpoint (when implemented)

### Generate Password Hash

To generate a bcrypt hash for a password:

```bash
cd backend
node scripts/generate-hash.js
# This will output a hash you can use in SQL or scripts
```

## User Roles

The system supports the following roles:
- `user` - Regular user (default)
- `admin` - Administrator with full access

## Security Best Practices

1. ✅ Always use strong passwords for admin accounts
2. ✅ Change default passwords immediately in production
3. ✅ Use environment variables for sensitive data
4. ✅ Implement 2FA for admin accounts (recommended)
5. ✅ Regularly audit admin user access
6. ✅ Use unique emails for each admin user
7. ✅ Disable or delete unused admin accounts

## Troubleshooting

### Admin user not found
If the admin user wasn't created during initialization, run:
```bash
cd backend
FORCE_INIT=true node src/database/init.js
```

### Password not working
Make sure you're using the correct password. The default is `admin123`. If you changed it, use your new password.

### Can't login
Check that:
1. The user's `status` is `active`
2. The user's `role` is `admin`
3. The password is correctly hashed
4. Your authentication endpoints are working correctly
