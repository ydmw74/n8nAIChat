# n8n Chat

A ChatGPT-like web interface that integrates with n8n webhooks. This application allows users to send chat messages and files to an n8n workflow and display the responses.

## Features

- User authentication (register/login)
- Chat interface similar to ChatGPT
- File upload support with proper binary data handling
- Integration with n8n webhooks
- Dark/light theme support
- Responsive design for mobile and desktop

## Prerequisites

- Node.js (v14+)
- npm (v6+)
- n8n instance with a webhook node configured

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/ydmw74/n8nAIChat.git
   cd n8nAIChat
   ```

2. Install dependencies:
   ```
   npm install
   cd src/client && npm install && cd ../..
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=5005
   JWT_SECRET=your_secret_key_here
   ```
   Note: In production, use a strong, unique JWT_SECRET.

   The application is configured to listen on all network interfaces (0.0.0.0), 
   which means it will be accessible from other devices on your network using your 
   machine's IP address (e.g., http://192.168.1.10:5005).

   Note: This application uses port 5005 instead of the traditional 5000 to avoid conflicts with other applications that commonly use port 5000.

4. Setup an n8n webhook:
   - Create a new workflow in n8n
   - Add a webhook node as a trigger
   - Configure it as a "REST Callback" webhook
   - Make sure "Binary Data" is enabled in the webhook configuration
   - Copy the generated webhook URL for use in the application settings

## Running the Application

### Development Mode

1. Start the backend server:
   ```
   npm run server
   ```
   The server will start on port 5005 by default (or the port specified in your .env file).

2. In a separate terminal, start the frontend client:
   ```
   npm run client
   ```
   The React development server will start on port 3000.

3. Access the application at `http://localhost:3000`

### Production Mode

1. Build the client:
   ```
   cd src/client && npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```
   
3. Access the application at the configured port (default: `http://localhost:5005`)

### Docker Deployment

We provide multiple Docker deployment options to ensure reliable operation across different environments:

#### Option 1: Simplified Docker Deployment (Recommended)

This is the most reliable option that includes additional verification steps:

1. Use the provided script to build and run:
   ```bash
   ./build-and-run.sh
   ```
   
   Or manually:
   ```bash
   docker compose -f docker-compose.simple.yml up -d
   ```
   
2. Access the application at `http://localhost:5005`

This simplified setup:
- Uses a single-stage Dockerfile with explicit verification steps
- Ensures client build files are properly created and copied
- Includes health checks for container monitoring
- Provides clear build failure detection

#### Option 2: Standard Docker Deployment

1. Build and start using Docker Compose for production:
   ```
   docker compose up -d
   ```
   
   This will:
   - Build a single container containing both the backend and frontend
   - Configure the Express.js server to serve the pre-built React app
   - Persist database and uploads in volumes

2. For development with hot-reloading:
   ```
   docker compose -f docker-compose.dev.yml up
   ```

3. Access the application:
   - Production: `http://localhost:5005` (single container serving both API and frontend)
   - Development: `http://localhost:3000` (React dev server) and `http://localhost:5005` (API)

#### Docker Troubleshooting

If you encounter file path issues with build files in Docker:
- The server includes a fallback mechanism that creates a minimal HTML page if build files aren't found
- This ensures that even if the client build fails, the API will remain accessible
- Try the simplified `docker-compose.simple.yml` which includes explicit verification steps
- Check the logs with `docker compose logs` to see detailed path debugging information

#### To stop the containers:
```
docker compose down
```
or
```
docker compose -f docker-compose.simple.yml down
```
or
```
docker compose -f docker-compose.dev.yml down
```

#### Docker Environment Variables

You can customize the Docker deployment by modifying the environment variables in `docker-compose.yml`:

- `PORT`: The port the application runs on (default: 5005)
- `JWT_SECRET`: Secret key for JWT token generation (change this in production)
- `REACT_APP_API_URL`: The URL where the API is accessible

## Troubleshooting

- **Port conflicts**: If you encounter a "Port already in use" error, either:
  - Change the PORT value in your .env file
  - Kill the process using the port: `npx kill-port 5005` (replace 5005 with your port)

- **File upload issues**: 
  - Make sure the 'Binary Data' option is enabled in your n8n webhook configuration
  - Check that you've set the binary field name correctly in the chat settings (default is "data")

- **Webpack Dev Server issues**:
  - If you encounter an error about `allowedHosts`, ensure you're using the proper configuration files
  - For containerized environments, use the provided `.env.development` and `config-overrides.js` files

