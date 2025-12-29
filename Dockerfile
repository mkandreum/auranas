# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Set Node memory limit and build frontend
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build -- --logLevel=info

# Production Stage
FROM node:20-alpine

# Install FFmpeg (required for video thumbnails)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy server source code and other necessary files
# We exclude src/ and other dev files via .dockerignore, but copying . is safe enough
COPY . .

# Copy built frontend assets from builder
COPY --from=builder /app/dist ./dist

# Create storage directories
RUN mkdir -p storage cache data && \
  chown -R node:node /app

# Switch to non-root user
USER node

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]

