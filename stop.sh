#!/bin/bash

# Function to kill process by port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid
    else
        echo "No process found on port $port"
    fi
}

# Kill frontend (port 3000)
kill_port 3000

# Kill backend (port 5002)
kill_port 5002

echo "All services stopped"
