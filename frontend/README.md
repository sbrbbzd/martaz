# Mart.az Frontend

This is the frontend application for Mart.az, a marketplace platform for Azerbaijan.

## Features

- User authentication and profile management
- Listing creation and management
- Search and filtering
- Category navigation
- Favorites and saved searches
- Messaging between users
- Responsive design for mobile and desktop

## Technologies

- Next.js / React
- Tailwind CSS
- Redux Toolkit for state management
- Supabase for database and storage

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```
# Supabase client-side credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Other configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3001](http://localhost:3001) in your browser to see the app.

## Supabase Integration

This frontend uses Supabase for:

1. **Database**: All data is stored in Supabase PostgreSQL
2. **Storage**: Images and files are stored in Supabase Storage
3. **Authentication**: (Optional) User authentication can be handled by Supabase Auth
4. **Realtime**: (Optional) Real-time updates for messages and notifications

To initialize the Supabase client in your components:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Example query
const { data, error } = await supabase
  .from('listings')
  .select('*')
  .eq('status', 'active')
```

## Deployment

This application is configured to deploy on Render.com. The deployment process is handled by the `render.yaml` file in the project root. 