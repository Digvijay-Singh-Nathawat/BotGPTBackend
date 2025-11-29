"""
Database models and setup using SQLAlchemy with SQLite.
Defines three tables: users, conversations, and messages.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session

# SQLite database file
DATABASE_URL = "sqlite:///./bot_gpt.db"

# Create engine with SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class User(Base):
    """User model - stores basic user information."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to conversations
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")


class Conversation(Base):
    """Conversation model - represents a chat session."""
    __tablename__ = "conversations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mode = Column(String(20), default="open")  # "open" or "rag"
    title = Column(String(255), default="New Conversation")
    extra_data = Column(JSON, default=dict)  # Renamed from 'metadata' (reserved)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """Message model - stores individual messages in a conversation."""
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    conversation = relationship("Conversation", back_populates="messages")


def create_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        return db
    finally:
        pass


# Database helper functions
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, email: str) -> User:
    """Create a new user."""
    user = User(email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_conversation(db: Session, conversation_id: str) -> Optional[Conversation]:
    """Get conversation by ID."""
    return db.query(Conversation).filter(Conversation.id == conversation_id).first()


def get_user_conversations(db: Session, user_id: int) -> List[Conversation]:
    """Get all conversations for a user."""
    return db.query(Conversation).filter(
        Conversation.user_id == user_id
    ).order_by(Conversation.updated_at.desc()).all()


def create_conversation(db: Session, user_id: int, mode: str = "open") -> Conversation:
    """Create a new conversation."""
    conv = Conversation(user_id=user_id, mode=mode)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def delete_conversation(db: Session, conversation_id: str) -> bool:
    """Delete a conversation and all its messages."""
    conv = get_conversation(db, conversation_id)
    if conv:
        db.delete(conv)
        db.commit()
        return True
    return False


def update_conversation_title(db: Session, conversation_id: str, title: str):
    """Update conversation title."""
    conv = get_conversation(db, conversation_id)
    if conv:
        conv.title = title
        conv.updated_at = datetime.utcnow()
        db.commit()


def get_messages(db: Session, conversation_id: str, limit: Optional[int] = None) -> List[Message]:
    """Get messages for a conversation, optionally limited."""
    query = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.timestamp)
    
    if limit:
        # Get last N messages
        all_msgs = query.all()
        return all_msgs[-limit:] if len(all_msgs) > limit else all_msgs
    return query.all()


def create_message(db: Session, conversation_id: str, role: str, content: str, tokens_used: int = 0) -> Message:
    """Create a new message."""
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        tokens_used=tokens_used
    )
    db.add(msg)
    
    # Update conversation timestamp
    conv = get_conversation(db, conversation_id)
    if conv:
        conv.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(msg)
    return msg


# Initialize database on module load
create_tables()
print("Database initialized successfully!")
