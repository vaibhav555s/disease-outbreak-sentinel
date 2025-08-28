#!/bin/bash

# Setup and Run Data Collection Scripts
# This script sets up the environment and runs data collection

echo "=========================================="
echo "Disease Surveillance Data Collection Setup"
echo "=========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is not installed. Please install pip3."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Download NLTK data
echo "Downloading NLTK data..."
python3 -c "import nltk; nltk.download('stopwords', quiet=True); nltk.download('punkt', quiet=True)"

# Create necessary directories
mkdir -p output
mkdir -p config

# Check for credentials
echo "Checking for API credentials..."

if [ ! -f ".env" ] && [ ! -f "config/twitter_credentials.json" ]; then
    echo "Warning: No Twitter API credentials found."
    echo "Please either:"
    echo "1. Copy .env.template to .env and fill in your credentials, OR"
    echo "2. Copy config/twitter_credentials_template.json to config/twitter_credentials.json and fill in your credentials"
    echo ""
    echo "Without credentials, only Google Trends data will be collected."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run data collection
echo "Starting data collection..."
echo "This may take several minutes..."

# Run the unified data collection script
python3 run_data_collection.py --days 30 --max-tweets 1000

# Check if collection was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "Data collection completed successfully!"
    echo "=========================================="
    echo "Check the 'output' directory for generated files."
    echo ""
    echo "To integrate with your dashboard:"
    echo "1. Review the generated CSV/JSON files in the output directory"
    echo "2. Use the convert_to_dashboard_format() function to convert data"
    echo "3. Copy the converted files to your dashboard's public/data directory"
else
    echo ""
    echo "=========================================="
    echo "Data collection failed!"
    echo "=========================================="
    echo "Check the log files for error details:"
    echo "- data_collection.log"
    echo "- trends_collector.log"
    echo "- social_media_collector.log"
fi

# Deactivate virtual environment
deactivate

echo ""
echo "Setup and collection process completed."
