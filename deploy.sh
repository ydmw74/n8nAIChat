#!/bin/bash

# Exit on errors
set -e

echo "========== n8n Chat Deployment Script =========="
echo "This script will build and deploy the n8n Chat application."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed or not in PATH"
    exit 1
fi

echo ""
echo "1. Building and starting containers..."
docker-compose up -d --build

echo ""
echo "2. Container status:"
docker-compose ps

echo ""
echo "========== Deployment Complete =========="
echo "n8n Chat is now running!"
echo ""
echo "Access the application at:"
echo "• http://localhost:5005"
echo ""
echo "To view logs:"
echo "• docker-compose logs -f"
echo ""
echo "To stop the application:"
echo "• docker-compose down"
echo ""
