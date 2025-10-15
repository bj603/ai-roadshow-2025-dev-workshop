# Workspace Reservation System

A Vue 3 + TypeScript + Vite frontend with Express.js backend demonstrating a full-stack authentication flow with role-based access.

## Architecture

- **Frontend**: Vue 3 with Composition API (`<script setup>`), Vue Router, TypeScript
- **Backend**: Express.js + Node.js with JWT authentication and CORS support
- **Build Tool**: Vite with TypeScript compilation via `vue-tsc`

## Quick Start

### 1. Install Dependencies
```bash
# Install all dependencies (frontend + backend)
npm run setup

# Or install separately:
npm install                # Frontend dependencies
npm run server:install     # Backend dependencies
```

### 2. Run Development Servers
```bash
# Run both frontend and backend together (recommended)
npm run dev:full

# Or run them separately:
npm run server:dev  # Backend on http://localhost:3001
npm run dev         # Frontend on http://localhost:5173
```

### 3. Open Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## Demo Credentials

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123  
- **User**: user@example.com / user123

## Available Scripts

### Frontend Scripts
- `npm run dev` - Start Vite dev server (port 5173)
- `npm run build` - TypeScript compilation + Vite production build
- `npm run preview` - Preview production build

### Backend Scripts
- `npm run server:dev` - Start Express server in development mode
- `npm run server:build` - Compile TypeScript backend to JavaScript
- `npm run server:start` - Start compiled production server
- `npm run server:install` - Install backend dependencies

### Combined Scripts
- `npm run setup` - Install all dependencies (frontend + backend)
- `npm run dev:full` - Run both frontend and backend concurrently

## API Endpoints

### Public Endpoints
- **POST** `/api/auth` - User authentication
- **GET** `/api/health` - Health check
- **GET** `/api/version` - API version info

### Protected Endpoints (Require JWT Token)
- **GET** `/api/profile` - Get user profile

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Environment Configuration

Create a `.env` file in the root directory:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# For production, update to your deployed backend URL
# VITE_API_BASE_URL=https://your-production-api.com
```

## Project Structure

```
├── src/                    # Vue.js frontend source
│   ├── components/         # Reusable Vue components
│   ├── services/           # API layer and utilities
│   │   ├── api.ts          # API service functions
│   │   └── auth.ts         # Authentication utilities
│   ├── views/              # Route components (pages)
│   │   ├── Login.vue       # Login page
│   │   └── Welcome.vue     # Dashboard/welcome page
│   ├── router/             # Vue Router setup
│   │   └── index.ts        # Route definitions and guards
│   ├── App.vue             # Root Vue component
│   └── main.ts             # Application entry point
├── server/                 # Express.js backend
│   ├── src/
│   │   └── server.ts       # Main Express server file
│   ├── package.json        # Backend dependencies
│   └── tsconfig.json       # Backend TypeScript config
├── public/                 # Static assets
├── .env                    # Environment variables
├── package.json            # Frontend dependencies and scripts
└── README.md              # This file
```

## Technology Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vue Router** - Client-side routing
- **Vite** - Fast build tool and dev server
- **Composition API** - Modern Vue development pattern

### Backend
- **Express.js** - Web framework for Node.js
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **JWT** - JSON Web Tokens for authentication
- **CORS** - Cross-origin resource sharing middleware

## Development Features

### Authentication Flow
- JWT-based authentication with 24-hour token expiration
- Role-based access control (admin, manager, user)
- Protected routes with router guards
- Persistent login state using localStorage

### API Integration
- Centralized API service layer (`src/services/api.ts`)
- Automatic Bearer token inclusion for protected routes
- Consistent error handling across all API calls
- CORS-enabled backend for cross-origin requests

### Development Experience
- Hot module replacement (HMR) for frontend development
- TypeScript compilation and type checking
- Concurrent frontend and backend development
- Mock user data for immediate testing

## Production Deployment

### Frontend (Static Files)
Build the frontend for production:
```bash
npm run build
```
Deploy the `dist/` folder to any static hosting service.

### Backend (Node.js Server)
Compile and start the backend:
```bash
npm run server:build
npm run server:start
```

### Environment Variables for Production
Update your production `.env` file:
```env
VITE_API_BASE_URL=https://your-production-api.com
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret
PORT=3001
```

## Testing the Setup

1. **Health Check**: Visit http://localhost:3001/api/health
2. **Login Test**: Use any demo credentials on the login page
3. **API Test**: Try the profile endpoint after logging in

## Troubleshooting

### Common Issues

**Port conflicts**: If port 3001 or 5173 is in use, the applications will try alternative ports.

**CORS errors**: Ensure the backend is running and the `VITE_API_BASE_URL` matches your backend URL.

**Authentication issues**: Check that JWT tokens are properly stored in localStorage and included in API requests.

### Getting Help

1. Check the browser console for client-side errors
2. Check the backend terminal output for server-side errors
3. Verify environment variables are properly set
4. Ensure both frontend and backend dependencies are installed

## License

This project is for educational purposes as part of the AI Roadshow 2025 Developer Workshop.
