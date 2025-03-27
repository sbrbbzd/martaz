# Mart.az Backend

This is the backend API for the Mart.az marketplace application.

## Database Configuration

The application supports two database backends:

1. **Direct PostgreSQL** (Default): Uses Sequelize ORM to connect directly to PostgreSQL.
2. **Supabase**: Uses Supabase API for database access with a Sequelize-compatible adapter.

### Using Supabase

To use Supabase as your database backend:

1. Create a `.env.supabase` file with your Supabase credentials:

```
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

2. Run the Supabase check script to verify your connection:

```bash
npm run supabase:check
```

3. Test the application with Supabase integration:

```bash
npm run supabase:test
```

4. To run the application with Supabase:

```bash
NODE_ENV=production USE_SUPABASE=true npm start
```

## Available Scripts

- `npm start`: Start the server in development mode
- `npm run dev`: Start the server with nodemon for auto-reload
- `npm test`: Run tests
- `npm run db:migrate`: Run database migrations
- `npm run db:seed`: Seed the database with initial data
- `npm run supabase:check`: Check Supabase connection
- `npm run supabase:test`: Test application with Supabase integration

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```
# Database Configuration
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=mart-az
DB_HOST=localhost
DB_PORT=5432

# JWT Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Server
PORT=5000
NODE_ENV=development
```

For Supabase configuration, create a `.env.supabase` file with:

```
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

## API Documentation

API endpoints are documented using Swagger UI and available at `/api-docs` when running the server. 