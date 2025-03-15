#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print with color
print_color() {
    color=$1
    message=$2
    printf "${color}${message}${NC}\n"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
print_color $YELLOW "Checking system requirements..."

# Check Node.js
if ! command_exists node; then
    print_color $RED "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check npm
if ! command_exists npm; then
    print_color $RED "npm is not installed. Please install npm."
    exit 1
fi

# Check Docker
if ! command_exists docker; then
    print_color $RED "Docker is not installed. Please install Docker."
    exit 1
fi

# Check Docker Compose
if ! command_exists docker-compose; then
    print_color $RED "Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

# Create necessary directories
print_color $YELLOW "Creating necessary directories..."
mkdir -p uploads logs models temp dist

# Install dependencies
print_color $YELLOW "Installing dependencies..."
npm install

# Setup environment variables
print_color $YELLOW "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_color $GREEN "Created .env file from template"
else
    print_color $YELLOW ".env file already exists, skipping..."
fi

# Setup Git hooks
print_color $YELLOW "Setting up Git hooks..."
npx husky install
chmod +x .husky/pre-commit

# Generate SSL certificates for development
print_color $YELLOW "Generating SSL certificates..."
mkdir -p ssl
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"
    print_color $GREEN "Generated SSL certificates"
else
    print_color $YELLOW "SSL certificates already exist, skipping..."
fi

# Create MongoDB data directory
print_color $YELLOW "Setting up MongoDB data directory..."
mkdir -p data/db

# Setup Redis data directory
print_color $YELLOW "Setting up Redis data directory..."
mkdir -p data/redis

# Build frontend assets
print_color $YELLOW "Building frontend assets..."
npm run build

# Create docker network if it doesn't exist
print_color $YELLOW "Setting up Docker network..."
docker network create ally-soul-network 2>/dev/null || true

# Setup development database
print_color $YELLOW "Setting up development database..."
if [ ! "$(docker ps -q -f name=mongodb-dev)" ]; then
    docker run --name mongodb-dev -d \
        -p 27017:27017 \
        -v $(pwd)/data/db:/data/db \
        --network ally-soul-network \
        mongo:latest
    print_color $GREEN "Started MongoDB container"
else
    print_color $YELLOW "MongoDB container already running, skipping..."
fi

# Setup development Redis
print_color $YELLOW "Setting up development Redis..."
if [ ! "$(docker ps -q -f name=redis-dev)" ]; then
    docker run --name redis-dev -d \
        -p 6379:6379 \
        -v $(pwd)/data/redis:/data \
        --network ally-soul-network \
        redis:alpine
    print_color $GREEN "Started Redis container"
else
    print_color $YELLOW "Redis container already running, skipping..."
fi

# Create test data directory
print_color $YELLOW "Setting up test data directory..."
mkdir -p test/data

# Setup test environment
print_color $YELLOW "Setting up test environment..."
if [ ! -f .env.test ]; then
    cp .env.example .env.test
    echo "NODE_ENV=test" >> .env.test
    print_color $GREEN "Created test environment file"
else
    print_color $YELLOW "Test environment file already exists, skipping..."
fi

# Run tests to verify setup
print_color $YELLOW "Running tests to verify setup..."
npm test

# Final setup verification
print_color $YELLOW "Verifying setup..."
node scripts/verify-setup.js

print_color $GREEN "Setup completed successfully!"
print_color $YELLOW "
Next steps:
1. Update the .env file with your configuration
2. Start the development server with: npm run dev
3. Access Ally at: http://localhost:3000
4. Access Soul at: http://localhost:3000/soul
"
