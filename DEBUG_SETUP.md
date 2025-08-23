# TypeScript Debugging Setup Guide

This project has been configured with comprehensive TypeScript debugging capabilities. Here's how to use them:

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server with debugging:**
   ```bash
   npm run debug:start
   ```

3. **Run type checking:**
   ```bash
   npm run type-check
   ```

4. **Format code:**
   ```bash
   npm run format
   ```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run debug:start` | Start dev server with source maps enabled |
| `npm run debug:build` | Build with source maps for debugging |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

## 🐛 VS Code Debugging

### 1. Launch Chrome Debugger
- Press `F5` or go to Run → Start Debugging
- Select "Launch Chrome" configuration
- This will open Chrome with debugging enabled

### 2. Attach to Existing Chrome
- Start Chrome with: `chrome --remote-debugging-port=9222`
- Use "Attach to Chrome" configuration
- Useful for debugging existing sessions

### 3. React App Debugging
- Use "Debug React App" configuration
- This automatically starts the dev server and opens Chrome
- Best for full-stack debugging with hot reload

## 📝 Using the Debug Utilities

### Basic Debugging
```typescript
import { debug, debugLog, debugError } from '../utils/debug';

// Simple logging
debugLog('User logged in', { userId: 123, timestamp: new Date() });

// Error logging
debugError('Failed to fetch data', error);

// Grouped logging
debug.group('API Request');
debug.info('Sending request to:', endpoint);
debug.object('Request payload:', payload);
debug.groupEnd();
```

### Performance Measurement
```typescript
import { measurePerformance, measurePerformanceAsync } from '../utils/debug';

// Sync performance measurement
const result = measurePerformance('Data Processing', () => {
  return processData(largeDataset);
});

// Async performance measurement
const result = await measurePerformanceAsync('API Call', async () => {
  return await fetchData();
});
```

### Type-Safe Assertions
```typescript
import { assert, assertNotNull } from '../utils/debug';

// Assertion with custom message
assert(user.isAuthenticated, 'User must be authenticated');

// Null check with type narrowing
const userName = assertNotNull(user.name, 'User name is required');
// TypeScript now knows userName is string, not string | null
```

## 🔍 Debug Configuration

### Environment Variables
```bash
# Enable source maps in production builds
GENERATE_SOURCEMAP=true npm run build

# Set debug level
DEBUG_LEVEL=TRACE npm start
```

### Debug Levels
- `NONE` (0): No debugging
- `ERROR` (1): Only errors
- `WARN` (2): Warnings and errors
- `INFO` (3): Info, warnings, and errors
- `DEBUG` (4): Debug, info, warnings, and errors
- `TRACE` (5): All debug information

### Custom Debug Configuration
```typescript
import { debug, DebugLevel } from '../utils/debug';

// Update debug configuration
debug.updateConfig({
  level: DebugLevel.TRACE,
  showTimestamps: false,
  showFileInfo: true
});
```

## 🛠️ Code Quality

The project uses TypeScript with strict type checking and Prettier for code formatting:

- **Type Safety**: TypeScript strict mode enabled
- **Code Formatting**: Prettier with consistent style rules
- **Import Organization**: Automatic import sorting
- **Source Maps**: Full debugging support

## 📊 Source Maps

Source maps are automatically generated in development mode, allowing you to:
- Set breakpoints in TypeScript files
- See original TypeScript code in browser dev tools
- Debug with full type information

## 🚨 Common Debugging Issues

### 1. Type Errors
```bash
# Check for type errors
npm run type-check

# Format code
npm run format
```

### 2. Source Maps Not Working
- Ensure `GENERATE_SOURCEMAP=true` is set
- Check browser dev tools source tab
- Verify `.map` files are generated

### 3. Code Formatting Issues
```bash
# Check formatting
npm run format:check

# Auto-format code
npm run format
```

## 🎯 Best Practices

### 1. Use Debug Utilities Instead of console.log
```typescript
// ❌ Don't do this
console.log('Debug info:', data);

// ✅ Do this instead
debug.info('Debug info:', data);
```

### 2. Group Related Debug Information
```typescript
debug.group('User Authentication');
debug.info('Starting auth process');
debug.object('User credentials:', credentials);
debug.groupEnd();
```

### 3. Measure Performance for Critical Operations
```typescript
const result = await measurePerformanceAsync('Database Query', async () => {
  return await database.query(complexQuery);
});
```

### 4. Use Type Assertions Sparingly
```typescript
// ❌ Avoid this
const user = data as User;

// ✅ Prefer this
const user = assertNotNull(data, 'User data is required');
```

## 🔧 Troubleshooting

### VS Code Not Recognizing TypeScript
1. Ensure TypeScript extension is installed
2. Check `tsconfig.json` is in project root
3. Restart VS Code TypeScript service: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Debugger Not Hitting Breakpoints
1. Verify source maps are enabled
2. Check browser dev tools source tab
3. Ensure breakpoints are set in TypeScript files, not compiled JavaScript

### Code Formatting Issues
1. Install required dependencies: `npm install`
2. Check `.prettierrc` configuration
3. Run `npm run format` to auto-format

## 📚 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)

## 🆘 Getting Help

If you encounter issues:
1. Check the console for error messages
2. Run `npm run type-check` for TypeScript errors
3. Run `npm run format:check` for formatting issues
4. Check VS Code Problems panel
5. Review this documentation

Happy debugging! 🐛✨
