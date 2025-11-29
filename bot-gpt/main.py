"""
BOT GPT - FastAPI Application
A conversational AI backend using LangChain, LangGraph, and GROQ.
"""

import os
from typing import Optional, List
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import (
    SessionLocal, create_tables,
    get_user_by_email, create_user,
    get_conversation, get_user_conversations, create_conversation, delete_conversation,
    get_messages, create_message, update_conversation_title
)
from graph_workflow import run_conversation_workflow

# Load environment variables
load_dotenv()

# Demo user ID (no auth for simplicity)
DEMO_USER_ID = 1


# Pydantic models for request/response
class MessageRequest(BaseModel):
    message: str


class ConversationCreate(BaseModel):
    user_id: Optional[int] = DEMO_USER_ID
    message: str
    mode: str = "open"


class ConversationResponse(BaseModel):
    conversation_id: str
    response: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    tokens_used: int
    timestamp: datetime

    class Config:
        from_attributes = True


class ConversationDetail(BaseModel):
    id: str
    user_id: int
    mode: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse]

    class Config:
        from_attributes = True


class HealthResponse(BaseModel):
    status: str


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and demo user on startup."""
    print("Starting BOT GPT API...")
    create_tables()
    
    # Create demo user if not exists
    db = SessionLocal()
    try:
        user = get_user_by_email(db, "demo@botgpt.ai")
        if not user:
            create_user(db, "demo@botgpt.ai")
            print("Created demo user: demo@botgpt.ai")
        else:
            print("Demo user already exists")
    finally:
        db.close()
    
    yield
    print("Shutting down BOT GPT API...")


# Create FastAPI app
app = FastAPI(
    title="BOT GPT API",
    description="Conversational AI backend using LangChain, LangGraph, and GROQ",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint - returns status."""
    return {"status": "healthy"}


# Initialize demo user endpoint
@app.post("/api/init")
async def init_user(db: Session = Depends(get_db)):
    """Initialize or get the demo user."""
    user = get_user_by_email(db, "demo@botgpt.ai")
    if not user:
        user = create_user(db, "demo@botgpt.ai")
    return {"user": {"id": user.id, "email": user.email}}


# Create new conversation with first message
@app.post("/conversations", response_model=ConversationResponse)
async def create_new_conversation(
    request: ConversationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new conversation with the first message.
    Uses LangGraph workflow to process the message.
    """
    try:
        # Create the conversation
        conv = create_conversation(db, user_id=DEMO_USER_ID, mode=request.mode)
        print(f"Created conversation: {conv.id}")
        
        # Run the conversation workflow (process, call LLM, save)
        response = run_conversation_workflow(
            db=db,
            conversation_id=conv.id,
            user_message=request.message
        )
        
        return {
            "conversation_id": conv.id,
            "response": response
        }
        
    except Exception as e:
        print(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# List all conversations for a user
@app.get("/conversations")
async def list_conversations(
    user_id: int = DEMO_USER_ID,
    db: Session = Depends(get_db)
):
    """Get all conversations for a user."""
    convs = get_user_conversations(db, user_id)
    
    result = []
    for conv in convs:
        messages = get_messages(db, conv.id)
        result.append({
            "id": conv.id,
            "user_id": conv.user_id,
            "mode": conv.mode,
            "title": conv.title,
            "created_at": conv.created_at.isoformat(),
            "updated_at": conv.updated_at.isoformat(),
            "messages": [
                {
                    "id": msg.id,
                    "conversation_id": msg.conversation_id,
                    "role": msg.role,
                    "content": msg.content,
                    "tokens_used": msg.tokens_used,
                    "timestamp": msg.timestamp.isoformat()
                }
                for msg in messages
            ]
        })
    
    return result


# Get single conversation with all messages
@app.get("/conversations/{conversation_id}")
async def get_conversation_detail(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Get a conversation with all its messages."""
    conv = get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = get_messages(db, conversation_id)
    
    return {
        "id": conv.id,
        "user_id": conv.user_id,
        "mode": conv.mode,
        "title": conv.title,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
        "messages": [
            {
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "role": msg.role,
                "content": msg.content,
                "tokens_used": msg.tokens_used,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in messages
        ]
    }


# Add message to existing conversation
@app.post("/conversations/{conversation_id}/messages")
async def add_message(
    conversation_id: str,
    request: MessageRequest,
    db: Session = Depends(get_db)
):
    """
    Add a new message to an existing conversation.
    Uses LangGraph workflow to process and respond.
    """
    # Check conversation exists
    conv = get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    try:
        # Run the conversation workflow
        response = run_conversation_workflow(
            db=db,
            conversation_id=conversation_id,
            user_message=request.message
        )
        
        # Get the saved messages
        messages = get_messages(db, conversation_id)
        user_msg = messages[-2] if len(messages) >= 2 else None
        ai_msg = messages[-1] if len(messages) >= 1 else None
        
        return {
            "response": response,
            "userMessage": {
                "id": user_msg.id if user_msg else None,
                "conversation_id": conversation_id,
                "role": "user",
                "content": request.message,
                "tokens_used": 0,
                "timestamp": user_msg.timestamp.isoformat() if user_msg else None
            },
            "aiMessage": {
                "id": ai_msg.id if ai_msg else None,
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": response,
                "tokens_used": 0,
                "timestamp": ai_msg.timestamp.isoformat() if ai_msg else None
            }
        }
        
    except Exception as e:
        print(f"Error adding message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Stream message responses
@app.post("/conversations/{conversation_id}/messages/stream")
async def add_message_stream(
    conversation_id: str,
    request: MessageRequest,
    db: Session = Depends(get_db)
):
    """
    Stream a message response using Server-Sent Events format.
    """
    from fastapi.responses import StreamingResponse
    from llm_service import stream_response_with_history
    
    # Check conversation exists
    conv = get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    try:
        # Save user message to DB
        create_message(db, conversation_id, "user", request.message)
        
        # Get conversation history
        messages = get_messages(db, conversation_id)
        history = [{"role": msg.role, "content": msg.content} for msg in messages[:-1]]
        
        # Stream the response
        async def event_generator():
            try:
                async for token in stream_response_with_history(request.message, history):
                    yield f"data: {json.dumps({'token': token})}\n\n"
                
                # Save AI response to DB
                # We'll collect full response in another approach
                yield "data: [DONE]\n\n"
                
                # Get the full response by making another call
                response = run_conversation_workflow(
                    db=db,
                    conversation_id=conversation_id,
                    user_message=request.message,
                    skip_user_msg=True
                )
            except Exception as e:
                print(f"Stream error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    except Exception as e:
        print(f"Error streaming message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Delete conversation
@app.delete("/conversations/{conversation_id}")
async def delete_conv(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Delete a conversation and all its messages."""
    conv = get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    delete_conversation(db, conversation_id)
    return {"success": True, "message": "Conversation deleted"}


# Run with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
