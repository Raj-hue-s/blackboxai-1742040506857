# Build stage
FROM node:16-alpine as builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:16-alpine

# Install production dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Install additional dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

# Create necessary directories
RUN mkdir -p \
    /app/uploads \
    /app/logs \
    /app/models

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose port
EXPOSE 3000

# Set user
USER node

# Start application
CMD ["npm", "start"]
