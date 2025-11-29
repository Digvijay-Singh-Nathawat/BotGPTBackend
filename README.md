# BOT GPT

A conversational AI chatbot application with a Python FastAPI backend and React frontend. Powered by LangChain, LangGraph, and GROQ's Llama 3.3 model.

## Features

- **Real-time Conversational AI** - Chat with an AI assistant powered by GROQ's Llama 3.3-70B model
- **Conversation Memory** - Maintains sliding window of last 10 messages for context-aware responses
- **Multiple Conversations** - Create and manage multiple separate conversations
- **LangGraph Workflow** - State machine-based message processing (process → LLM → save)
- **Persistent Storage** - SQLite database for storing conversations and messages
- **Clean UI** - Modern React-based chat interface with real-time updates
- **Plain Text Responses** - AI responses without markdown formatting or asterisks

## Tech Stack

### Backend
- **Python 3.9+**
- **FastAPI** - High-performance async web framework
- **LangChain** - LLM application framework
- **LangGraph** - Graph-based workflow orchestration
- **ChatGroq** - GROQ API integration for Llama models
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Headless component library
- **Wouter** - Client-side routing

## Installation

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- GROQ API key

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bot-gpt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

   The application will start on:
   - Frontend: http://localhost:5000
   - Backend: http://localhost:8000

## Usage

### Starting a Conversation

1. Open the application in your browser
2. Type a message in the input field
3. Press Enter or click the send button
4. The AI will respond with contextual answers

### Creating New Conversations

- Click the "+ New Chat" button in the sidebar
- Each conversation maintains its own message history

### Deleting Conversations

- Click the trash icon next to a conversation in the sidebar
- The conversation and all its messages will be permanently deleted

## Project Structure

```
.
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # Utilities and API functions
│   │   └── App.tsx           # Main application component
│   └── index.html            # HTML entry point
├── bot-gpt/                   # Python backend
│   ├── main.py               # FastAPI application and routes
│   ├── llm_service.py        # LangChain and LLM integration
│   ├── graph_workflow.py     # LangGraph state machine
│   ├── database.py           # SQLAlchemy models and queries
│   └── requirements.txt       # Python dependencies
├── server/                    # Node.js server
│   ├── index.ts              # Express server and Python process manager
│   └── routes.ts             # API route definitions
└── package.json              # Project configuration
```

## Architecture

### Backend Flow

```
User Message
    ↓
FastAPI Route (/api/conversations/{id}/messages)
    ↓
LangGraph Workflow:
  1. process_message - Load conversation history (last 10 messages)
  2. call_llm - Generate response using GROQ Llama 3.3
  3. save_response - Save user message and AI response to database
    ↓
Response sent to Frontend
```

### Conversation Memory

- Maintains a sliding window of the last 10 messages
- Provides context for coherent multi-turn conversations
- Automatically managed by LangChain's message formatting

### Database Schema

**Users Table**
- `id` - Auto-incremented primary key
- `email` - User email

**Conversations Table**
- `id` - UUID primary key
- `user_id` - Foreign key to Users
- `mode` - Conversation mode ("open" or "rag")
- `title` - Auto-generated from first message
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Messages Table**
- `id` - UUID primary key
- `conversation_id` - Foreign key to Conversations
- `role` - "user" or "assistant"
- `content` - Message text
- `tokens_used` - Token count (placeholder)
- `timestamp` - Message timestamp

## API Endpoints

### Conversations

- `POST /api/init` - Initialize demo user
- `GET /api/conversations` - List all conversations for user
- `GET /api/conversations/{id}` - Get specific conversation with messages
- `POST /api/conversations` - Create new conversation
- `DELETE /api/conversations/{id}` - Delete conversation

### Messages

- `POST /api/conversations/{id}/messages` - Send message and get response
- `POST /conversations/{id}/messages/stream` - Stream response (experimental)

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | API key for GROQ service | Yes |
| `DATABASE_URL` | Database connection string | No (defaults to SQLite) |

### LLM Settings

Edit `bot-gpt/llm_service.py` to adjust:
- **Model**: `llama-3.3-70b-versatile` (line 34)
- **Temperature**: `0.7` (line 35) - Controls response creativity
- **Max Tokens**: `1024` (line 36) - Maximum response length

## Running in Development

### Frontend Only
```bash
npm run dev:client
```

### Backend Only
```bash
npm run dev:server
```

### Full Stack
```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

This creates optimized production builds for both frontend and backend.

## Troubleshooting

### "GROQ_API_KEY not set"
- Ensure you've created a `.env` file with your GROQ API key
- Restart the development server after adding the key

### Empty AI responses
- Check that the GROQ API key is valid
- Verify internet connection to GROQ service
- Check server logs for errors

### Database errors
- Ensure SQLite database file has write permissions
- Delete the database file to reset: `rm bot.db`
- Restart the application to recreate tables

### Frontend not updating
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Restart the development server
- Check that both frontend (port 5000) and backend (port 8000) are running

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review backend logs in the terminal
- Check browser console for frontend errors

## Acknowledgments

- [LangChain](https://python.langchain.com/) - LLM application framework
- [LangGraph](https://github.com/langchain-ai/langgraph) - Graph-based workflows
- [GROQ](https://groq.com/) - Fast LLM inference
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [React](https://react.dev/) - UI library
