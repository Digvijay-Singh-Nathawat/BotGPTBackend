"""
LangChain + GROQ integration for LLM calls.
Uses ChatGroq with ConversationBufferWindowMemory.
"""

import os
from typing import List, Dict
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage, AIMessage

# Load environment variables
load_dotenv()

# System prompt for the AI assistant
SYSTEM_PROMPT = """You are BOT GPT, a helpful and knowledgeable AI assistant. 
You provide clear, accurate, and helpful responses to user questions.
You are friendly but professional, and you aim to be concise while being thorough.
If you don't know something, you say so honestly."""

# Initialize ChatGroq with llama3-70b-8192 model
def get_llm():
    """Get the ChatGroq LLM instance."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    return ChatGroq(
        api_key=api_key,
        model_name="llama3-70b-8192",
        temperature=0.7,
        max_tokens=1024
    )


def create_memory(k: int = 10) -> ConversationBufferWindowMemory:
    """
    Create a ConversationBufferWindowMemory that keeps last k messages.
    This implements the sliding window for context management.
    """
    return ConversationBufferWindowMemory(
        k=k,
        return_messages=True,
        memory_key="chat_history"
    )


def format_messages_for_memory(messages: List[Dict]) -> List:
    """
    Convert database messages to LangChain message format.
    Only takes the last 10 messages for context.
    """
    formatted = []
    # Take only last 10 messages for context window
    recent_messages = messages[-10:] if len(messages) > 10 else messages
    
    for msg in recent_messages:
        if msg["role"] == "user":
            formatted.append(HumanMessage(content=msg["content"]))
        else:
            formatted.append(AIMessage(content=msg["content"]))
    
    return formatted


async def generate_response(
    user_message: str,
    conversation_history: List[Dict]
) -> str:
    """
    Generate a response using GROQ via LangChain.
    
    Args:
        user_message: The current user message
        conversation_history: List of previous messages [{"role": "user/assistant", "content": "..."}]
    
    Returns:
        The AI response as a string
    """
    try:
        llm = get_llm()
        
        # Create the prompt template with system message and chat history
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        
        # Format the conversation history (last 10 messages only)
        chat_history = format_messages_for_memory(conversation_history)
        
        # Create the chain
        chain = prompt | llm
        
        # Invoke the chain
        response = await chain.ainvoke({
            "chat_history": chat_history,
            "input": user_message
        })
        
        return response.content
        
    except Exception as e:
        print(f"Error generating response: {e}")
        raise


def generate_response_sync(
    user_message: str,
    conversation_history: List[Dict]
) -> str:
    """
    Synchronous version of generate_response for non-async contexts.
    """
    try:
        llm = get_llm()
        
        # Create the prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        
        # Format history (last 10 messages only - sliding window)
        chat_history = format_messages_for_memory(conversation_history)
        
        # Create and invoke chain
        chain = prompt | llm
        response = chain.invoke({
            "chat_history": chat_history,
            "input": user_message
        })
        
        return response.content
        
    except Exception as e:
        print(f"Error generating response: {e}")
        raise
