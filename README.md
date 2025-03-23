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
   git clone https://github.com/yourusername/n8n-chat.git
   cd n8n-chat
   ```

2. Install dependencies:
   ```
   npm install
   cd src/client && npm install && cd ../..
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=5000
   JWT_SECRET=your_secret_key_here
   ```
   Note: In production, use a strong, unique JWT_SECRET.

   The application is configured to listen on all network interfaces (0.0.0.0), 
   which means it will be accessible from other devices on your network using your 
   machine's IP address (e.g., http://192.168.1.10:5000).

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
   The server will start on port 5000 by default (or the port specified in your .env file).

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
   
3. Access the application at the configured port (default: `http://localhost:5000`)

## Troubleshooting

- **Port conflicts**: If you encounter a "Port already in use" error, either:
  - Change the PORT value in your .env file
  - Kill the process using the port: `npx kill-port 5000` (replace 5000 with your port)

- **File upload issues**: 
  - Make sure the 'Binary Data' option is enabled in your n8n webhook configuration
  - Check that you've set the binary field name correctly in the chat settings (default is "data")

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

### Data Format

For simple text messages, your n8n webhook will receive data in this format:

```json
{
  "message": "User's message content",
  "userId": 1,
  "chatId": 123
}
```

### File Upload Handling

When files are uploaded, the app sends them as binary data using multipart/form-data:

1. The JSON payload is included as a field named 'json' containing:
   ```json
   {
     "message": "User's message content",
     "userId": 1,
     "chatId": 123
   }
   ```

2. The binary data is sent in fields named according to your settings:
   - The first file uses the name you specify in Settings (default is "data")
   - Additional files use incrementing names: data1, data2, etc.

In your n8n workflow, you'll need to:
- Enable "Binary Data" in the Webhook configuration
- Access binary files through $input.data or $binary fields
- Process the binary data using appropriate nodes (e.g., Read Binary File)

### Expected Response Format

Your n8n webhook workflow should return a response with the following structure:

```json
{
  "response": "Assistant's response message"
}
```

If you return a different format, the application will fall back to stringifying the entire response.

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
       response: response
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
