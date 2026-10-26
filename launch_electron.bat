@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "G:\assingment\ADA-V2-My-utmost-Creation"
echo Starting Vite...
start "Vite" cmd /c "vite --mode development"
timeout /t 5 /nobreak > nul
echo Launching Electron...
start "Electron" cmd /c "electron ."