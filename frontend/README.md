## Environment Variables

The application uses environment variables for configuration. These are loaded from `.env` files in the root directory.

Create a `.env` file in the frontend directory with the following variables:

```
# API URLs
VITE_API_URL=http://localhost:3000/api
VITE_IMAGE_SERVER_URL=http://localhost:3001/api/images

# Other configuration
NODE_ENV=development
```

You can adjust these values according to your environment. For example, in production, you would set:

```
VITE_API_URL=https://yourapi.com/api
VITE_IMAGE_SERVER_URL=https://images.yourapi.com/api/images
NODE_ENV=production
``` 