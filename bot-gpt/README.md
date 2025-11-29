# BOT GPT - Conversational AI Backend

A conversational AI backend built with FastAPI, LangChain, LangGraph, and GROQ.

## Features

- **FastAPI Backend**: Clean REST API endpoints
- **LangChain Integration**: ChatGroq with ConversationBufferWindowMemory
- **LangGraph Workflow**: State machine for message processing
- **SQLite Database**: Simple local storage with SQLAlchemy
- **Context Management**: Sliding window of last 10 messages

## Project Structure

```
bot-gpt/
├── main.py              # FastAPI app with all endpoints
├── database.py          # SQLAlchemy models and DB setup
├── llm_service.py       # LangChain + GROQ integration
├── graph_workflow.py    # LangGraph state machine
├── .env.example         # Example environment file
└── README.md            # This file
```

## Setup Instructions

### 1. Get GROQ API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `gsk_`)

### 2. Set Environment Variable

The GROQ_API_KEY should be set in your environment or in a `.env` file:

```bash
export GROQ_API_KEY=gsk_your_key_here
```

### 3. Run the Project

```bash
cd bot-gpt
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```bash
curl http://localhost:8000/health
# Response: {"status": "healthy"}
```

### Create Conversation
```bash
curl -X POST http://localhost:8000/conversations \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "message": "Hello, who are you?", "mode": "open"}'
# Response: {"conversation_id": "uuid", "response": "AI reply"}
```

### List Conversations
```bash
curl http://localhost:8000/conversations?user_id=1
# Response: [{"id": "...", "title": "...", "messages": [...]}]
```

### Get Conversation
```bash
curl http://localhost:8000/conversations/{conversation_id}
# Response: {"id": "...", "messages": [...]}
```

### Add Message
```bash
curl -X POST http://localhost:8000/conversations/{conversation_id}/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me more"}'
# Response: {"response": "AI reply"}
```

### Delete Conversation
```bash
curl -X DELETE http://localhost:8000/conversations/{conversation_id}
# Response: {"success": true}
```

## Architecture

### LangGraph Workflow

The conversation processing uses a state machine with three nodes:

1. **process_message**: Loads conversation history from database (last 10 messages)
2. **call_llm**: Calls GROQ API with context using LangChain
3. **save_response**: Saves both user message and AI response to database

```
START -> process_message -> call_llm -> save_response -> END
```

### Context Management

- Uses ConversationBufferWindowMemory with k=10
- Only last 10 messages are sent to the LLM for context
- All messages are stored in the database for history

### Model

- **Model**: llama3-70b-8192 (via GROQ)
- **Temperature**: 0.7
- **Max Tokens**: 1024

## Future Features (Not Implemented)

- **RAG Mode**: Document-based question answering with embeddings
- **User Authentication**: JWT-based auth system
- **Document Upload**: PDF/text file processing

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| GROQ_API_KEY | Your GROQ API key | Yes |

## Testing

Run the test file:

```bash
pytest test_api.py -v
```

## License

MIT
