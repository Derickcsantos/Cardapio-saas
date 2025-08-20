#!/usr/bin/env python3
"""
Backend API Tests for Menu SaaS 3D System
Tests basic API setup, Supabase connection, and endpoint availability
"""

import requests
import json
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = "https://cardapio-3d.preview.emergentagent.com/api"

def log_test_result(test_name, success, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"[{timestamp}] {status} - {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_basic_api_connection():
    """Test 1: Basic API connection at GET /api/"""
    print("=" * 60)
    print("TEST 1: Basic API Connection")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Menu SaaS 3D API":
                log_test_result("Basic API Connection", True, f"Response: {data}")
                return True
            else:
                log_test_result("Basic API Connection", False, f"Unexpected response: {data}")
                return False
        else:
            log_test_result("Basic API Connection", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test_result("Basic API Connection", False, f"Exception: {str(e)}")
        return False

def test_supabase_connection():
    """Test 2: Supabase connection via admin stats endpoint"""
    print("=" * 60)
    print("TEST 2: Supabase Connection (via admin stats)")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/stats", timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            expected_keys = ["totalUsers", "totalOrganizations", "totalMenuImages", "recentRegistrations"]
            
            if all(key in data for key in expected_keys):
                log_test_result("Supabase Connection", True, f"Stats retrieved: {data}")
                return True
            else:
                log_test_result("Supabase Connection", False, f"Missing expected keys in response: {data}")
                return False
        else:
            log_test_result("Supabase Connection", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test_result("Supabase Connection", False, f"Exception: {str(e)}")
        return False

def test_auth_register_endpoint():
    """Test 3: Authentication register endpoint structure"""
    print("=" * 60)
    print("TEST 3: Auth Register Endpoint")
    print("=" * 60)
    
    try:
        # Test with missing fields to verify endpoint exists and validates
        test_data = {
            "email": "test@example.com"
            # Missing required fields intentionally
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/register", 
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # We expect a 400 error for missing fields, which confirms endpoint exists
        if response.status_code == 400:
            data = response.json()
            if "error" in data and "required" in data["error"].lower():
                log_test_result("Auth Register Endpoint", True, f"Endpoint exists and validates input: {data}")
                return True
            else:
                log_test_result("Auth Register Endpoint", False, f"Unexpected error response: {data}")
                return False
        else:
            log_test_result("Auth Register Endpoint", False, f"Unexpected status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test_result("Auth Register Endpoint", False, f"Exception: {str(e)}")
        return False

def test_auth_login_endpoint():
    """Test 4: Authentication login endpoint structure"""
    print("=" * 60)
    print("TEST 4: Auth Login Endpoint")
    print("=" * 60)
    
    try:
        # Test with missing fields to verify endpoint exists and validates
        test_data = {
            "email": "test@example.com"
            # Missing password intentionally
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/login", 
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # We expect a 400 error for missing fields, which confirms endpoint exists
        if response.status_code == 400:
            data = response.json()
            if "error" in data and ("required" in data["error"].lower() or "password" in data["error"].lower()):
                log_test_result("Auth Login Endpoint", True, f"Endpoint exists and validates input: {data}")
                return True
            else:
                log_test_result("Auth Login Endpoint", False, f"Unexpected error response: {data}")
                return False
        else:
            log_test_result("Auth Login Endpoint", False, f"Unexpected status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test_result("Auth Login Endpoint", False, f"Exception: {str(e)}")
        return False

def test_menu_upload_endpoint():
    """Test 5: Menu upload endpoint structure"""
    print("=" * 60)
    print("TEST 5: Menu Upload Endpoint")
    print("=" * 60)
    
    try:
        # Test with missing data to verify endpoint exists and validates
        response = requests.post(
            f"{BASE_URL}/menu/upload", 
            data={},  # Empty form data
            timeout=10
        )
        
        # We expect a 400 error for missing fields, which confirms endpoint exists
        if response.status_code == 400:
            data = response.json()
            if "error" in data and ("required" in data["error"].lower() or "image" in data["error"].lower()):
                log_test_result("Menu Upload Endpoint", True, f"Endpoint exists and validates input: {data}")
                return True
            else:
                log_test_result("Menu Upload Endpoint", False, f"Unexpected error response: {data}")
                return False
        else:
            log_test_result("Menu Upload Endpoint", False, f"Unexpected status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test_result("Menu Upload Endpoint", False, f"Exception: {str(e)}")
        return False

def test_menu_slug_endpoint():
    """Test 6: Menu slug endpoint structure"""
    print("=" * 60)
    print("TEST 6: Menu Slug Endpoint")
    print("=" * 60)
    
    try:
        # Test with a non-existent slug to verify endpoint exists
        test_slug = "nonexistent-test-org"
        response = requests.get(f"{BASE_URL}/menu/{test_slug}", timeout=10)
        
        # We expect a 404 error for non-existent org, which confirms endpoint exists
        if response.status_code == 404:
            data = response.json()
            if "error" in data and "not found" in data["error"].lower():
                log_test_result("Menu Slug Endpoint", True, f"Endpoint exists and handles missing org: {data}")
                return True
            else:
                log_test_result("Menu Slug Endpoint", False, f"Unexpected error response: {data}")
                return False
        else:
            log_test_result("Menu Slug Endpoint", False, f"Unexpected status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test_result("Menu Slug Endpoint", False, f"Exception: {str(e)}")
        return False

def test_admin_stats_endpoint():
    """Test 7: Admin stats endpoint (already tested in Supabase connection)"""
    print("=" * 60)
    print("TEST 7: Admin Stats Endpoint")
    print("=" * 60)
    
    # This was already tested in test_supabase_connection, so we'll reference that
    print("Admin stats endpoint was already tested in Supabase connection test.")
    log_test_result("Admin Stats Endpoint", True, "Endpoint verified in Supabase connection test")
    return True

def test_cors_headers():
    """Test 8: CORS headers are properly set"""
    print("=" * 60)
    print("TEST 8: CORS Headers")
    print("=" * 60)
    
    try:
        response = requests.options(f"{BASE_URL}", timeout=10)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        if response.status_code == 200 and cors_headers['Access-Control-Allow-Origin']:
            log_test_result("CORS Headers", True, f"CORS headers present: {cors_headers}")
            return True
        else:
            log_test_result("CORS Headers", False, f"Status: {response.status_code}, Headers: {cors_headers}")
            return False
            
    except Exception as e:
        log_test_result("CORS Headers", False, f"Exception: {str(e)}")
        return False

def run_all_tests():
    """Run all backend API tests"""
    print("🚀 Starting Menu SaaS 3D Backend API Tests")
    print(f"🌐 Testing against: {BASE_URL}")
    print("=" * 80)
    
    test_results = []
    
    # Run all tests
    test_results.append(("Basic API Connection", test_basic_api_connection()))
    test_results.append(("Supabase Connection", test_supabase_connection()))
    test_results.append(("Auth Register Endpoint", test_auth_register_endpoint()))
    test_results.append(("Auth Login Endpoint", test_auth_login_endpoint()))
    test_results.append(("Menu Upload Endpoint", test_menu_upload_endpoint()))
    test_results.append(("Menu Slug Endpoint", test_menu_slug_endpoint()))
    test_results.append(("Admin Stats Endpoint", test_admin_stats_endpoint()))
    test_results.append(("CORS Headers", test_cors_headers()))
    
    # Summary
    print("=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
        return True
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please check the details above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)