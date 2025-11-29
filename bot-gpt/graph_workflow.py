"""
LangGraph state machine for conversation workflow.
Implements a simple graph with three nodes:
- process_message: Load conversation history
- call_llm: Call GROQ API with context
- save_response: Save to database
"""

from typing import TypedDict, List, Dict, Optional, Annotated
from langgraph.graph import StateGraph, START, END
from sqlalchemy.orm import Session

from database import get_messages, create_message, update_conversation_title, get_conversation
from llm_service import generate_response_sync


# Define the state that flows through the graph
class ConversationState(TypedDict):
    """State object that tracks the conversation flow."""
    conversation_id: str
    user_message: str
    messages: List[Dict]
    current_response: Optional[str]
    db_session: Session
    error: Optional[str]


def process_message(state: ConversationState) -> ConversationState:
    """
    Node 1: Load conversation history from database.
    Gets the last 10 messages for context.
    """
    print(f"[process_message] Loading history for conversation: {state['conversation_id']}")
    
    try:
        db = state["db_session"]
        conversation_id = state["conversation_id"]
        
        # Get messages from database (last 10 for sliding window)
        db_messages = get_messages(db, conversation_id, limit=10)
        
        # Convert to simple dict format for LLM
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in db_messages
        ]
        
        print(f"[process_message] Loaded {len(messages)} messages from history")
        
        return {
            **state,
            "messages": messages,
            "error": None
        }
        
    except Exception as e:
        print(f"[process_message] Error: {e}")
        return {
            **state,
            "messages": [],
            "error": str(e)
        }


def call_llm(state: ConversationState) -> ConversationState:
    """
    Node 2: Call GROQ API with context.
    Uses LangChain to generate a response.
    """
    print(f"[call_llm] Generating response for: {state['user_message'][:50]}...")
    
    # Skip if there was an error in previous node
    if state.get("error"):
        return state
    
    try:
        # Call the LLM service
        response = generate_response_sync(
            user_message=state["user_message"],
            conversation_history=state["messages"]
        )
        
        print(f"[call_llm] Generated response: {response[:50]}...")
        
        return {
            **state,
            "current_response": response,
            "error": None
        }
        
    except Exception as e:
        print(f"[call_llm] Error: {e}")
        return {
            **state,
            "current_response": "Sorry, I encountered an error processing your request. Please try again.",
            "error": str(e)
        }


def save_response(state: ConversationState) -> ConversationState:
    """
    Node 3: Save both user message and AI response to database.
    Also updates the conversation title if it's the first message.
    """
    print(f"[save_response] Saving messages to database")
    
    try:
        db = state["db_session"]
        conversation_id = state["conversation_id"]
        
        # Save user message
        user_msg = create_message(
            db=db,
            conversation_id=conversation_id,
            role="user",
            content=state["user_message"],
            tokens_used=0
        )
        print(f"[save_response] Saved user message: {user_msg.id}")
        
        # Save AI response
        ai_msg = create_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=state["current_response"],
            tokens_used=0  # Token tracking placeholder
        )
        print(f"[save_response] Saved AI message: {ai_msg.id}")
        
        # Update conversation title if first message
        conv = get_conversation(db, conversation_id)
        if conv and conv.title == "New Conversation":
            title = state["user_message"][:30]
            if len(state["user_message"]) > 30:
                title += "..."
            update_conversation_title(db, conversation_id, title)
            print(f"[save_response] Updated title to: {title}")
        
        return {
            **state,
            "error": None
        }
        
    except Exception as e:
        print(f"[save_response] Error: {e}")
        return {
            **state,
            "error": str(e)
        }


def create_conversation_graph() -> StateGraph:
    """
    Create the LangGraph state machine for conversation processing.
    
    Flow: START -> process_message -> call_llm -> save_response -> END
    """
    # Create the graph
    graph = StateGraph(ConversationState)
    
    # Add nodes
    graph.add_node("process_message", process_message)
    graph.add_node("call_llm", call_llm)
    graph.add_node("save_response", save_response)
    
    # Add edges (linear flow)
    graph.add_edge(START, "process_message")
    graph.add_edge("process_message", "call_llm")
    graph.add_edge("call_llm", "save_response")
    graph.add_edge("save_response", END)
    
    return graph


# Compile the graph once
conversation_workflow = create_conversation_graph().compile()


def run_conversation_workflow(
    db: Session,
    conversation_id: str,
    user_message: str,
    skip_user_msg: bool = False
) -> str:
    """
    Run the complete conversation workflow.
    
    Args:
        db: Database session
        conversation_id: ID of the conversation
        user_message: The user's message
        skip_user_msg: If True, skip saving the user message (already saved)
    
    Returns:
        The AI response
    """
    print(f"\n{'='*50}")
    print(f"Running conversation workflow")
    print(f"Conversation: {conversation_id}")
    print(f"Message: {user_message[:50]}...")
    print(f"{'='*50}\n")
    
    # Create initial state
    initial_state: ConversationState = {
        "conversation_id": conversation_id,
        "user_message": user_message,
        "messages": [],
        "current_response": None,
        "db_session": db,
        "error": None
    }
    
    # Run the workflow
    final_state = conversation_workflow.invoke(initial_state)
    
    if final_state.get("error"):
        print(f"Workflow completed with error: {final_state['error']}")
    else:
        print("Workflow completed successfully!")
    
    return final_state.get("current_response", "Error generating response")
