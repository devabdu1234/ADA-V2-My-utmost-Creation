@echo off
title A.P.A V2 launcher
cd /d "%~dp0"
set PYTHONUNBUFFERED=1
set PYTHONIOENCODING=utf-8
echo Starting A.P.A V2... (full log: apa_launch.log)
echo [%date% %time%] START > apa_launch.log
where python >> apa_launch.log 2>&1
python --version >> apa_launch.log 2>&1
where npm >> apa_launch.log 2>&1
echo Installing Python packages...
python -m pip install -q -r requirements.txt >> apa_launch.log 2>&1
echo [pip exit %errorlevel%] >> apa_launch.log
if not exist node_modules (echo Installing Node packages... & call npm install >> apa_launch.log 2>&1)
echo Launching...
call npm run dev >> apa_launch.log 2>&1
echo [%date% %time%] EXIT %errorlevel% >> apa_launch.log
