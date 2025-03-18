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
NODE_ENV=development node index.js

# Note: This script now starts a single combined server instead of multiple separate servers
# The combined server handles the backend API, frontend static files, and image serving 