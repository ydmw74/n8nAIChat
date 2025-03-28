#!/bin/bash

# Exit on errors
set -e

echo "========== n8n Chat Development Environment =========="
echo "This script will start the n8n Chat application in development mode."

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
echo "1. Building and starting development containers..."
docker-compose -f docker-compose.dev.yml up --build

echo ""
echo "========== Development Environment Started =========="
echo "n8n Chat development environment is running!"
echo ""
echo "Access the application at:"
echo "• Frontend: http://localhost:3000"
echo "• Backend API: http://localhost:5005"
echo ""
echo "The application will automatically reload when you make changes to the code."
echo ""
echo "To stop the application, press Ctrl+C"
echo ""
