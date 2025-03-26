#!/bin/bash
# start-servers.sh
# Start all servers for the AzeriMarket application

# Kill any process using port 3000 first
echo "Checking for processes using port 3000..."
PID=$(lsof -ti:3000)
if [ ! -z "$PID" ]; then
  echo "Killing process $PID using port 3000..."
  kill -9 $PID
fi

# Start the combined application
echo "Starting the combined application (backend + frontend + image server)..."
NODE_ENV=development node index.js &

# Store the PID of the server
SERVER_PID=$!

# Add a health check to wait for the server to be ready
echo "Waiting for services to fully initialize..."

# Longer initial wait to give server time to start
sleep 10

# Health check function
check_server() {
  # Try to fetch the API endpoint
  echo "Checking if server is ready..."
  
  # Try to connect to the server
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "API server is up and running!"
    return 0
  else
    echo "API server not ready yet. Waiting..."
    return 1
  fi
}

# Try health check up to 5 times
MAX_TRIES=5
TRIES=0

while [ $TRIES -lt $MAX_TRIES ]; do
  if check_server; then
    break
  fi
  
  TRIES=$((TRIES+1))
  sleep 5
done

if [ $TRIES -eq $MAX_TRIES ]; then
  echo "Warning: Server may not be fully initialized after $((MAX_TRIES * 5)) seconds, but proceeding anyway."
else 
  echo "Server initialized successfully after $((TRIES * 5 + 10)) seconds!"
fi

echo "All services should now be running. Server PID: $SERVER_PID"
echo "Press Ctrl+C to stop all services"

# Wait for the main process to complete
wait $SERVER_PID

# Note: This script now starts a single combined server instead of multiple separate servers
# The combined server handles the backend API, frontend static files, and image serving 