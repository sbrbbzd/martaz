# Image Upload Architecture

This document describes the image upload architecture for Mart.az.

## Overview

The application uses a dedicated image server for handling image uploads and serving images. This separation provides several benefits:

1. **Scalability**: The image server can be scaled independently from the main backend
2. **Performance**: Dedicated server for handling static files
3. **Security**: Separate service with focused security rules for file uploads
4. **Maintenance**: Easier to maintain and upgrade the image handling logic

## Architecture Components

### 1. Image Server

Located in the `image-server` directory, this is a dedicated Express.js server that:

- Runs on port 3001
- Handles file uploads
- Serves static images 
- Stores files in a dedicated directory
- Provides endpoints for checking file existence

Key endpoints:
- `POST /upload` - Accepts image uploads
- `GET /images/:filename` - Serves images
- `GET /check/:filename` - Checks if an image exists
- `GET /test` - Tests if the server is running

### 2. Frontend Image Service

The frontend uses a dedicated service (`imageServer.ts`) for communicating with the image server.

Key functions:
- `uploadImagesToServer()` - Uploads images directly to the image server
- `checkImageExists()` - Checks if an image exists on the server
- `getImageServerUrl()` - Constructs proper image URLs

### 3. Backend Integration

The backend's listing controller processes upload requests and:
- Saves files to disk
- Updates database records with image paths
- Handles error cases

## Image Upload Flow

1. **User selects images** in the CreateListing or EditListing page
2. **Frontend uploads images** directly to the image server using `uploadImagesToServer()`
3. **Image server saves files** and returns paths in the format `/tmp/filename.jpg`
4. **Frontend updates the listing** with these image paths through the backend API
5. **Frontend displays images** using the `getImageUrl()` utility

## Configuration

The image server is configured in `image-server/server.js`:
- Storage location: `/Users/sabirbabazade/Mart.az/tmp`
- File size limits: 10MB per file
- File count limit: 10 files per upload
- Accepted types: All image types (mimetype starting with 'image/')

## Security Considerations

- **File type validation**: Only image files are accepted
- **Size limits**: Prevents large file uploads
- **CORS configuration**: Controls which domains can interact with the image server
- **Error handling**: Proper error responses for invalid uploads

## Future Improvements

1. Add authentication to the image server
2. Implement image optimization (compression, resizing)
3. Add CDN integration
4. Support for more advanced upload features (progress tracking, resumable uploads)
5. Add image metadata storage 