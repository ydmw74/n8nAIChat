#!/bin/sh

# Fix for allowedHosts webpack error in Docker containers
echo "Configuring React app for Docker deployment..."

# Create .env file with the necessary configs if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file with Docker-specific settings"
  cat > .env << EOL
DANGEROUSLY_DISABLE_HOST_CHECK=true
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PORT=0
HOST=0.0.0.0
REACT_APP_API_URL=http://localhost:5005
EOL
fi

# Make the script executable in case it isn't already
chmod +x node_modules/.bin/react-scripts

# Start the application with the Docker-specific configuration
echo "Starting React application with Docker-specific configuration..."
exec "$@"
