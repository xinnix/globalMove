#!/bin/bash

echo "Stopping frontend service..."
cd frontend && npm run stop

echo "Stopping backend service..."
cd ../backend && npm run stop

echo "All services stopped."
