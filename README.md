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
- **Docker Ready** - Production-ready Docker configuration included
- **Fully Tested** - Comprehensive unit tests and CI/CD pipeline

## Tech Stack

### Backend
- **Python 3.11**
- **FastAPI** - High-performance async web framework
- **LangChain** - LLM application framework
- **LangGraph** - Graph-based workflow orchestration
- **ChatGroq** - GROQ API integration for Llama models
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **Uvicorn** - ASGI web server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Headless component library
- **Wouter** - Client-side routing

### Testing & CI/CD
- **pytest** - Python testing framework
- **pytest-cov** - Code coverage reporting
- **GitHub Actions** - Continuous integration pipeline

## Installation

### Prerequisites
- Node.js 16+ and npm
- Python 3.11+
- GROQ API key
- Docker (optional, for containerized deployment)

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

## 🧪 Testing

### Run Tests Locally

Install testing dependencies:
```bash
pip install -r bot-gpt/requirements.txt
```

Run all tests:
```bash
pytest tests/ -v
```

Run tests with coverage report:
```bash
pytest tests/ -v --cov=bot-gpt --cov-report=html --cov-report=term-missing
```

This generates an HTML coverage report in `htmlcov/index.html`

### Test Structure

The test suite includes 5+ test functions covering:

1. **test_health_endpoint()** - Verifies `/health` endpoint returns status 200 and "healthy" response
2. **test_create_conversation()** - Tests creating new conversations with messages via `POST /conversations`
3. **test_list_conversations()** - Tests listing all user conversations via `GET /conversations`
4. **test_get_conversation()** - Tests retrieving specific conversation with message history via `GET /conversations/{id}`
5. **test_delete_conversation()** - Tests deleting conversations and verifying 404 on subsequent access
6. **test_invalid_conversation_id()** - Tests error handling for non-existent conversations

### Continuous Integration

GitHub Actions automatically runs tests on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main` or `master`

#### Setup GitHub Secrets

To enable CI/CD, add your GROQ API key to GitHub:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secret named `GROQ_API_KEY` with your API key value
5. Click **Add secret**

#### View Test Results

1. Push code to your repository
2. Go to **Actions** tab in your GitHub repository
3. Click on the latest workflow run
4. View test output and coverage reports
5. Look for ✅ (passing) or ❌ (failing) indicators

The CI pipeline automatically:
- Sets up Python 3.11 environment
- Installs dependencies from requirements.txt
- Runs pytest with coverage reporting
- Uploads coverage to Codecov (optional)

## Docker Deployment

### Building the Docker Image

```bash
# Build the FastAPI backend image
docker build -t bot-gpt-backend .
```

### Running with Docker

```bash
# Run the container with environment variable
docker run -p 8000:8000 \
  -e GROQ_API_KEY=your_groq_api_key_here \
  bot-gpt-backend
```

### Docker Features

The provided Dockerfile includes:

- **Multi-stage build** - Smaller final image size
- **Python 3.11-slim base** - Lightweight base image
- **Non-root user** - Enhanced security (runs as `appuser`)
- **Layer caching** - Installs requirements first for faster rebuilds
- **Health checks** - Automatic container health monitoring
- **Environment variables** - Optimized Python runtime settings
  - `PYTHONDONTWRITEBYTECODE=1` - No `.pyc` files
  - `PYTHONUNBUFFERED=1` - Real-time log output

### Production Deployment

For production environments:

1. Use a managed container service (Docker Hub, ECR, GCR, etc.)
2. Store secrets using environment variables or secrets manager
3. Use reverse proxy (Nginx) for SSL/TLS
4. Configure persistent volume for database backups
5. Set resource limits and health checks
6. Use container orchestration (Kubernetes, Docker Swarm) for scaling

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
├── tests/                     # Unit tests
│   ├── __init__.py           # Test package initialization
│   └── test_api.py           # API endpoint tests
├── .github/workflows/         # GitHub Actions CI/CD
│   └── ci.yml                # Continuous integration pipeline
├── Dockerfile                 # Docker configuration
├── .dockerignore              # Docker build context exclusions
├── package.json              # Project configuration
└── README.md                 # This file
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

### Health

- `GET /health` - Health check endpoint (used by Docker health checks)

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GROQ_API_KEY` | API key for GROQ service | Yes | - |
| `DATABASE_URL` | Database connection string | No | SQLite |
| `PORT` | Backend server port | No | 8000 |

### LLM Settings

Edit `bot-gpt/llm_service.py` to adjust:
- **Model**: `llama-3.3-70b-versatile` (line 34) - Can use other GROQ models
- **Temperature**: `0.7` (line 35) - Controls response creativity (0.0-2.0)
- **Max Tokens**: `1024` (line 36) - Maximum response length

## Running in Development

### Frontend Only
```bash
npm run dev:client
```

### Backend Only (requires manual Python setup)
```bash
cd bot-gpt
pip install -r requirements.txt
python main.py
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
- For Docker: Pass the key as environment variable: `-e GROQ_API_KEY=your_key`
- Restart the development server or container after adding the key

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

### Docker container exits immediately
- Check logs: `docker logs <container_id>`
- Ensure GROQ_API_KEY is provided
- Verify port 8000 is not already in use

### Docker health check failing
- Backend may be starting slower than expected
- Increase health check timeout in Dockerfile if needed
- Check application logs: `docker logs <container_id>`

### Tests failing in CI/CD
- Ensure GROQ_API_KEY GitHub secret is configured
- Check test logs in GitHub Actions
- Run tests locally with `pytest -v` to debug
- Verify all dependencies are in requirements.txt

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Write or update tests to cover your changes
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review backend logs in the terminal
- Check browser console for frontend errors
- For Docker issues: Check container logs with `docker logs`
- For test failures: Run `pytest -v` locally and check GitHub Actions logs

## Acknowledgments

- [LangChain](https://python.langchain.com/) - LLM application framework
- [LangGraph](https://github.com/langchain-ai/langgraph) - Graph-based workflows
- [GROQ](https://groq.com/) - Fast LLM inference
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [React](https://react.dev/) - UI library
- [Docker](https://www.docker.com/) - Containerization platform
- [pytest](https://pytest.org/) - Python testing framework
