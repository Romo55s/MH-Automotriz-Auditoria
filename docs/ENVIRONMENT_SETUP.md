# Environment Configuration

This document explains how to configure environment variables for the Car Inventory App.

## Environment Variables

The application uses environment variables to configure the backend API and other settings. Since `.env` files may be blocked in some environments, the configuration is managed through the `src/config/environment.ts` file.

### Required Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Backend API Configuration
# IMPORTANT: Do NOT include /api in the base URL - it's added automatically
REACT_APP_API_BASE_URL=http://localhost:5000

# Environment
NODE_ENV=development

# Optional: API timeout (milliseconds)
REACT_APP_API_TIMEOUT=30000
```

### Production Configuration

For production deployment, set these environment variables:

```bash
# Production Backend API
# IMPORTANT: Do NOT include /api in the base URL - it's added automatically
REACT_APP_API_BASE_URL=https://your-production-api.com

# Production Environment
NODE_ENV=production
```

### Auth0 Configuration (Optional)

If using Auth0 authentication:

```bash
REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=your-api-audience
```

## Configuration File

The `src/config/environment.ts` file centralizes all environment configuration:

```typescript
export const config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  // ... other configurations
};
```

## Usage in Components

Import configuration values:

```typescript
import { API_BASE_URL, IS_PRODUCTION } from '../config/environment';

// Use in your components
const apiUrl = `${API_BASE_URL}/api/endpoint`;
```

## Local Development

1. Copy `.env.example` to `.env.local` (if available)
2. Update `REACT_APP_API_BASE_URL` to match your backend server
3. Restart the development server

## Deployment

### Netlify
Set environment variables in the Netlify dashboard under Site Settings > Environment Variables.

### Vercel
Set environment variables in the Vercel dashboard under Project Settings > Environment Variables.

### Other Platforms
Consult your hosting platform's documentation for setting environment variables.

## Troubleshooting

### API Connection Issues

1. **Check the API URL**: Ensure `REACT_APP_API_BASE_URL` points to the correct backend server
2. **Double /api Prefix**: Make sure your base URL does NOT include `/api` (e.g., use `http://localhost:5000`, not `http://localhost:5000/api`)
3. **CORS Issues**: Make sure your backend allows requests from the frontend domain
4. **Network Access**: Verify the backend server is accessible from the frontend

### Double /api Prefix Error

**❌ Wrong Configuration:**
```bash
REACT_APP_API_BASE_URL=http://localhost:5000/api  # Has /api
```
Results in URLs like: `http://localhost:5000/api/api/inventory/save-scan`

**✅ Correct Configuration:**
```bash
REACT_APP_API_BASE_URL=http://localhost:5000  # No /api
```
Results in URLs like: `http://localhost:5000/api/inventory/save-scan`

### Environment Variables Not Loading

1. **Prefix**: All custom environment variables must start with `REACT_APP_`
2. **Restart**: Restart the development server after changing environment variables
3. **Build**: For production, ensure environment variables are set during build time

## Security Notes

- Never commit `.env.local` files to version control
- Use different API URLs for development and production
- Keep sensitive credentials in environment variables, not in code
- Regularly rotate API keys and credentials

## Default Values

If environment variables are not set, the application uses these defaults:

- `API_BASE_URL`: `http://localhost:5000`
- `API_TIMEOUT`: `30000` (30 seconds)
- `NODE_ENV`: `development`
