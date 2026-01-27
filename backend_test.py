#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class AnyWorkAPITester:
    def __init__(self, base_url: str = "https://helpconnect-18.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        
    def log(self, message: str):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })

            try:
                return success, response.json() if response.text else {}
            except:
                return success, {'raw_response': response.text}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "api/", 200)

    def test_categories(self):
        """Test categories endpoint"""
        return self.run_test("Get Categories", "GET", "api/categories", 200)

    def test_seed_data(self):
        """Test seeding sample data"""
        return self.run_test("Seed Sample Data", "POST", "api/seed-data", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "phone": "07123456789",
            "role": "customer"
        }
        
        success, response = self.run_test("User Registration", "POST", "api/auth/register", 200, test_user)
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('user_id')
            self.log(f"   Registered user: {self.user_id}")
        return success, response

    def test_user_login(self):
        """Test user login with registered credentials"""
        if not hasattr(self, '_test_email'):
            return False, {}
            
        login_data = {
            "email": self._test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Login", "POST", "api/auth/login", 200, login_data)
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('user_id')
        return success, response

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            return False, {}
        return self.run_test("Get Current User", "GET", "api/auth/me", 200)

    def test_get_helpers(self):
        """Test getting helpers list"""
        return self.run_test("Get Helpers", "GET", "api/helpers", 200)

    def test_get_helpers_with_filters(self):
        """Test getting helpers with filters"""
        return self.run_test("Get Helpers (Filtered)", "GET", "api/helpers?category=cleaning&verified_only=true", 200)

    def test_create_helper_profile(self):
        """Test creating a helper profile"""
        if not self.token:
            return False, {}
            
        helper_data = {
            "bio": "Test helper profile for automated testing",
            "categories": ["cleaning", "home-help"],
            "hourly_rate": 20.0,
            "fixed_rate": 60.0,
            "postcode": "SW1A 1AA",
            "availability": {
                "monday": ["09:00-17:00"],
                "tuesday": ["09:00-17:00"]
            },
            "verified_id": False,
            "insured": False
        }
        
        return self.run_test("Create Helper Profile", "POST", "api/helpers/profile", 200, helper_data)

    def test_get_helper_profile(self):
        """Test getting helper profile"""
        if not self.token:
            return False, {}
        return self.run_test("Get My Helper Profile", "GET", "api/helpers/me/profile", 200)

    def test_create_job(self):
        """Test creating a job"""
        if not self.token:
            return False, {}
            
        job_data = {
            "title": "Test cleaning job",
            "description": "Automated test job for API testing",
            "category": "cleaning",
            "location_type": "home",
            "postcode": "SW1A 1AA",
            "address": "Test Address, London",
            "date_needed": "2024-12-31",
            "time_needed": "10:00",
            "duration_hours": 3.0,
            "budget_type": "hourly",
            "budget_amount": 15.0,
            "photos": []
        }
        
        success, response = self.run_test("Create Job", "POST", "api/jobs", 200, job_data)
        if success and 'job_id' in response:
            self.job_id = response['job_id']
        return success, response

    def test_get_jobs(self):
        """Test getting jobs list"""
        return self.run_test("Get Jobs", "GET", "api/jobs", 200)

    def test_get_my_jobs(self):
        """Test getting user's jobs"""
        if not self.token:
            return False, {}
        return self.run_test("Get My Jobs", "GET", "api/jobs/user/my-jobs", 200)

    def test_create_booking(self):
        """Test creating a booking"""
        if not self.token:
            return False, {}
            
        # First get a helper to book
        success, helpers_response = self.run_test("Get Helpers for Booking", "GET", "api/helpers?limit=1", 200)
        if not success or not helpers_response.get('helpers'):
            return False, {}
            
        helper = helpers_response['helpers'][0]
        
        booking_data = {
            "helper_id": helper['helper_id'],
            "service_type": "cleaning",
            "date": "2024-12-31",
            "time": "10:00",
            "duration_hours": 2.0,
            "total_amount": 30.0,
            "platform_fee": 3.0,
            "notes": "Test booking"
        }
        
        success, response = self.run_test("Create Booking", "POST", "api/bookings", 200, booking_data)
        if success and 'booking_id' in response:
            self.booking_id = response['booking_id']
        return success, response

    def test_get_bookings(self):
        """Test getting bookings"""
        if not self.token:
            return False, {}
        return self.run_test("Get Bookings", "GET", "api/bookings", 200)

    def test_conversations(self):
        """Test conversations endpoint"""
        if not self.token:
            return False, {}
        return self.run_test("Get Conversations", "GET", "api/conversations", 200)

    def test_logout(self):
        """Test user logout"""
        if not self.token:
            return False, {}
        return self.run_test("User Logout", "POST", "api/auth/logout", 200)

    def run_all_tests(self):
        """Run all API tests"""
        self.log("🚀 Starting AnyWork API Tests")
        self.log("=" * 50)
        
        # Basic API tests
        self.test_root_endpoint()
        self.test_categories()
        self.test_seed_data()
        
        # Authentication tests
        reg_success, reg_response = self.test_user_registration()
        if reg_success:
            self._test_email = reg_response.get('user', {}).get('email')
        
        self.test_get_current_user()
        
        # Helper tests
        self.test_get_helpers()
        self.test_get_helpers_with_filters()
        self.test_create_helper_profile()
        self.test_get_helper_profile()
        
        # Job tests
        self.test_create_job()
        self.test_get_jobs()
        self.test_get_my_jobs()
        
        # Booking tests
        self.test_create_booking()
        self.test_get_bookings()
        
        # Message tests
        self.test_conversations()
        
        # Cleanup
        self.test_logout()
        
        # Print results
        self.log("=" * 50)
        self.log(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            self.log("\n❌ Failed tests:")
            for failure in self.failed_tests:
                self.log(f"   - {failure.get('test', 'Unknown')}: {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AnyWorkAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())