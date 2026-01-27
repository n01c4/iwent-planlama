#!/bin/bash

echo "Starting all iWent frontend dev servers..."
echo ""

# Function to start a dev server in the background
start_server() {
    local name=$1
    local dir=$2
    local port=$3

    echo "[$4/3] Starting $name (http://localhost:$port)"
    cd "$dir" && npm run dev -- --port "$port" > "../logs/$name.log" 2>&1 &
    cd ..
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Start all servers
start_server "Admin Panel" "iwent-admin-panel" 5173 1
sleep 2
start_server "Organizer Panel" "iwent-organizatör-paneli" 5174 2
sleep 2
start_server "Welcome Screen" "iwent-welcome-screen" 5175 3

echo ""
echo "✓ All frontend servers starting..."
echo ""
echo "Admin Panel:      http://localhost:5173"
echo "Organizer Panel:  http://localhost:5174"
echo "Welcome Screen:   http://localhost:5175"
echo ""
echo "Logs are available in the logs/ directory"
echo "To stop all servers, run: pkill -f 'vite'"
