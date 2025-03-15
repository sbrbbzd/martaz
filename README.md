# Mart.az - Azerbaijan Online Marketplace

Mart.az is a comprehensive online classified ads marketplace for Azerbaijan, designed to connect buyers and sellers across the country.

## Project Structure

- **frontend/**: React.js web application with PWA capabilities
- **backend/**: Node.js/Express API server
- **config/**: Configuration files for different environments
- **docs/**: Project documentation
- **proposal/**: Original project proposal and planning documents

## Technologies

- **Frontend**: React.js, Redux, SCSS, Webpack
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Caching**: Redis
- **Search**: Elasticsearch
- **DevOps**: Docker, Kubernetes, CI/CD pipeline

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL (v13+)
- Redis
- Docker (optional for local development)

### Development Setup

1. Clone the repository
```
git clone https://github.com/your-organization/mart.az.git
cd mart.az
```

2. Install dependencies
```
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up the database
```
# Create database and tables
cd ../backend
npm run db:setup
```

4. Start the development servers
```
# Start backend server
cd ../backend
npm run dev

# Start frontend development server (in a new terminal)
cd ../frontend
npm start
```

5. Access the application
   - Backend API: http://localhost:3000/api
   - Frontend: http://localhost:8080

## Features

- User registration and authentication
- Listing creation and management
- Advanced search with filters
- Messaging system between users
- Multi-language support (Azerbaijani, Russian, English)
- Location-based search
- Responsive design for all devices

## License

This project is proprietary and confidential.

## Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com). # martaz
