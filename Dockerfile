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

# Production stage
FROM node:18-alpine as production

WORKDIR /app

# Copy built assets from base stage
COPY --from=base /app/package*.json ./
COPY --from=base /app/src ./src
COPY --from=base /app/src/client/build ./src/client/build
COPY --from=base /app/.env ./.env

# Install production dependencies only
RUN npm ci --omit=dev

# Expose the application port
EXPOSE 5005

# Start the server
CMD ["npm", "start"]
