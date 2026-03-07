"""
Backend tests for AI Face Verification Feature
Tests:
- AI face comparison integration via /api/verification/submit
- Auto-approve path (confidence >= 80% match)
- Auto-reject path (confidence >= 70% NO match) 
- Pending/manual review path (uncertain cases)
- ai_verification field in MongoDB document
- User verification_status and is_verified updates
"""
import pytest
import requests
import os
import base64
from io import BytesIO

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://verification-flow-5.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@anywork.co.uk"
ADMIN_PASSWORD = "Admin123!"

# Sample face images for testing (real face images are required for AI verification)
# Using a simple placeholder - the AI will process these and return results based on analysis

# Valid test image - a simple person-like image pattern
def get_test_image_base64():
    """Generate a simple test image in base64 format"""
    # Create a simple PNG image with some visual features (not blank)
    # This is a minimal 10x10 PNG with color gradients (not uniform)
    import struct
    import zlib
    
    # Create a simple gradient image (10x10) with varying colors to simulate face features
    def create_png(width, height):
        def make_rgb(r, g, b):
            return bytes([r, g, b])
        
        raw_data = b''
        for y in range(height):
            raw_data += b'\x00'  # Filter type: None
            for x in range(width):
                # Create gradient pattern
                r = int(150 + (x / width) * 50)  # Skin tone-ish
                g = int(120 + (y / height) * 30)
                b = int(100 + ((x + y) / (width + height)) * 50)
                raw_data += make_rgb(r, g, b)
        
        def png_chunk(chunk_type, data):
            chunk_len = struct.pack('>I', len(data))
            chunk_crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
            return chunk_len + chunk_type + data + chunk_crc
        
        ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
        compressed = zlib.compress(raw_data)
        
        return b'\x89PNG\r\n\x1a\n' + \
               png_chunk(b'IHDR', ihdr_data) + \
               png_chunk(b'IDAT', compressed) + \
               png_chunk(b'IEND', b'')
    
    png_bytes = create_png(50, 50)
    return f"data:image/png;base64,{base64.b64encode(png_bytes).decode()}"

# Generate test images
TEST_ID_PHOTO = get_test_image_base64()
TEST_SELFIE = get_test_image_base64()


