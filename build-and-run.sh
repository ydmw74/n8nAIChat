#!/bin/bash

# Exit on errors
set -e

echo "========== n8n Chat Docker Simplified Build & Run =========="
echo "This script will build and run n8n Chat using the simplified Docker configuration."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Check for Docker Compose (using modern command)
echo ""
echo "1. Building the Docker image with simplified configuration..."
docker compose -f docker-compose.simple.yml build --no-cache

echo ""
echo "2. Starting the container..."
docker compose -f docker-compose.simple.yml up -d

echo ""
echo "3. Container logs for verification:"
docker compose -f docker-compose.simple.yml logs

echo ""
echo "========== Setup Complete =========="
echo "n8n Chat should now be running!"
echo ""
echo "Access the application at:"
echo "• http://localhost:5005"
echo ""
echo "To view logs:"
echo "• docker compose -f docker-compose.simple.yml logs -f"
echo ""
echo "To stop the application:"
echo "• docker compose -f docker-compose.simple.yml down"
echo ""
