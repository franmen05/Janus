#!/bin/bash
echo "Starting Janus services..."
echo

# Start backend in a new Terminal tab
echo "[Backend] Starting Quarkus on http://localhost:8080"
osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/janus-backend && ./gradlew quarkusDev"'

# Start frontend in a new Terminal tab
echo "[Frontend] Starting Angular on http://localhost:4200"
osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/janus-frontend && npx ng serve"'

echo
echo "Both services starting in separate Terminal windows."
