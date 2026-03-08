"""
Admin Panel API Tests
Tests admin dashboard, user management, job management, bookings, verifications, and reports endpoints.
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "nabeel.ucp@gmail.com"
ADMIN_PASSWORD = "sana7860"

# Alternative admin
ALT_ADMIN_EMAIL = "admin@anywork.co.uk"
ALT_ADMIN_PASSWORD = "Admin123!"

class TestAdminAuthentication:
    """Test admin login and access control"""
    
    def test_admin_login_nabeel(self):
        """Test login with nabeel.ucp@gmail.com / sana7860"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        print(f"Admin login response: {response.status_code} - {response.text[:200]}")
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        return data["token"]
    
    def test_admin_login_alt(self):
        """Test login with admin@anywork.co.uk / Admin123!"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ALT_ADMIN_EMAIL,
            "password": ALT_ADMIN_PASSWORD
        })
        print(f"Alt admin login response: {response.status_code} - {response.text[:200]}")
        assert response.status_code == 200, f"Alt admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        return data["token"]

    def test_non_admin_cannot_access_admin_endpoints(self):
        """Test that non-admin users get 403 on admin endpoints"""
        # Create a regular user
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_regular_user_{unique_id}@test.com"
        
        # Register
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Password123!",
            "name": "Regular User",
            "role": "customer"
        })
        if reg_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        token = reg_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access admin dashboard stats
        response = requests.get(f"{BASE_URL}/api/admin/dashboard/stats", headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("Non-admin correctly blocked from admin endpoints")


class TestAdminDashboardStats:
    """Test admin dashboard statistics endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_stats_endpoint(self):
        """Test GET /api/admin/dashboard/stats returns expected fields"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard/stats", headers=self.headers)
        print(f"Dashboard stats response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        print(f"Dashboard stats data: {data}")
        
        # Verify all expected stats fields
        expected_fields = [
            "total_users", "total_jobs", "total_bookings", 
            "active_jobs", "completed_jobs", "in_progress_jobs",
            "total_helpers", "verified_users", "pending_verifications",
            "pending_reports", "users_today", "jobs_today"
        ]
        
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
            assert isinstance(data[field], int), f"{field} should be int, got {type(data[field])}"
        
        print(f"Stats: Users={data['total_users']}, Jobs={data['total_jobs']}, Helpers={data['total_helpers']}")
    
    def test_dashboard_activity_endpoint(self):
        """Test GET /api/admin/dashboard/activity returns activity feed"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard/activity", headers=self.headers, params={"limit": 15})
        print(f"Activity response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "activities" in data, "Missing activities key"
        
        # Verify activity structure if there are activities
        if data["activities"]:
            activity = data["activities"][0]
            assert "type" in activity, "Activity missing type"
            assert "message" in activity, "Activity missing message"
            assert "timestamp" in activity, "Activity missing timestamp"
        
        print(f"Found {len(data['activities'])} activities")
    
    def test_dashboard_charts_endpoint(self):
        """Test GET /api/admin/dashboard/charts returns chart data"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard/charts", headers=self.headers, params={"days": 7})
        print(f"Charts response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "chart_data" in data, "Missing chart_data key"
        
        # Verify chart data structure
        if data["chart_data"]:
            day_data = data["chart_data"][0]
            assert "day" in day_data, "Missing day field"
            assert "users" in day_data, "Missing users field"
            assert "jobs" in day_data, "Missing jobs field"
        
        print(f"Chart data: {len(data['chart_data'])} days")


class TestAdminUserManagement:
    """Test admin user management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_users_list(self):
        """Test GET /api/admin/users returns user list"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        print(f"Users list response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "users" in data, "Missing users key"
        assert "total" in data, "Missing total key"
        
        if data["users"]:
            user = data["users"][0]
            assert "user_id" in user, "User missing user_id"
            assert "email" in user, "User missing email"
            assert "name" in user, "User missing name"
        
        print(f"Found {data['total']} users")
    
    def test_get_users_with_search_filter(self):
        """Test user search functionality"""
        # Search for admin
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers, params={"search": "admin"})
        assert response.status_code == 200
        print(f"Search results: {response.json()['total']} users")
    
    def test_get_users_with_role_filter(self):
        """Test user role filter (helper/customer)"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers, params={"role": "helper"})
        assert response.status_code == 200
        print(f"Helpers found: {response.json()['total']}")
    
    def test_get_users_with_status_filter(self):
        """Test user status filter (verified/suspended)"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers, params={"status": "verified"})
        assert response.status_code == 200
        print(f"Verified users: {response.json()['total']}")
    
    def test_get_user_detail(self):
        """Test GET /api/admin/users/{user_id} returns user details"""
        # First get a user
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers, params={"limit": 1})
        assert users_response.status_code == 200
        
        users = users_response.json()["users"]
        if not users:
            pytest.skip("No users available")
        
        user_id = users[0]["user_id"]
        response = requests.get(f"{BASE_URL}/api/admin/users/{user_id}", headers=self.headers)
        print(f"User detail response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "user" in data, "Missing user key"
        print(f"User detail: {data['user']['email']}")
    
    def test_suspend_and_activate_user(self):
        """Test suspending and activating a user"""
        # Create test user to suspend
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_suspend_user_{unique_id}@test.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Password123!",
            "name": "Test Suspend User",
            "role": "customer"
        })
        if reg_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        user_id = reg_response.json()["user"]["user_id"]
        
        # Suspend user
        suspend_response = requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}/status", 
            headers=self.headers,
            params={"action": "suspend", "reason": "Test suspension"}
        )
        print(f"Suspend response: {suspend_response.status_code} - {suspend_response.text[:200]}")
        assert suspend_response.status_code == 200, f"Suspend failed: {suspend_response.text}"
        
        # Verify suspended
        suspended_user = suspend_response.json()
        assert suspended_user.get("is_suspended") == True, "User not marked as suspended"
        
        # Activate user
        activate_response = requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}/status",
            headers=self.headers,
            params={"action": "activate"}
        )
        print(f"Activate response: {activate_response.status_code}")
        assert activate_response.status_code == 200, f"Activate failed: {activate_response.text}"
        
        activated_user = activate_response.json()
        assert activated_user.get("is_suspended") == False, "User still suspended"
        print("Suspend/activate test passed")


class TestAdminJobManagement:
    """Test admin job management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_jobs_list(self):
        """Test GET /api/admin/jobs returns job list"""
        response = requests.get(f"{BASE_URL}/api/admin/jobs", headers=self.headers)
        print(f"Jobs list response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "jobs" in data, "Missing jobs key"
        assert "total" in data, "Missing total key"
        
        if data["jobs"]:
            job = data["jobs"][0]
            assert "job_id" in job, "Job missing job_id"
            assert "title" in job, "Job missing title"
        
        print(f"Found {data['total']} jobs")
    
    def test_get_jobs_with_search(self):
        """Test job search functionality"""
        response = requests.get(f"{BASE_URL}/api/admin/jobs", headers=self.headers, params={"search": "clean"})
        assert response.status_code == 200
        print(f"Search results: {response.json()['total']} jobs")
    
    def test_get_jobs_with_status_filter(self):
        """Test job status filter (open/active/closed/removed)"""
        response = requests.get(f"{BASE_URL}/api/admin/jobs", headers=self.headers, params={"status": "open"})
        assert response.status_code == 200
        print(f"Open jobs: {response.json()['total']}")
    
    def test_get_job_detail(self):
        """Test GET /api/admin/jobs/{job_id} returns job details"""
        # First get a job
        jobs_response = requests.get(f"{BASE_URL}/api/admin/jobs", headers=self.headers, params={"limit": 1})
        assert jobs_response.status_code == 200
        
        jobs = jobs_response.json()["jobs"]
        if not jobs:
            pytest.skip("No jobs available")
        
        job_id = jobs[0]["job_id"]
        response = requests.get(f"{BASE_URL}/api/admin/jobs/{job_id}", headers=self.headers)
        print(f"Job detail response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "job" in data, "Missing job key"
        print(f"Job detail: {data['job']['title']}")
    
    def test_update_job_status_to_removed(self):
        """Test removing a job (admin action)"""
        # First need to create a job as a user
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_job_poster_{unique_id}@test.com"
        
        # Register user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Password123!",
            "name": "Test Job Poster",
            "role": "customer"
        })
        if reg_response.status_code != 200:
            pytest.skip("Could not create test user for job posting")
        
        user_token = reg_response.json()["token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Create a job
        job_response = requests.post(f"{BASE_URL}/api/jobs", headers=user_headers, json={
            "title": f"TEST Admin Remove Job {unique_id}",
            "description": "Test job to be removed by admin",
            "category": "cleaning",
            "location_type": "home",
            "postcode": "SW1A 1AA",
            "date_needed": "2026-01-15",
            "time_needed": "10:00",
            "duration_hours": 2,
            "budget_type": "fixed",
            "budget_amount": 50
        })
        
        if job_response.status_code != 200:
            pytest.skip("Could not create test job")
        
        job_id = job_response.json()["job_id"]
        
        # Admin removes the job
        remove_response = requests.put(
            f"{BASE_URL}/api/admin/jobs/{job_id}/status",
            headers=self.headers,
            params={"status": "removed", "reason": "Admin test removal"}
        )
        print(f"Remove job response: {remove_response.status_code} - {remove_response.text[:200]}")
        assert remove_response.status_code == 200, f"Remove failed: {remove_response.text}"
        
        # Verify job is removed
        updated_job = remove_response.json()
        assert updated_job.get("status") == "removed", "Job not marked as removed"
        print("Job removal test passed")


class TestAdminBookings:
    """Test admin bookings endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_bookings_list(self):
        """Test GET /api/admin/bookings returns booking list"""
        response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers)
        print(f"Bookings list response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "bookings" in data, "Missing bookings key"
        assert "total" in data, "Missing total key"
        
        print(f"Found {data['total']} bookings")
    
    def test_get_bookings_with_status_filter(self):
        """Test booking status filter"""
        for status in ['pending', 'confirmed', 'completed', 'cancelled']:
            response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers, params={"status": status})
            assert response.status_code == 200, f"Failed for status {status}"
            print(f"{status} bookings: {response.json()['total']}")


class TestAdminVerifications:
    """Test admin verifications endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_verifications_list(self):
        """Test GET /api/admin/verifications returns verification list"""
        response = requests.get(f"{BASE_URL}/api/admin/verifications", headers=self.headers)
        print(f"Verifications response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "verifications" in data, "Missing verifications key"
        
        if data["verifications"]:
            v = data["verifications"][0]
            assert "verification_id" in v, "Missing verification_id"
            assert "status" in v, "Missing status"
        
        print(f"Found {len(data['verifications'])} verifications")
    
    def test_get_verification_detail(self):
        """Test GET /api/admin/verifications/{id} returns verification details"""
        # First get a verification
        list_response = requests.get(f"{BASE_URL}/api/admin/verifications", headers=self.headers)
        assert list_response.status_code == 200
        
        verifications = list_response.json()["verifications"]
        if not verifications:
            pytest.skip("No verifications available")
        
        verification_id = verifications[0]["verification_id"]
        response = requests.get(f"{BASE_URL}/api/admin/verifications/{verification_id}", headers=self.headers)
        print(f"Verification detail response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "verification_id" in data, "Missing verification_id"
        print(f"Verification detail retrieved")


class TestAdminReports:
    """Test admin reports endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_reports_list(self):
        """Test GET /api/admin/reports returns reports list"""
        response = requests.get(f"{BASE_URL}/api/admin/reports", headers=self.headers)
        print(f"Reports response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "reports" in data, "Missing reports key"
        assert "total" in data, "Missing total key"
        
        print(f"Found {data['total']} reports")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
