#!/bin/bash

# Start Python FastAPI backend on port 8000
cd bot-gpt
echo "Starting Python FastAPI backend on port 8000..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
PYTHON_PID=$!

# Go back to root and start Node.js frontend
cd ..
echo "Starting Node.js frontend on port 5000..."
npm run dev &
NODE_PID=$!

# Wait for both processes
wait $PYTHON_PID $NODE_PID
