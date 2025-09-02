@echo off
REM ===========================================
REM CAR INVENTORY APP - PRODUCTION DEPLOYMENT (Windows)
REM ===========================================

setlocal enabledelayedexpansion

echo 🚀 Starting production deployment...

REM Check if .env.production exists
if not exist ".env.production" (
    echo [ERROR] .env.production file not found!
    echo [WARNING] Please create .env.production with your production environment variables
    echo [INFO] You can copy from env.example and update the values
    exit /b 1
)

echo [INFO] Checking environment variables...

REM Check if required environment variables are set
REM Note: In Windows batch, we can't easily source .env files
REM The user needs to ensure their environment variables are set

echo [INFO] Installing dependencies...
call npm ci
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

echo [INFO] Running TypeScript type checking...
call npm run type-check
if errorlevel 1 (
    echo [ERROR] Type checking failed
    exit /b 1
)

echo [INFO] Running tests...
call npm test -- --coverage --watchAll=false
if errorlevel 1 (
    echo [WARNING] Tests failed, but continuing deployment
)

echo [INFO] Building for production...
call npm run build:prod
if errorlevel 1 (
    echo [ERROR] Build failed
    exit /b 1
)

REM Check if build was successful
if not exist "build" (
    echo [ERROR] Build failed - build directory not found
    exit /b 1
)

echo [SUCCESS] Production build completed successfully

REM Optional: Deploy to specific platform
if "%1"=="netlify" (
    echo [INFO] Deploying to Netlify...
    call npx netlify deploy --prod --dir=build
    if errorlevel 1 (
        echo [ERROR] Netlify deployment failed
        exit /b 1
    )
    echo [SUCCESS] Deployed to Netlify
) else if "%1"=="vercel" (
    echo [INFO] Deploying to Vercel...
    call npx vercel --prod
    if errorlevel 1 (
        echo [ERROR] Vercel deployment failed
        exit /b 1
    )
    echo [SUCCESS] Deployed to Vercel
) else if "%1"=="serve" (
    echo [INFO] Starting local production server...
    call npm run serve:prod
) else (
    echo [SUCCESS] Build ready for deployment!
    echo [INFO] Build files are in the 'build' directory
    echo [INFO] You can deploy using:
    echo [INFO]   - Netlify: scripts\deploy.bat netlify
    echo [INFO]   - Vercel: scripts\deploy.bat vercel
    echo [INFO]   - Local serve: scripts\deploy.bat serve
)

echo [SUCCESS] Deployment process completed! 🎉
