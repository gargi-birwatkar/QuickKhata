@echo off
echo ===================================================
echo Starting QuickKhata Full Stack App (MiniMoth OTP)
echo ===================================================

start cmd /k "echo Starting QuickKhata Backend... && cd backend && python run.py"
start cmd /k "echo Starting QuickKhata Frontend... && cd frontend && npm run dev"

echo Backend running at http://localhost:8000
echo Frontend running at http://localhost:5173
echo.
