# Base node image
FROM node:18-alpine as base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY src/client/package*.json ./src/client/

# Install dependencies
RUN npm ci
RUN cd src/client && npm ci

# Copy the rest of the application
COPY . .

# Build the client application
RUN cd src/client && npm run build

# Debug - Show the build location and contents
RUN echo "*** DEBUG: Contents of src/client directory after build ***"
RUN ls -la /app/src/client
RUN echo "*** DEBUG: Contents of build directory ***"
RUN ls -la /app/src/client/build || echo "Build directory not found!"

# Production stage
FROM node:18-alpine as production

WORKDIR /app

# Copy built assets from base stage
COPY --from=base /app/package*.json ./
COPY --from=base /app/src ./src

# Create client build directories
RUN mkdir -p ./src/client/build
RUN mkdir -p ./client/build

# Verify the build was successful
RUN ls -la /app/src/client/build || echo "WARNING: Build directory not found in base image"

# Copy client build to multiple locations for resilience
COPY --from=base /app/src/client/build ./src/client/build/
COPY --from=base /app/src/client/build ./client/build/

# Copy any environment files
COPY --from=base /app/.env* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose the application port
EXPOSE 5005

# Use our custom entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start the server
CMD ["npm", "start"]
