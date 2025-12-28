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

# Set environment variables
ENV DATA_DIR=/app/data
ENV PORT=3000

# Expose port for Render web service
EXPOSE 3000

# Health check via HTTP endpoint
HEALTHCHECK --interval=5m --timeout=10s --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run the application
CMD ["node", "index.js"]