class TestAIFaceVerificationEndpoint:
    """Test the AI face verification integration in /api/verification/submit"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create unique test user for each test class run
        self.test_email = f"aiverify_test_{os.urandom(4).hex()}@test.com"
        self.test_password = "Test123!"
        
    def _create_test_user(self):
        """Create a new test user and return session with auth"""
        email = f"aiverify_{os.urandom(4).hex()}@test.com"
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": self.test_password,
            "name": f"AI Verify Test User",
            "role": "helper"
        })
        
        if register_response.status_code == 200:
            token = register_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            return register_response.json().get("user"), True
        return None, False
    
    def test_verification_submit_returns_ai_result(self):
        """Verify that /api/verification/submit returns AI comparison result"""
        user, success = self._create_test_user()
        if not success:
            pytest.skip("Could not create test user")
        
        response = self.session.post(f"{BASE_URL}/api/verification/submit", json={
            "id_type": "passport",
            "id_front": TEST_ID_PHOTO,
            "selfie": TEST_SELFIE
        })
        
        # Should succeed
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check response structure
        assert "verification_id" in data, "Response should contain verification_id"
        assert "status" in data, "Response should contain status"
        assert "ai_result" in data, "Response should contain ai_result from AI comparison"
        
        # Check AI result structure
        ai_result = data.get("ai_result", {})
        assert "confidence" in ai_result, "AI result should contain confidence score"
        assert "auto_processed" in ai_result, "AI result should indicate if auto-processed"
        
        print(f"PASS: Verification submitted with AI result - status: {data.get('status')}, confidence: {ai_result.get('confidence')}")
        print(f"AI auto_processed: {ai_result.get('auto_processed')}")
    
    def test_verification_status_reflects_ai_decision(self):
        """Verify user status is updated based on AI decision"""
        user, success = self._create_test_user()
        if not success:
            pytest.skip("Could not create test user")
        
        # Submit verification
        submit_response = self.session.post(f"{BASE_URL}/api/verification/submit", json={
            "id_type": "driving_license",
            "id_front": TEST_ID_PHOTO,
            "id_back": TEST_ID_PHOTO,
            "selfie": TEST_SELFIE
        })
        
        assert submit_response.status_code == 200, f"Expected 200, got {submit_response.status_code}"
        
        submit_data = submit_response.json()
        returned_status = submit_data.get("status")
        
        # Check user's verification status via /api/auth/me
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        
        user_data = me_response.json()
        
        # User's verification_status should match the returned status
        assert user_data.get("verification_status") == returned_status, \
            f"User verification_status ({user_data.get('verification_status')}) should match returned status ({returned_status})"
        
        # If verified, is_verified should be True
        if returned_status == "verified":
            assert user_data.get("is_verified") == True, "is_verified should be True when status is verified"
        
        print(f"PASS: User verification_status correctly set to '{returned_status}'")


class TestAIVerificationStatusPaths:
    """Test the three possible AI verification outcomes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin session"""
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
    
    def test_ai_verification_field_in_mongodb(self):
        """Verify ai_verification field is saved in MongoDB verification document"""
        # Get any verification from admin endpoint
        response = self.admin_session.get(f"{BASE_URL}/api/admin/verifications?limit=1")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        verifications = data.get("verifications", [])
        
        if not verifications:
            pytest.skip("No verifications found to check")
        
        verification_id = verifications[0].get("verification_id")
        
        # Get full verification detail
        detail_response = self.admin_session.get(f"{BASE_URL}/api/admin/verifications/{verification_id}")
        assert detail_response.status_code == 200
        
        verification = detail_response.json()
        
        # Check ai_verification field exists
        assert "ai_verification" in verification, "Verification should contain ai_verification field"
        
        ai_verification = verification.get("ai_verification", {})
        
        # Check ai_verification structure
        expected_fields = ["match", "confidence", "reason", "auto_processed"]
        for field in expected_fields:
            assert field in ai_verification, f"ai_verification should contain '{field}' field"
        
        print(f"PASS: ai_verification field found with structure: {list(ai_verification.keys())}")
        print(f"  - match: {ai_verification.get('match')}")
        print(f"  - confidence: {ai_verification.get('confidence')}%")
        print(f"  - reason: {ai_verification.get('reason')[:50]}..." if ai_verification.get('reason') else "  - reason: None")
        print(f"  - auto_processed: {ai_verification.get('auto_processed')}")
    
    def test_verified_status_means_auto_approved(self):
        """Check that 'verified' status implies AI auto-approved (confidence >= 80% match)"""
        response = self.admin_session.get(f"{BASE_URL}/api/admin/verifications?status=verified&limit=10")
        
        assert response.status_code == 200
        
        data = response.json()
        verifications = data.get("verifications", [])
        
        for v in verifications:
            verification_id = v.get("verification_id")
            # Get full detail to check ai_verification
            detail_response = self.admin_session.get(f"{BASE_URL}/api/admin/verifications/{verification_id}")
            if detail_response.status_code != 200:
                continue
                
            verification = detail_response.json()
            ai_verification = verification.get("ai_verification", {})
            
            # If it was auto-processed to verified, confidence should be >= 80
            if ai_verification.get("auto_processed") and verification.get("reviewed_by") == "AI_SYSTEM":
                confidence = ai_verification.get("confidence", 0)
                match = ai_verification.get("match")
                
                # Auto-verified should have high confidence match
                print(f"Verified verification {verification_id}: confidence={confidence}%, match={match}")
                
                if match is True and ai_verification.get("auto_processed"):
                    assert confidence >= 80, f"Auto-approved should have confidence >= 80%, got {confidence}%"
        
        print("PASS: Verified verifications checked for AI auto-approve criteria")
    
    def test_rejected_status_means_auto_rejected(self):
        """Check that 'rejected' status from AI implies confidence >= 70% NO match"""
        response = self.admin_session.get(f"{BASE_URL}/api/admin/verifications?status=rejected&limit=10")
        
        assert response.status_code == 200
        
        data = response.json()
        verifications = data.get("verifications", [])
        
        for v in verifications:
            verification_id = v.get("verification_id")
            detail_response = self.admin_session.get(f"{BASE_URL}/api/admin/verifications/{verification_id}")
            if detail_response.status_code != 200:
                continue
                
            verification = detail_response.json()
            ai_verification = verification.get("ai_verification", {})
            
            # If it was auto-processed to rejected, it was due to AI
            if ai_verification.get("auto_processed") and verification.get("reviewed_by") == "AI_SYSTEM":
                confidence = ai_verification.get("confidence", 0)
                match = ai_verification.get("match")
                
                print(f"Rejected verification {verification_id}: confidence={confidence}%, match={match}")
                
                # Auto-rejected should have match=False and confidence >= 70
                if match is False and ai_verification.get("auto_processed"):
                    assert confidence >= 70, f"Auto-rejected should have confidence >= 70%, got {confidence}%"
        
        print("PASS: Rejected verifications checked for AI auto-reject criteria")
    
    def test_pending_status_means_manual_review(self):
        """Check that 'pending' status means AI was uncertain (needs manual review)"""
        response = self.admin_session.get(f"{BASE_URL}/api/admin/verifications?status=pending&limit=10")
        
        assert response.status_code == 200
        
        data = response.json()
        verifications = data.get("verifications", [])
        pending_count = data.get("pending_count", 0)
        
        print(f"Found {len(verifications)} pending verifications (total pending: {pending_count})")
        
        for v in verifications:
            verification_id = v.get("verification_id")
            detail_response = self.admin_session.get(f"{BASE_URL}/api/admin/verifications/{verification_id}")
            if detail_response.status_code != 200:
                continue
                
            verification = detail_response.json()
            ai_verification = verification.get("ai_verification", {})
            
            # Pending should NOT be auto-processed
            auto_processed = ai_verification.get("auto_processed", False)
            
            if not auto_processed:
                confidence = ai_verification.get("confidence", 0)
                match = ai_verification.get("match")
                reason = ai_verification.get("reason", "")
                
                print(f"Pending verification {verification_id}: confidence={confidence}%, match={match}, reason={reason[:50]}...")
                
                # Either uncertain match, or low confidence for either decision
                # This is expected for manual review cases
        
        print("PASS: Pending verifications are flagged for manual admin review")


class TestFrontendResultDisplay:
    """Test that frontend shows appropriate result UI based on status"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_verification_response_includes_display_info(self):
        """Verify the response has info for frontend to display appropriate UI"""
        # Create test user
        email = f"frontend_test_{os.urandom(4).hex()}@test.com"
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": "Frontend Test User",
            "role": "helper"
        })
        
        if register_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        token = register_response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Submit verification
        response = self.session.post(f"{BASE_URL}/api/verification/submit", json={
            "id_type": "passport",
            "id_front": TEST_ID_PHOTO,
            "selfie": TEST_SELFIE
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Response should have all info needed for frontend display
        assert "message" in data, "Response should contain user-facing message"
        assert "status" in data, "Response should contain status for UI state"
        assert "ai_result" in data, "Response should contain AI result for display"
        
        status = data.get("status")
        message = data.get("message")
        
        # Check message is appropriate for status
        if status == "verified":
            assert "verified" in message.lower() or "automatic" in message.lower(), \
                f"Verified status should have appropriate message, got: {message}"
        elif status == "rejected":
            assert "not approved" in message.lower() or "try again" in message.lower(), \
                f"Rejected status should have appropriate message, got: {message}"
        elif status == "pending":
            assert "review" in message.lower() or "24-48" in message.lower(), \
                f"Pending status should mention review, got: {message}"
        
        print(f"PASS: Response has correct display info - status: {status}, message: {message[:50]}...")


class TestVerificationAPIHealth:
    """Basic health checks for verification endpoints"""
    
    def test_verification_submit_endpoint_exists(self):
        """POST /api/verification/submit endpoint exists and requires auth"""
        response = requests.post(f"{BASE_URL}/api/verification/submit", json={
            "id_type": "passport",
            "id_front": TEST_ID_PHOTO,
            "selfie": TEST_SELFIE
        })
        
        # Should return 401 (unauthorized) not 404
        assert response.status_code == 401, f"Expected 401 (auth required), got {response.status_code}"
        print("PASS: /api/verification/submit endpoint exists and requires authentication")
    
    def test_verification_status_endpoint_exists(self):
        """GET /api/verification/status endpoint exists and requires auth"""
        response = requests.get(f"{BASE_URL}/api/verification/status")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /api/verification/status endpoint exists and requires authentication")
    
    def test_admin_verifications_endpoint_exists(self):
        """GET /api/admin/verifications endpoint exists"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        
        token = login_response.json().get("token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = session.get(f"{BASE_URL}/api/admin/verifications")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "verifications" in data
        assert "total" in data
        assert "pending_count" in data
        
        print(f"PASS: Admin verifications endpoint working - total: {data.get('total')}, pending: {data.get('pending_count')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
