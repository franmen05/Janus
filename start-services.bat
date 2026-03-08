@echo off
echo Starting Janus services...
echo.

echo [Backend] Starting Quarkus on http://localhost:8080
start "Janus Backend" cmd /c "cd janus-backend && gradlew quarkusDev"

echo [Frontend] Starting Angular on http://localhost:4200
start "Janus Frontend" cmd /c "cd janus-frontend && npx ng serve"

echo.
echo Both services starting in separate windows.