## Usage

1. Register a new account or log in
2. Go to Settings and set your n8n webhook URL
3. Start a new chat and send messages
4. Attach files as needed (the app supports multiple file uploads)
5. View and manage your chat history

## n8n Webhook Configuration

### Setting Up Your n8n Webhook

1. Start your n8n instance (typically at http://localhost:5678)
2. Create a new workflow
3. Add a **Webhook** node as the trigger:
   - Click on "Add Trigger" and select "Webhook"
   - Configure it as a "REST Callback" webhook
   - **Important**: Enable "Binary Data" in the configuration
   - Copy the generated webhook URL (e.g., http://localhost:5678/webhook/path)
4. Add processing nodes for your chatbot functionality
5. Make sure your final node returns a JSON response

### Customizable Webhook Field Names

You can customize all field names used in the webhook payload through the Settings page:

- **Message Field Name**: Field name for the message content (default: "message")
- **User ID Field Name**: Field name for the user identifier (default: "userId")
- **Chat ID Field Name**: Field name for the chat identifier (default: "chatId")
- **Session ID Field Name**: Field name for the session identifier (default: "sessionId")
- **Binary Field Name**: Field name for binary data (file uploads) (default: "data")

This allows for flexible integration with different n8n workflow configurations or third-party services.

### Data Format

For simple text messages, your n8n webhook will receive data with your configured field names:

```json
{
  "message": "User's message content",  // or your custom field name
  "userId": 1,                          // or your custom field name
  "chatId": 123,                        // or your custom field name
  "sessionId": "n8n_1234567890_abcdef"  // or your custom field name
}
```

### File Upload Handling

When files are uploaded, the app sends them as binary data using multipart/form-data:

1. The JSON payload is included as a field named 'json' containing:
   ```json
   {
     "message": "User's message content",  // or your custom field name
     "userId": 1,                          // or your custom field name
     "chatId": 123,                        // or your custom field name
     "sessionId": "n8n_1234567890_abcdef"  // or your custom field name
   }
   ```

2. The binary data is sent in fields named according to your binary field setting:
   - The first file uses the name you specify in Settings (default is "data")
   - Additional files use incrementing names: data1, data2, etc. (based on your custom binary field name)

In your n8n workflow, you'll need to:
- Enable "Binary Data" in the Webhook configuration
- Access binary files through $input.data or $binary fields
- Process the binary data using appropriate nodes (e.g., Read Binary File)

### Expected Response Format

Your n8n webhook workflow can return a response in one of the following formats:

1. Using the `output` field (recommended):
```json
{
  "output": "Assistant's response message"
}
```

2. Using the `response` field (legacy format):
```json
{
  "response": "Assistant's response message"
}
```

3. Any other JSON format will be stringified and displayed as text.

The application prioritizes checking for the `output` field first, then the `response` field, and falls back to stringifying the entire response if neither is found.

### Example Workflow

Here's a simple n8n workflow example for handling both messages and files:

1. **Webhook** node: 
   - Configure as a "REST Callback" webhook
   - Enable "Binary Data" 
   - Set "Response Mode" to "Last Node"

2. **Function** node: Process the message and files
   ```javascript
   // Get the message
   let message = '';
   let files = [];
   
   // Handle both direct JSON and form data with binary
   if ($input.body && $input.body.message) {
     // Direct JSON submission
     message = $input.body.message;
   } else if ($input.body && $input.body.json) {
     // FormData submission with binary files
     const jsonData = JSON.parse($input.body.json);
     message = jsonData.message;
     
     // Check for binary files
     if ($binary) {
       Object.keys($binary).forEach(key => {
         files.push({
           name: $binary[key].fileName,
           type: $binary[key].mimeType,
           size: $binary[key].fileSize
         });
       });
     }
   }
   
   // Create a response
   let response = `You said: "${message}"`;
   
   if (files.length > 0) {
     response += `. You sent ${files.length} file(s): ${files.map(f => f.name).join(', ')}`;
   }
   
   // Return the correctly formatted response
   return {
     json: {
       output: response  // Using the recommended 'output' field format
     }
   };
   ```

3. Connect the nodes and activate the workflow

## Technical Details

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: SQLite for data storage
- **Authentication**: JWT-based authentication
- **File handling**: Multer for file uploads, proper binary handling for n8n integration

## License

ISC
