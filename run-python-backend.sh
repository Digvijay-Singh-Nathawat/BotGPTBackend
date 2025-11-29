#!/bin/bash
cd bot-gpt
echo "Starting BOT GPT Python Backend..."
echo "Using model: llama-3.3-70b-versatile"
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000
