# AI Coding Agent Instructions


# POC Development Guidelines

**This is a POC (Proof of Concept) environment.** Focus on rapid development and demonstrating functionality. Don't write tests, extensive logging, complex validation frameworks, or production-level architecture. Prioritize features over perfection.

## Verification Guidelines

- **NEVER write test scripts** to verify the result
- **NEVER test with the server running** - no manual testing with curl, Invoke-WebRequest, or similar tools
- **NEVER run the app** (`npm start`, `ng serve`, etc.) - only build it
- **NEVER write documentation** about changes or features
- When work is complete, simply **build the app** to verify:
  - For frontend: `npm run build` - TypeScript compilation + Vite production build
  - For backend: `npm run server:build` - Compile TypeScript backend to JavaScript
- **If it builds successfully, it's done** - no further verification needed

## Project Architecture

This is a **Workspace Reservation System** built with Vue 3 + TypeScript + Vite frontend and Express.js + Node.js backend. The app demonstrates a full-stack authentication flow with role-based access.

### Key Components

- **Frontend**: Vue 3 with Composition API (`<script setup>`), Vue Router, TypeScript
- **Backend**: Express.js + Node.js with JWT authentication and CORS support
- **Build Tool**: Vite with TypeScript compilation via `vue-tsc`

## Critical Patterns

### API Integration Pattern
The `src/services/api.ts` uses centralized helper functions that:
- Constructs local API URLs: `${API_BASE_URL}/api/${endpoint}`
- Automatically includes Bearer token authentication for protected routes
- Handles CORS and content-type headers consistently

```typescript
// Public API calls
const response = await callAPI('endpoint', options);

// Protected API calls (with JWT token)
const response = await callProtectedAPI('endpoint', options);
```

### Authentication Flow
Authentication uses localStorage for persistence with router guards:
- `src/services/auth.ts` manages token/user storage
- `src/router/index.ts` implements route protection via `beforeEach` guard
- Routes with `meta: { requiresAuth: true }` require valid tokens
- Backend uses JWT tokens for authentication with 24-hour expiration

### Express.js Backend Structure
The backend in `server/src/server.ts` follows these patterns:
- CORS middleware for cross-origin requests
- JWT-based authentication with middleware protection
- RESTful API endpoints under `/api/` prefix
- Mock user data for demonstration purposes

## Development Workflows

### Local Development
```bash
npm run setup      # Install all dependencies
npm run dev:full   # Start both frontend and backend
npm run dev        # Start Vite dev server only (port 5173)
npm run server:dev # Start Express server only (port 3001)
npm run build      # TypeScript compilation + Vite build
npm run preview    # Preview production build
```

### Demo Credentials
The system includes hardcoded demo users in `server/src/server.ts`:
- `admin@example.com / admin123` (admin role)
- `manager@example.com / manager123` (manager role)  
- `user@example.com / user123` (user role)

### Environment Configuration
- Environment vars are Vite-prefixed: `VITE_API_BASE_URL`
- Accessed via `import.meta.env.VITE_*` (not `process.env`)
- Default API base URL: `http://localhost:3001`

## File Organization Conventions

- **Views**: Route components in `src/views/` (Login.vue, Welcome.vue)
- **Services**: API layer in `src/services/` (api.ts, auth.ts)
- **Router**: Single router file `src/router/index.ts` with route guards
- **Backend**: Express server in `server/src/server.ts`

## Integration Points

### Frontend ↔ Backend Communication
- Frontend calls Express API via the `api` service
- All protected requests include JWT Bearer tokens
- Error handling includes parsing JSON error responses with `error.detail`

### State Management
- No Vuex/Pinia - uses local component state + localStorage
- Authentication state managed through `authService` utilities
- Router navigation based on authentication status

## TypeScript Configuration
- Uses Vue 3 TypeScript setup with separate configs:
  - `tsconfig.json` - Base configuration
  - `tsconfig.app.json` - App-specific settings
  - `tsconfig.node.json` - Node/Vite tooling
- Backend uses separate TypeScript config in `server/tsconfig.json`

When working with this codebase, always consider the full-stack nature and ensure frontend changes align with the Express.js backend API structure.