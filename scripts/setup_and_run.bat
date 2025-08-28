@echo off
REM Setup and Run Data Collection Scripts for Windows
REM This script sets up the environment and runs data collection

echo ==========================================
echo Disease Surveillance Data Collection Setup
echo ==========================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH. Please install Python 3.7 or higher.
    pause
    exit /b 1
)

REM Check if pip is installed
pip --version >nul 2>&1
if errorlevel 1 (
    echo Error: pip is not installed. Please install pip.
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Download NLTK data
echo Downloading NLTK data...
python -c "import nltk; nltk.download('stopwords', quiet=True); nltk.download('punkt', quiet=True)"

REM Create necessary directories
if not exist "output" mkdir output
if not exist "config" mkdir config

REM Check for credentials
echo Checking for API credentials...

if not exist ".env" if not exist "config\twitter_credentials.json" (
    echo Warning: No Twitter API credentials found.
    echo Please either:
    echo 1. Copy .env.template to .env and fill in your credentials, OR
    echo 2. Copy config\twitter_credentials_template.json to config\twitter_credentials.json and fill in your credentials
    echo.
    echo Without credentials, only Google Trends data will be collected.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)

REM Run data collection
echo Starting data collection...
echo This may take several minutes...

REM Run the unified data collection script
python run_data_collection.py --days 30 --max-tweets 1000

REM Check if collection was successful
if errorlevel 1 (
    echo.
    echo ==========================================
    echo Data collection failed!
    echo ==========================================
    echo Check the log files for error details:
    echo - data_collection.log
    echo - trends_collector.log
    echo - social_media_collector.log
) else (
    echo.
    echo ==========================================
    echo Data collection completed successfully!
    echo ==========================================
    echo Check the 'output' directory for generated files.
    echo.
    echo To integrate with your dashboard:
    echo 1. Review the generated CSV/JSON files in the output directory
    echo 2. Use the convert_to_dashboard_format() function to convert data
    echo 3. Copy the converted files to your dashboard's public/data directory
)

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat

echo.
echo Setup and collection process completed.
pause
