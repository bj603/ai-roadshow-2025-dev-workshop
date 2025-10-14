# AI Coding Agent Instructions

## Project Architecture

This is a **Workspace Reservation System** built with Vue 3 + TypeScript + Vite frontend and Supabase Edge Functions backend. The app demonstrates a full-stack authentication flow with role-based access.

### Key Components

- **Frontend**: Vue 3 with Composition API (`<script setup>`), Vue Router, TypeScript
- **Backend**: Supabase Edge Functions (Deno runtime) with mock authentication
- **Build Tool**: Vite with TypeScript compilation via `vue-tsc`

## Critical Patterns

### API Integration Pattern
The `src/services/api.ts` uses a centralized `callEdgeFunction` helper that:
- Constructs Supabase Edge Function URLs: `${SUPABASE_URL}/functions/v1/${functionName}`
- Automatically includes Bearer token authentication with `SUPABASE_ANON_KEY`
- Handles CORS and content-type headers consistently

```typescript
// All API calls follow this pattern
const response = await callEdgeFunction('functionName', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### Authentication Flow
Authentication uses localStorage for persistence with router guards:
- `src/services/auth.ts` manages token/user storage
- `src/router/index.ts` implements route protection via `beforeEach` guard
- Routes with `meta: { requiresAuth: true }` require valid tokens

### Supabase Edge Functions Structure
Functions in `supabase/functions/` follow consistent patterns:
- CORS headers defined as constants for reuse
- OPTIONS method handling for preflight requests  
- Deno runtime with JSR imports: `import "jsr:@supabase/functions-js/edge-runtime.d.ts"`

## Development Workflows

### Local Development
```bash
npm run dev        # Start Vite dev server (port 5173)
npm run build      # TypeScript compilation + Vite build
npm run preview    # Preview production build
```

### Demo Credentials
The system includes hardcoded demo users in `supabase/functions/auth/index.ts`:
- `admin@example.com / admin123` (admin role)
- `manager@example.com / manager123` (manager role)  
- `user@example.com / user123` (user role)

### Environment Configuration
- Environment vars are Vite-prefixed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Accessed via `import.meta.env.VITE_*` (not `process.env`)

## File Organization Conventions

- **Views**: Route components in `src/views/` (Login.vue, Welcome.vue)
- **Services**: API layer in `src/services/` (api.ts, auth.ts)
- **Router**: Single router file `src/router/index.ts` with route guards
- **Edge Functions**: Each function in separate `supabase/functions/{name}/index.ts`

## Integration Points

### Frontend ↔ Backend Communication
- Frontend calls edge functions via the `api` service
- All requests include Supabase anon key for authentication
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

When working with this codebase, always consider the full-stack nature and ensure frontend changes align with the mock backend data structure.