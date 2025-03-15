#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_color() {
    color=$1
    message=$2
    printf "${color}${message}${NC}\n"
}

# Check required arguments
if [ "$#" -ne 2 ]; then
    print_color $RED "Usage: $0 <environment> <version>"
    exit 1
fi

ENVIRONMENT=$1
VERSION=$2
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="/opt/ally-soul"
BACKUP_DIR="${DEPLOY_DIR}/backups"
LOG_FILE="${DEPLOY_DIR}/logs/deploy_${TIMESTAMP}.log"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    print_color $RED "Invalid environment. Must be 'staging' or 'production'"
    exit 1
fi

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
else
    print_color $RED "Environment file .env.${ENVIRONMENT} not found"
    exit 1
fi

# Create required directories
mkdir -p "${DEPLOY_DIR}/logs"
mkdir -p "${BACKUP_DIR}"

# Log deployment start
print_color $BLUE "Starting deployment to ${ENVIRONMENT} environment (v${VERSION})"
echo "Deployment started at $(date)" >> "$LOG_FILE"

# Function to handle errors
handle_error() {
    print_color $RED "Deployment failed! Check ${LOG_FILE} for details"
    echo "Deployment failed at $(date)" >> "$LOG_FILE"
    echo "Error: $1" >> "$LOG_FILE"
    
    # Notify team
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ Deployment to ${ENVIRONMENT} failed! Version: ${VERSION}\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    exit 1
}

# Trap errors
trap 'handle_error "$BASH_COMMAND"' ERR

# Create backup
print_color $YELLOW "Creating backup..."
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"
if [ -d "${DEPLOY_DIR}/current" ]; then
    tar -czf "$BACKUP_FILE" -C "${DEPLOY_DIR}" current >> "$LOG_FILE" 2>&1
    print_color $GREEN "Backup created at ${BACKUP_FILE}"
fi

# Pull Docker image
print_color $YELLOW "Pulling Docker image..."
docker pull "ally-soul:${VERSION}" >> "$LOG_FILE" 2>&1

# Stop current containers
print_color $YELLOW "Stopping current containers..."
docker-compose -f docker-compose.yml down --remove-orphans >> "$LOG_FILE" 2>&1

# Update symlink
print_color $YELLOW "Updating deployment..."
rm -rf "${DEPLOY_DIR}/previous"
if [ -d "${DEPLOY_DIR}/current" ]; then
    mv "${DEPLOY_DIR}/current" "${DEPLOY_DIR}/previous"
fi

# Deploy new version
mkdir -p "${DEPLOY_DIR}/current"
cp -r * "${DEPLOY_DIR}/current/"
cp ".env.${ENVIRONMENT}" "${DEPLOY_DIR}/current/.env"

# Update version file
echo "${VERSION}" > "${DEPLOY_DIR}/current/VERSION"

# Start new containers
print_color $YELLOW "Starting new containers..."
cd "${DEPLOY_DIR}/current"
docker-compose -f docker-compose.yml up -d >> "$LOG_FILE" 2>&1

# Wait for health checks
print_color $YELLOW "Waiting for health checks..."
HEALTHY=0
ATTEMPTS=0
MAX_ATTEMPTS=30

while [ $HEALTHY -eq 0 ] && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if docker-compose ps | grep -q "healthy"; then
        HEALTHY=1
    else
        ATTEMPTS=$((ATTEMPTS+1))
        sleep 2
    fi
done

if [ $HEALTHY -eq 0 ]; then
    print_color $RED "Health checks failed after ${MAX_ATTEMPTS} attempts"
    
    # Rollback
    print_color $YELLOW "Rolling back to previous version..."
    docker-compose down --remove-orphans >> "$LOG_FILE" 2>&1
    rm -rf "${DEPLOY_DIR}/current"
    mv "${DEPLOY_DIR}/previous" "${DEPLOY_DIR}/current"
    cd "${DEPLOY_DIR}/current"
    docker-compose up -d >> "$LOG_FILE" 2>&1
    
    handle_error "Health checks failed"
fi

# Run database migrations
print_color $YELLOW "Running database migrations..."
docker-compose exec -T app node scripts/db-setup.js migrate >> "$LOG_FILE" 2>&1

# Clear cache
print_color $YELLOW "Clearing cache..."
docker-compose exec -T redis redis-cli FLUSHALL >> "$LOG_FILE" 2>&1

# Verify deployment
print_color $YELLOW "Verifying deployment..."
HEALTH_CHECK_URL="https://${DOMAIN}/health"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL")

if [ "$HTTP_RESPONSE" != "200" ]; then
    print_color $RED "Deployment verification failed! Health check returned ${HTTP_RESPONSE}"
    handle_error "Deployment verification failed"
fi

# Log successful deployment
print_color $GREEN "Deployment completed successfully!"
echo "Deployment completed at $(date)" >> "$LOG_FILE"

# Notify team
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Deployment to ${ENVIRONMENT} successful! Version: ${VERSION}\"}" \
        "$SLACK_WEBHOOK"
fi

# Cleanup old backups (keep last 5)
print_color $YELLOW "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm

# Print deployment info
print_color $BLUE "Deployment Summary:"
echo "Environment: ${ENVIRONMENT}"
echo "Version: ${VERSION}"
echo "Timestamp: ${TIMESTAMP}"
echo "Log file: ${LOG_FILE}"
