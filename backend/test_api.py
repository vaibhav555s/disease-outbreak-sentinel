#!/usr/bin/env python3
"""
API Test Script for Outbreak Sentinel Backend
Tests all endpoints and validates response format
"""

import requests
import json
import sys
from datetime import datetime

API_BASE = "http://localhost:8000"

def test_endpoint(endpoint: str, params: dict = None):
    """Test a single API endpoint"""
    url = f"{API_BASE}{endpoint}"
    
    try:
        print(f"\n🔍 Testing: {endpoint}")
        print(f"URL: {url}")
        if params:
            print(f"Params: {params}")
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ Status: {response.status_code}")
            print(f"📊 Records: {len(data.get('data', []))}")
            
            # Show sample data point
            if data.get('data'):
                sample = data['data'][0]
                print(f"📝 Sample: {sample.get('location')} - {sample.get('disease')} - {sample.get('value')}")
            
            # Show metadata
            if data.get('metadata'):
                metadata = data['metadata']
                print(f"🏷️  Metadata: {metadata.get('data_type')} ({metadata.get('source')})")
            
            return True
        else:
            print(f"❌ Status: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection failed - is the server running on {API_BASE}?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run comprehensive API tests"""
    print("="*60)
    print("OUTBREAK SENTINEL API TEST SUITE")
    print("="*60)
    print(f"Testing API at: {API_BASE}")
    print(f"Test time: {datetime.now().isoformat()}")
    
    # Test cases
    test_cases = [
        # Health check
        ("/health", None),
        
        # Basic endpoints
        ("/api/hospital", None),
        ("/api/pharmacy", None),
        ("/api/trends", None),
        ("/api/social", None),
        
        # With parameters
        ("/api/hospital", {"days": 3, "cities": "Mumbai,Delhi"}),
        ("/api/pharmacy", {"days": 5, "data_source": "synthetic", "include_outbreak": "true"}),
        ("/api/trends", {"days": 7, "states": "Maharashtra", "data_source": "synthetic"}),
        ("/api/social", {"days": 2, "platforms": "twitter", "data_source": "synthetic"}),
        
        # Unified endpoint
        ("/api/unified", {"days": 3, "sources": "hospital,pharmacy"}),
        ("/api/unified", {"days": 5, "sources": "trends,social", "data_source": "synthetic"}),
        
        # Static data (if available)
        ("/api/hospital", {"data_source": "static"}),
        ("/api/pharmacy", {"data_source": "static"}),
        ("/api/trends", {"data_source": "static"}),
        ("/api/social", {"data_source": "static"}),
    ]
    
    # Run tests
    passed = 0
    total = len(test_cases)
    
    for endpoint, params in test_cases:
        if test_endpoint(endpoint, params):
            passed += 1
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check server logs for details.")
        return 1

def test_data_schema():
    """Test that returned data matches expected schema"""
    print("\n🔍 Testing Data Schema Compliance")
    
    try:
        response = requests.get(f"{API_BASE}/api/hospital?days=1")
        if response.status_code != 200:
            print("❌ Could not fetch test data")
            return False
        
        data = response.json()
        if not data.get('data'):
            print("❌ No data returned")
            return False
        
        sample = data['data'][0]
        required_fields = ['timestamp', 'location', 'disease', 'source', 'value']
        
        for field in required_fields:
            if field not in sample:
                print(f"❌ Missing required field: {field}")
                return False
        
        # Validate data types
        if not isinstance(sample['value'], (int, float)):
            print(f"❌ Value field should be numeric, got: {type(sample['value'])}")
            return False
        
        if not (0 <= sample['value'] <= 100):
            print(f"❌ Value should be 0-100, got: {sample['value']}")
            return False
        
        print("✅ Data schema is compliant")
        return True
        
    except Exception as e:
        print(f"❌ Schema test failed: {e}")
        return False

if __name__ == "__main__":
    # Run main tests
    exit_code = main()
    
    # Run schema test
    if exit_code == 0:
        schema_ok = test_data_schema()
        if not schema_ok:
            exit_code = 1
    
    print(f"\n🏁 Test suite completed with exit code: {exit_code}")
    sys.exit(exit_code)
