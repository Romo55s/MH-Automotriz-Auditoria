#!/bin/bash

# ===========================================
# CAR INVENTORY APP - PRODUCTION DEPLOYMENT
# ===========================================

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_warning "Please create .env.production with your production environment variables"
    print_status "You can copy from env.example and update the values"
    exit 1
fi

# Check if required environment variables are set
print_status "Checking environment variables..."

# Load environment variables
source .env.production

# Check required variables
required_vars=(
    "REACT_APP_AUTH0_DOMAIN"
    "REACT_APP_AUTH0_CLIENT_ID"
    "REACT_APP_AUTH0_AUDIENCE"
    "REACT_APP_API_BASE_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set in .env.production"
        exit 1
    fi
done

print_success "All required environment variables are set"

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run type checking
print_status "Running TypeScript type checking..."
npm run type-check

# Run tests (if any)
print_status "Running tests..."
npm test -- --coverage --watchAll=false || print_warning "Tests failed, but continuing deployment"

# Build for production
print_status "Building for production..."
npm run build:prod

# Check if build was successful
if [ ! -d "build" ]; then
    print_error "Build failed - build directory not found"
    exit 1
fi

print_success "Production build completed successfully"

# Optional: Deploy to specific platform
if [ "$1" = "netlify" ]; then
    print_status "Deploying to Netlify..."
    npx netlify deploy --prod --dir=build
    print_success "Deployed to Netlify"
elif [ "$1" = "vercel" ]; then
    print_status "Deploying to Vercel..."
    npx vercel --prod
    print_success "Deployed to Vercel"
elif [ "$1" = "serve" ]; then
    print_status "Starting local production server..."
    npm run serve:prod
else
    print_success "Build ready for deployment!"
    print_status "Build files are in the 'build' directory"
    print_status "You can deploy using:"
    print_status "  - Netlify: ./scripts/deploy.sh netlify"
    print_status "  - Vercel: ./scripts/deploy.sh vercel"
    print_status "  - Local serve: ./scripts/deploy.sh serve"
fi

print_success "Deployment process completed! 🎉"
