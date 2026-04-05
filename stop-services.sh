#!/bin/bash
echo "Stopping Janus services..."
echo

# Stop Quarkus (Gradle dev mode)
if pgrep -f "quarkusDev" > /dev/null; then
    pkill -f "quarkusDev"
    echo "[Backend] Quarkus stopped."
else
    echo "[Backend] Not running."
fi

# Stop Angular dev server
if pgrep -f "ng serve" > /dev/null; then
    pkill -f "ng serve"
    echo "[Frontend] Angular stopped."
else
    echo "[Frontend] Not running."
fi

echo
echo "Done."
