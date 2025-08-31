#!/usr/bin/env python3
"""
Dependency installer for Outbreak Sentinel API Backend
Handles Python 3.13 compatibility issues
"""

import subprocess
import sys
import os

def run_command(command):
    """Run a command and return success status"""
    try:
        print(f"Running: {command}")
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ Success: {command}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {command}")
        print(f"Error: {e.stderr}")
        return False

def install_dependencies():
    """Install dependencies with Python 3.13 compatibility"""
    print("="*60)
    print("🏥 OUTBREAK SENTINEL API - DEPENDENCY INSTALLER")
    print("="*60)
    print(f"Python version: {sys.version}")
    print(f"Platform: {sys.platform}")
    
    # Core dependencies that should work with Python 3.13
    core_deps = [
        "fastapi",
        "uvicorn[standard]", 
        "pydantic",
        "python-dateutil",
        "httpx",
        "requests",
        "python-dotenv"
    ]
    
    print("\n📦 Installing core dependencies...")
    
    failed_packages = []
    
    for package in core_deps:
        print(f"\n📥 Installing {package}...")
        success = run_command(f"pip install {package}")
        if not success:
            failed_packages.append(package)
    
    # Optional dependencies (may fail on Python 3.13)
    optional_deps = [
        ("pytest", "Testing framework"),
        ("pytest-asyncio", "Async testing support")
    ]
    
    print("\n📦 Installing optional dependencies...")
    
    for package, description in optional_deps:
        print(f"\n📥 Installing {package} ({description})...")
        success = run_command(f"pip install {package}")
        if not success:
            print(f"⚠️  Optional package {package} failed - continuing without it")
    
    # Summary
    print("\n" + "="*60)
    print("📋 INSTALLATION SUMMARY")
    print("="*60)
    
    if failed_packages:
        print(f"❌ Failed packages: {', '.join(failed_packages)}")
        print("⚠️  Some packages failed to install")
        return False
    else:
        print("✅ All core dependencies installed successfully!")
        
        # Test imports
        print("\n🧪 Testing imports...")
        try:
            import fastapi
            import uvicorn
            import pydantic
            print("✅ All imports successful!")
            
            print("\n🚀 Ready to start the server!")
            print("Run: python start_dev.py")
            return True
            
        except ImportError as e:
            print(f"❌ Import test failed: {e}")
            return False

if __name__ == "__main__":
    success = install_dependencies()
    sys.exit(0 if success else 1)
