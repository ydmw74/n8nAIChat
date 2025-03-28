#!/bin/sh
set -e

# Output debug information
echo "=== Docker Environment Setup ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check expected client build paths
echo "\nChecking for client build files..."
if [ ! -d "./client/build" ] || [ ! -f "./client/build/index.html" ]; then
  echo "Client build directory not found at expected location ./client/build"
  
  # Create directories if they don't exist
  mkdir -p ./client/build
  
  # Check if src/client/build exists as source to copy from
  if [ -d "./src/client/build" ] && [ -f "./src/client/build/index.html" ]; then
    echo "Found build files in src/client/build - copying to client/build"
    cp -R ./src/client/build/* ./client/build/
  else
    echo "WARNING: No build files found in src/client/build either."
    echo "Creating minimal index.html as fallback"
    
    # Create a minimal index.html file
    cat > ./client/build/index.html << EOL
<!DOCTYPE html>
<html>
<head>
    <title>n8n Chat</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        .error { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <h1>n8n Chat</h1>
        <p class="error">Error: Client build files not found.</p>
        <p>This suggests there was a problem during the Docker build process.</p>
        <p>Please check the container logs for more details.</p>
        <p>API endpoints at <code>/api/*</code> should still be functional.</p>
    </div>
</body>
</html>
EOL
  fi
else
  echo "Client build directory found at ./client/build"
fi

# List directories to verify
echo "\nChecking build directory contents:"
ls -la ./client/build || echo "Still can't access client/build directory!"

# Start the application
echo "\n=== Starting n8n Chat Server ==="
exec "$@"
