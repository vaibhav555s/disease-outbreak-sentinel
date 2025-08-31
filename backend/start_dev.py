#!/usr/bin/env python3
"""
Development startup script for Outbreak Sentinel API
Provides easy development setup with hot reload and testing
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import fastapi
        import uvicorn
        import pydantic
        import pandas
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Run: pip install -r requirements.txt")
        return False

def start_server():
    """Start the development server"""
    print("🚀 Starting Outbreak Sentinel API Server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔄 Auto-reload enabled for development")
    print("\n" + "="*50)
    
    # Start server with development settings
    os.system("python run_server.py --reload --log-level debug")

def test_server():
    """Test if server is running and responsive"""
    print("🧪 Testing server connectivity...")
    
    max_retries = 10
    for i in range(max_retries):
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            if response.status_code == 200:
                print("✅ Server is running and responsive!")
                
                # Test a data endpoint
                response = requests.get("http://localhost:8000/api/hospital?days=1")
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Data endpoint working - {len(data.get('data', []))} records returned")
                    return True
                else:
                    print(f"⚠️  Data endpoint issue: {response.status_code}")
                    return False
            
        except requests.exceptions.ConnectionError:
            print(f"⏳ Waiting for server... ({i+1}/{max_retries})")
            time.sleep(2)
        except Exception as e:
            print(f"❌ Test error: {e}")
            return False
    
    print("❌ Server failed to start or respond")
    return False

def setup_sample_data():
    """Ensure sample data files exist"""
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    sample_files = [
        "hospital_data.json",
        "pharmacy_data.json", 
        "trends_data.json",
        "social_data.json"
    ]
    
    existing_files = []
    for filename in sample_files:
        file_path = data_dir / filename
        if file_path.exists():
            existing_files.append(filename)
    
    if existing_files:
        print(f"✅ Found {len(existing_files)} static data files:")
        for filename in existing_files:
            print(f"   📄 {filename}")
    else:
        print("ℹ️  No static data files found - will use synthetic data")
    
    return len(existing_files)

def main():
    """Main development startup routine"""
    print("="*60)
    print("🏥 OUTBREAK SENTINEL API - DEVELOPMENT SETUP")
    print("="*60)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Setup sample data
    setup_sample_data()
    
    print("\n" + "="*50)
    print("🎯 DEVELOPMENT SERVER STARTUP")
    print("="*50)
    
    try:
        # Start the server (this will block)
        start_server()
    except KeyboardInterrupt:
        print("\n🛑 Server shutdown requested")
        print("👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Server startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
