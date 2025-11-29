// Mock AI responses based on user input
const responses: Record<string, string[]> = {
  python: [
    "Python is a great choice for backend development! For a FastAPI project, consider structuring it with:\n\n- `/app/main.py` - Entry point\n- `/app/api/` - API routes\n- `/app/core/` - Configuration & middleware\n- `/app/models/` - Database models\n- `/app/schemas/` - Pydantic validation schemas\n- `/app/services/` - Business logic\n\nThis separation keeps concerns isolated and makes testing easier.",
    "Python supports both sync and async operations. For I/O-bound tasks like API calls, async/await is more efficient. Here's a quick tip:\n\n```python\nasync def fetch_data():\n    async with aiohttp.ClientSession() as session:\n        async with session.get(url) as resp:\n            return await resp.json()\n```\n\nUse this pattern for your GROQ API calls to avoid blocking.",
  ],
  database: [
    "SQLite is perfect for prototypes! However, for production, consider:\n\n- **PostgreSQL**: Better concurrency, more features\n- **MongoDB**: If you need flexible schemas\n- **SQLAlchemy ORM**: Makes queries cleaner\n\nFor your BOT GPT project, SQLite is sufficient initially. Just add indexes on frequently queried columns.",
    "Database optimization tips:\n\n1. Always index your WHERE and JOIN columns\n2. Use `EXPLAIN QUERY PLAN` to analyze performance\n3. Batch operations in transactions\n4. Consider caching with Redis for frequently accessed data\n\nFor conversations table, index `user_id` and `created_at` for faster lookups.",
  ],
  api: [
    "For REST API best practices:\n\n- Use proper HTTP methods: GET (retrieve), POST (create), PUT (update), DELETE (remove)\n- Return consistent JSON responses: `{\"status\": \"success\", \"data\": {...}}`\n- Use HTTP status codes correctly: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error)\n- Add authentication/authorization layer\n- Document with OpenAPI/Swagger\n\nYour endpoints should follow this pattern.",
    "FastAPI automatically generates Swagger documentation! Just run your server and visit `/docs` to see the interactive API explorer. Define your request/response models using Pydantic:\n\n```python\nfrom pydantic import BaseModel\n\nclass MessageRequest(BaseModel):\n    content: str\n    conversation_id: str\n```\n\nThis ensures type safety and automatic validation.",
  ],
  langchain: [
    "LangChain simplifies LLM integrations. Key components:\n\n1. **ChatGroq**: Direct integration with GROQ API\n2. **ConversationBufferWindowMemory**: Keeps last N messages for context\n3. **Prompt Templates**: Reusable prompt structures\n4. **Chains**: Connect multiple operations together\n\nFor your project:\n```python\nfrom langchain_groq import ChatGroq\nmemory = ConversationBufferWindowMemory(k=10)\nchain = ChatGroq(memory=memory)\n```",
    "LangGraph creates state machines for complex workflows. For BOT GPT:\n\n1. **process_message node**: Load conversation history\n2. **call_llm node**: Query GROQ API\n3. **save_response node**: Store in database\n\nThis ensures proper flow control and error handling at each stage.",
  ],
  groq: [
    "GROQ API Key setup:\n\n1. Get your key from console.groq.com\n2. Add to `.env` file: `GROQ_API_KEY=gsk_...`\n3. Load in Python: `api_key = os.getenv('GROQ_API_KEY')`\n4. Never commit `.env` to version control!\n\nThe model `llama3-70b-8192` is fast and good for conversational AI with 8K context window.",
    "GROQ is fast because it uses specialized hardware. Typical response time: 100-300ms. For your 10-message window:\n- Memory usage: ~50KB per conversation\n- API cost: Pay per token (~$0.0005 per 1K tokens)\n- Rate limit: Check your plan\n\nConsider batch processing for better performance.",
  ],
  default: [
    "I'm here to help with questions about:\n- FastAPI and Python backend development\n- Database design and optimization\n- REST API best practices\n- LangChain and LangGraph integration\n- GROQ API integration\n\nWhat would you like to know?",
    "Interesting question! Based on my training, I'd recommend exploring the documentation and GitHub repositories for the technologies you're interested in. They often have great examples.",
    "That's a great topic! Here are some general principles:\n1. Keep your code modular and well-organized\n2. Use type hints for clarity\n3. Write tests for critical paths\n4. Document your API endpoints\n5. Consider scalability from the start\n\nAny specific area you'd like to dive deeper into?",
  ],
};

function findMatchingTopic(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("python") || lower.includes("api") || lower.includes("fastapi")) return "python";
  if (lower.includes("database") || lower.includes("sqlite") || lower.includes("sql")) return "database";
  if (lower.includes("rest") || lower.includes("endpoint") || lower.includes("http")) return "api";
  if (lower.includes("langchain") || lower.includes("langgraph")) return "langchain";
  if (lower.includes("groq") || lower.includes("api key") || lower.includes("llm")) return "groq";
  return "default";
}

export function generateMockResponse(userMessage: string): string {
  const topic = findMatchingTopic(userMessage);
  const topicResponses = responses[topic] || responses.default;
  const randomIndex = Math.floor(Math.random() * topicResponses.length);
  return topicResponses[randomIndex];
}
