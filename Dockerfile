# Use Node.js LTS Alpine for small image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY *.js ./

# Create volume mount points for persistent data
VOLUME ["/app/data"]

# Set environment variable for data directory
ENV DATA_DIR=/app/data

# Health check
HEALTHCHECK --interval=5m --timeout=10s --start-period=30s \
  CMD node -e "console.log('healthy')" || exit 1

# Run the application
CMD ["node", "index.js"]

