# Environment Variables Configuration

This document explains all environment variables used in the Car Inventory App and how to configure them for different environments.

## 🔧 Required Environment Variables

### Authentication (Auth0)
```env
REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-api.com
```

### API Configuration
```env
REACT_APP_API_BASE_URL=https://your-api.com/api
```

### WebSocket Configuration
```env
REACT_APP_WS_BASE_URL=wss://your-api.com
```

## 🌍 Environment-Specific Configurations

### Development (.env.development)
```env
# Auth0 Development
REACT_APP_AUTH0_DOMAIN=your-dev-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-dev-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-dev-api.com

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000/api

# WebSocket Configuration
REACT_APP_WS_BASE_URL=ws://localhost:5000

# Development Settings
NODE_ENV=development
GENERATE_SOURCEMAP=true
```

### Production (.env.production)
```env
# Auth0 Production
REACT_APP_AUTH0_DOMAIN=your-prod-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-prod-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-prod-api.com

# API Configuration
REACT_APP_API_BASE_URL=https://your-prod-api.com/api

# WebSocket Configuration
REACT_APP_WS_BASE_URL=wss://your-prod-api.com

# Production Settings
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

### Staging (.env.staging)
```env
# Auth0 Staging
REACT_APP_AUTH0_DOMAIN=your-staging-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-staging-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-staging-api.com

# API Configuration
REACT_APP_API_BASE_URL=https://your-staging-api.com/api

# WebSocket Configuration
REACT_APP_WS_BASE_URL=wss://your-staging-api.com

# Staging Settings
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

## 📝 Environment Variable Details

### REACT_APP_API_BASE_URL
- **Description**: Base URL for all API endpoints
- **Format**: `https://your-domain.com/api` or `http://localhost:5000/api`
- **Used in**: All API calls, file downloads, inventory operations
- **Examples**:
  - Development: `http://localhost:5000/api`
  - Production: `https://api.yourcompany.com/api`

### REACT_APP_WS_BASE_URL
- **Description**: Base URL for WebSocket connections
- **Format**: `wss://your-domain.com` or `ws://localhost:5000`
- **Used in**: Real-time collaboration, session management
- **Examples**:
  - Development: `ws://localhost:5000`
  - Production: `wss://api.yourcompany.com`
- **Note**: Uses `ws://` for HTTP and `wss://` for HTTPS

### REACT_APP_AUTH0_DOMAIN
- **Description**: Auth0 domain for authentication
- **Format**: `your-domain.auth0.com`
- **Used in**: User authentication, login/logout flows

### REACT_APP_AUTH0_CLIENT_ID
- **Description**: Auth0 application client ID
- **Format**: Alphanumeric string
- **Used in**: Authentication configuration

### REACT_APP_AUTH0_AUDIENCE
- **Description**: Auth0 API audience identifier
- **Format**: `https://your-api.com`
- **Used in**: Token validation, API access control

## 🔄 How Environment Variables Are Used

### In Code
```typescript
// src/config/environment.ts
export const config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  WS_BASE_URL: process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:5000',
  // ... other config
};
```

### WebSocket Connections
```typescript
// src/services/InventoryWebSocketClient.ts
const wsUrl = `${WS_BASE_URL}/ws/inventory/${agency}/${month}/${year}`;
const ws = new WebSocket(wsUrl);
```

### API Calls
```typescript
// src/services/api.ts
const response = await fetch(`${API_BASE_URL}/inventory/save-scan`, {
  method: 'POST',
  // ... request options
});
```

## 🚀 Deployment Configuration

### Netlify
Set environment variables in Netlify dashboard:
1. Go to Site Settings > Environment Variables
2. Add all required variables with production values
3. Redeploy the site

### Vercel
Set environment variables in Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add variables for each environment (Development, Preview, Production)
3. Redeploy the project

### Docker
```dockerfile
# Dockerfile
ENV REACT_APP_API_BASE_URL=https://api.yourcompany.com/api
ENV REACT_APP_WS_BASE_URL=wss://api.yourcompany.com
ENV REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
ENV REACT_APP_AUTH0_CLIENT_ID=your-client-id
ENV REACT_APP_AUTH0_AUDIENCE=https://api.yourcompany.com
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
- name: Build for production
  run: npm run build:prod
  env:
    REACT_APP_API_BASE_URL: ${{ secrets.API_BASE_URL }}
    REACT_APP_WS_BASE_URL: ${{ secrets.WS_BASE_URL }}
    REACT_APP_AUTH0_DOMAIN: ${{ secrets.AUTH0_DOMAIN }}
    REACT_APP_AUTH0_CLIENT_ID: ${{ secrets.AUTH0_CLIENT_ID }}
    REACT_APP_AUTH0_AUDIENCE: ${{ secrets.AUTH0_AUDIENCE }}
```

## 🔍 Validation & Testing

### Environment Variable Validation
```typescript
// Add to src/config/environment.ts
export const validateEnvironment = () => {
  const required = [
    'REACT_APP_API_BASE_URL',
    'REACT_APP_WS_BASE_URL',
    'REACT_APP_AUTH0_DOMAIN',
    'REACT_APP_AUTH0_CLIENT_ID',
    'REACT_APP_AUTH0_AUDIENCE'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};
```

### Connection Testing
```typescript
// Test API connection
const testApiConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    console.log('API connection:', response.ok ? '✅' : '❌');
  } catch (error) {
    console.error('API connection failed:', error);
  }
};

// Test WebSocket connection
const testWebSocketConnection = () => {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/test`);
  ws.onopen = () => console.log('WebSocket connection: ✅');
  ws.onerror = () => console.log('WebSocket connection: ❌');
};
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
**Problem**: Variables showing as `undefined`
**Solution**: 
- Ensure all variables start with `REACT_APP_`
- Restart the development server
- Check for typos in variable names

#### 2. WebSocket Connection Failed
**Problem**: WebSocket can't connect to server
**Solution**:
- Verify `REACT_APP_WS_BASE_URL` is correct
- Check if WebSocket server is running
- Ensure proper protocol (ws:// vs wss://)

#### 3. API Calls Failing
**Problem**: API requests returning errors
**Solution**:
- Verify `REACT_APP_API_BASE_URL` is correct
- Check CORS configuration on backend
- Ensure backend server is running

#### 4. Auth0 Authentication Issues
**Problem**: Login/logout not working
**Solution**:
- Verify Auth0 domain and client ID
- Check Auth0 application configuration
- Ensure callback URLs are correct

### Debug Commands
```bash
# Check environment variables in build
npm run build:prod -- --verbose

# Test environment configuration
node -e "console.log(process.env.REACT_APP_API_BASE_URL)"

# Validate configuration
npm run type-check
```

## 📋 Environment Variables Checklist

Before deploying to production, ensure:

- [ ] All required environment variables are set
- [ ] WebSocket URL uses `wss://` for production
- [ ] API URL uses `https://` for production
- [ ] Auth0 configuration matches production domain
- [ ] Environment variables are properly configured in deployment platform
- [ ] Test connections work in target environment
- [ ] No hardcoded URLs remain in the codebase

---

**Last Updated**: [Current Date]
**Version**: 2.0.0
