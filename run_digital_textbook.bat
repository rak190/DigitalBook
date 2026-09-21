@echo off
title English File Pre-Intermediate - Digital Interactive Textbook
echo ======================================================================
echo  Starting Oxford English File Pre-Intermediate Digital Interactive Book
echo  URL: http://localhost:8000
echo ======================================================================
cd /d "%~dp0"
start http://localhost:8000
python server.py
pause
