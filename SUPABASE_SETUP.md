# Supabase Setup Guide for Mart.az

This guide provides step-by-step instructions for setting up and using Supabase as the database backend for Mart.az.

## Step 1: Create a Supabase Account and Project

1. Sign up for Supabase at [https://supabase.com/](https://supabase.com/) if you don't have an account yet.
2. Create a new project:
   - Name: `Mart.az` (or your preferred name)
   - Set a strong database password (save this for later)
   - Choose a region closest to your target audience
   - Click "Create new project"
3. Wait for the project to be created (can take a few minutes)

## Step 2: Get Your Database Connection Details

1. Go to Project Settings → Database → Connection Pooling
2. Note down the following connection information:
   - Host: usually in the format `[project-ref].supabase.co` (without the `db.` prefix)
   - Port: `5432`
   - Database Name: `postgres`
   - User: `postgres`
   - Password: the one you set when creating the project

## Step 3: Update Your Environment Configuration

1. Update your `.env.production` file with the Supabase credentials:

```
# Database Connection
DB_HOST=[YOUR_PROJECT_REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_DB_PASSWORD
DB_SSL=true
USE_SUPABASE=true
```

2. For local testing, copy the `.env.supabase` template:

```bash
cp .env.supabase .env.supabase.local
```

3. Update the `.env.supabase.local` file with your actual Supabase credentials.

## Step 4: Initialize Your Supabase Database

### Option 1: Run the setup script locally:

```bash
# Make sure you're in the backend directory
cd backend

# Run the setup script with the Supabase environment
NODE_ENV=supabase npm run supabase:setup
```

### Option 2: Deploy directly to Render:

1. Update your `render.yaml` file with your Supabase credentials (replace the placeholder values)
2. Commit and push your changes
3. Deploy to Render

## Step 5: Test Your Connection

To test that your application can connect to Supabase:

```bash
# Run with Supabase config
NODE_ENV=supabase node test-supabase-connection.js
```

## Troubleshooting

### Connection Issues

1. **SSL Problems**: Supabase requires SSL. Make sure `DB_SSL=true` is set.
2. **Wrong Credentials**: Double-check your host, username, and password.
3. **Host Format**: Make sure you're using the correct host format: `[project-ref].supabase.co`
4. **IP Restrictions**: By default, Supabase allows connections from any IP. If you've changed this, make sure your server's IP is allowed.

### Schema Issues

If your application has problems with the database schema:

```bash
# Force reset the database schema (WARNING: This will delete all data)
NODE_ENV=supabase npm run supabase:reset
```

## Database Management

### Migrations

Run migrations on Supabase:

```bash
NODE_ENV=supabase npm run supabase:migrate
```

### Seeding

Seed your Supabase database with initial data:

```bash
NODE_ENV=supabase npm run supabase:seed
```

## Monitoring and Debugging

1. Check your application logs for database connection issues
2. In the Supabase dashboard, go to Database → API to see active connections
3. Check Query Performance in the Supabase dashboard under Database → Performance

## Switching Back to Render PostgreSQL

If needed, you can switch back to the Render PostgreSQL database by removing the `USE_SUPABASE=true` environment variable and updating your database connection details to point back to the Render database.

## Security Considerations

1. Never commit your actual Supabase credentials to your repository
2. Consider using environment variables in Render's dashboard instead of hardcoding them in `render.yaml`
3. Regularly rotate your database password for additional security 