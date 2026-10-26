@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "G:\assingment\ADA-V2-My-utmost-Creation"
concurrently -k "vite" "wait-on tcp:5173 && npx electron ."