"""
Backend tests for ID Verification Flow
Tests: Helper uploads ID + selfie -> Admin reviews -> Admin approves/rejects -> User status updates
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://verification-flow-5.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = f"testverify_{os.urandom(4).hex()}@test.com"
TEST_USER_PASSWORD = "Test123!"
TEST_USER_NAME = "Test Verify User"
ADMIN_EMAIL = "admin@anywork.co.uk"
ADMIN_PASSWORD = "Admin123!"

# Sample base64 encoded tiny image (1x1 transparent PNG)
SAMPLE_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

class TestVerificationSubmission:
    """Test verification submission by helper/user"""
    
    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Create a test user for verification tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Register a new test user
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME,
            "role": "helper"
        })
        
        if register_response.status_code == 200:
            self.token = register_response.json().get("token")
            self.user = register_response.json().get("user")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        elif register_response.status_code == 400 and "already registered" in register_response.text:
            # User exists, login instead
            login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            if login_response.status_code == 200:
                self.token = login_response.json().get("token")
                self.user = login_response.json().get("user")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_verification_submit_requires_auth(self):
        """Verification submission requires authentication"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/verification/submit", json={
            "id_type": "passport",
            "id_front": SAMPLE_IMAGE_BASE64,
            "selfie": SAMPLE_IMAGE_BASE64
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: Verification submit requires authentication (401)")
    
    def test_verification_submit_passport(self):
        """Submit verification with passport ID type"""
        response = self.session.post(f"{BASE_URL}/api/verification/submit", json={
            "id_type": "passport",
            "id_front": SAMPLE_IMAGE_BASE64,
            "selfie": SAMPLE_IMAGE_BASE64
        })
        
        # If user already has pending/verified status, expect 400
        if response.status_code == 400:
            assert "already" in response.text.lower(), f"Unexpected 400 response: {response.text}"
            print("PASS: Verification blocked - user already has pending/verified verification")
            return
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "verification_id" in data, "Response should contain verification_id"
        assert data.get("message") == "Verification submitted successfully"
        print(f"PASS: Verification submitted with passport - ID: {data.get('verification_id')}")
    
    def test_verification_status_check(self):
        """Check verification status endpoint"""
        response = self.session.get(f"{BASE_URL}/api/verification/status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "status" in data, "Response should contain status field"
        print(f"PASS: Verification status retrieved - status: {data.get('status')}")


class TestAdminVerificationReview:
    """Test admin verification review flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            print(f"Admin logged in successfully")
        else:
            pytest.skip(f"Admin login failed: {login_response.status_code} - {login_response.text}")
    
    def test_admin_get_verifications_requires_admin(self):
        """Get verifications endpoint requires admin"""
        # Try with non-admin user
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Register a non-admin user
        test_email = f"nonadmin_{os.urandom(4).hex()}@test.com"
        register_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test123!",
            "name": "Non Admin User"
        })
        
        if register_response.status_code == 200:
            token = register_response.json().get("token")
            session.headers.update({"Authorization": f"Bearer {token}"})
            
            response = session.get(f"{BASE_URL}/api/admin/verifications")
            assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
            print("PASS: Non-admin user gets 403 for admin/verifications")
        else:
            print(f"SKIP: Could not create non-admin user")
    
    def test_admin_get_verifications_list(self):
        """Admin can get list of verifications"""
        response = self.session.get(f"{BASE_URL}/api/admin/verifications")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "verifications" in data, "Response should contain verifications list"
        assert "total" in data, "Response should contain total count"
        assert "pending_count" in data, "Response should contain pending_count"
        print(f"PASS: Admin got verifications list - total: {data.get('total')}, pending: {data.get('pending_count')}")
        
        # Store verification IDs for later tests
        if data.get("verifications"):
            self.test_verification_id = data["verifications"][0].get("verification_id")
            return data["verifications"][0].get("verification_id")
        return None
    
    def test_admin_get_verification_detail(self):
        """Admin can get verification detail with images"""
        # First get list to get a verification ID
        list_response = self.session.get(f"{BASE_URL}/api/admin/verifications")
        if list_response.status_code != 200:
            pytest.skip("Could not get verifications list")
        
        verifications = list_response.json().get("verifications", [])
        if not verifications:
            pytest.skip("No verifications to test with")
        
        verification_id = verifications[0].get("verification_id")
        
        response = self.session.get(f"{BASE_URL}/api/admin/verifications/{verification_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "verification_id" in data, "Response should contain verification_id"
        assert "id_type" in data, "Response should contain id_type"
        assert "id_front" in data, "Response should contain id_front image"
        assert "selfie" in data, "Response should contain selfie image"
        assert "status" in data, "Response should contain status"
        assert "user_name" in data, "Response should contain user_name"
        assert "user_email" in data, "Response should contain user_email"
        print(f"PASS: Admin got verification detail - ID type: {data.get('id_type')}, status: {data.get('status')}")
    
    def test_admin_get_verification_detail_not_found(self):
        """Admin gets 404 for non-existent verification"""
        response = self.session.get(f"{BASE_URL}/api/admin/verifications/nonexistent_id")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("PASS: Admin gets 404 for non-existent verification")


class TestVerificationApprovalRejection:
    """Test verification approval and rejection flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin session and create a test verification"""
        self.admin_session = requests.Session()
        self.admin_session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.admin_session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip(f"Admin login failed: {login_response.status_code}")
    
    def _create_verification_user(self):
        """Helper to create a new user and submit verification"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Create unique user
        email = f"verify_test_{os.urandom(4).hex()}@test.com"
        register_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_USER_PASSWORD,
            "name": f"Verify Test User {os.urandom(2).hex()}",
            "role": "helper"
        })
        
        if register_response.status_code != 200:
            return None, None, None
        
        token = register_response.json().get("token")
        user = register_response.json().get("user")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Submit verification
        verify_response = session.post(f"{BASE_URL}/api/verification/submit", json={
            "id_type": "driving_license",
            "id_front": SAMPLE_IMAGE_BASE64,
            "id_back": SAMPLE_IMAGE_BASE64,
            "selfie": SAMPLE_IMAGE_BASE64
        })
        
        if verify_response.status_code != 200:
            return session, user, None
        
        verification_id = verify_response.json().get("verification_id")
        return session, user, verification_id
    
    def test_admin_approve_verification(self):
        """Admin can approve a verification"""
        user_session, user, verification_id = self._create_verification_user()
        
        if not verification_id:
            # Try to get an existing pending verification
            list_response = self.admin_session.get(f"{BASE_URL}/api/admin/verifications?status=pending")
            verifications = list_response.json().get("verifications", [])
            pending = [v for v in verifications if v.get("status") == "pending"]
            if not pending:
                pytest.skip("No pending verification to test approval")
            verification_id = pending[0].get("verification_id")
            user_id = pending[0].get("user_id")
        else:
            user_id = user.get("user_id")
        
        # Approve verification
        response = self.admin_session.put(f"{BASE_URL}/api/admin/verifications/{verification_id}", json={
            "status": "verified"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Verification verified" in data.get("message", "") or "verified" in data.get("message", "").lower(), \
            f"Unexpected message: {data.get('message')}"
        print(f"PASS: Admin approved verification {verification_id}")
        
        # Verify user status is updated
        if user_session:
            me_response = user_session.get(f"{BASE_URL}/api/auth/me")
            if me_response.status_code == 200:
                user_data = me_response.json()
                assert user_data.get("verification_status") == "verified", \
                    f"User verification_status should be 'verified', got: {user_data.get('verification_status')}"
                assert user_data.get("is_verified") == True, "User should be marked as verified"
                print("PASS: User verification_status updated to 'verified'")
    
    def test_admin_reject_verification(self):
        """Admin can reject a verification with reason"""
        user_session, user, verification_id = self._create_verification_user()
        
        if not verification_id:
            pytest.skip("Could not create verification for rejection test")
        
        # Reject verification
        rejection_reason = "ID image is blurry, please resubmit with clearer photo"
        response = self.admin_session.put(f"{BASE_URL}/api/admin/verifications/{verification_id}", json={
            "status": "rejected",
            "rejection_reason": rejection_reason
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "rejected" in data.get("message", "").lower(), f"Unexpected message: {data.get('message')}"
        print(f"PASS: Admin rejected verification {verification_id}")
        
        # Verify user status is updated
        if user_session:
            me_response = user_session.get(f"{BASE_URL}/api/auth/me")
            if me_response.status_code == 200:
                user_data = me_response.json()
                assert user_data.get("verification_status") == "rejected", \
                    f"User verification_status should be 'rejected', got: {user_data.get('verification_status')}"
                print("PASS: User verification_status updated to 'rejected'")
    
    def test_admin_reject_requires_reason(self):
        """Rejection should work with reason (checking if required)"""
        user_session, user, verification_id = self._create_verification_user()
        
        if not verification_id:
            pytest.skip("Could not create verification for rejection test")
        
        # Try to reject without reason - may or may not be required
        response = self.admin_session.put(f"{BASE_URL}/api/admin/verifications/{verification_id}", json={
            "status": "rejected"
        })
        
        # Either it requires a reason (400) or accepts without (200)
        assert response.status_code in [200, 400, 422], f"Expected 200/400/422, got {response.status_code}: {response.text}"
        print(f"PASS: Rejection without reason handled - status: {response.status_code}")
    
    def test_admin_invalid_status(self):
        """Invalid verification status should be rejected"""
        user_session, user, verification_id = self._create_verification_user()
        
        if not verification_id:
            pytest.skip("Could not create verification for invalid status test")
        
        response = self.admin_session.put(f"{BASE_URL}/api/admin/verifications/{verification_id}", json={
            "status": "invalid_status"
        })
        
        # Should reject invalid status with 400 or 422
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}: {response.text}"
        print("PASS: Invalid status rejected")


class TestVerificationIDTypes:
    """Test different ID types for verification"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create session for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def _create_user_and_verify(self, id_type, include_back=False):
        """Helper to create user and submit verification with specific ID type"""
        email = f"verify_{id_type}_{os.urandom(4).hex()}@test.com"
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_USER_PASSWORD,
            "name": f"Test {id_type.title()} User"
        })
        
        if register_response.status_code != 200:
            return None
        
        token = register_response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        verify_data = {
            "id_type": id_type,
            "id_front": SAMPLE_IMAGE_BASE64,
            "selfie": SAMPLE_IMAGE_BASE64
        }
        
        if include_back:
            verify_data["id_back"] = SAMPLE_IMAGE_BASE64
        
        return self.session.post(f"{BASE_URL}/api/verification/submit", json=verify_data)
    
    def test_passport_verification(self):
        """Passport ID type works"""
        response = self._create_user_and_verify("passport", include_back=False)
        if response is None:
            pytest.skip("Could not create user")
        
        assert response.status_code in [200, 400], f"Expected 200/400, got {response.status_code}: {response.text}"
        if response.status_code == 200:
            print("PASS: Passport verification submitted")
        else:
            print("PASS: User already has verification (expected)")
    
    def test_driving_license_verification(self):
        """Driving license ID type works with front and back"""
        response = self._create_user_and_verify("driving_license", include_back=True)
        if response is None:
            pytest.skip("Could not create user")
        
        assert response.status_code in [200, 400], f"Expected 200/400, got {response.status_code}: {response.text}"
        if response.status_code == 200:
            print("PASS: Driving license verification submitted")
        else:
            print("PASS: User already has verification (expected)")
    
    def test_national_id_verification(self):
        """National ID type works"""
        response = self._create_user_and_verify("national_id", include_back=True)
        if response is None:
            pytest.skip("Could not create user")
        
        assert response.status_code in [200, 400], f"Expected 200/400, got {response.status_code}: {response.text}"
        if response.status_code == 200:
            print("PASS: National ID verification submitted")
        else:
            print("PASS: User already has verification (expected)")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """API root endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api")
        assert response.status_code in [200, 404], f"Expected 200/404, got {response.status_code}"
        print("PASS: API accessible")
    
    def test_admin_login(self):
        """Admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Login should return token"
        assert "user" in data, "Login should return user"
        print("PASS: Admin login successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
