"""
Test Suite for AnyWork UK Marketplace - New Features
Tests for: Map View Toggle, Report User, Review System, Real-time Chat
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_CUSTOMER_EMAIL = "testcustomer@test.com"
TEST_CUSTOMER_PASSWORD = "Test123!"
ADMIN_EMAIL = "admin@anywork.co.uk"
ADMIN_PASSWORD = "Admin123!"

class TestBasicConnectivity:
    """Basic API connectivity tests"""
    
    def test_api_root_accessible(self):
        """Test API root endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root accessible: {data['message']}")

class TestAuthentication:
    """Authentication flow tests"""
    
    def test_login_customer(self):
        """Test customer login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        # Customer may or may not exist - skip if not
        if response.status_code == 401:
            pytest.skip("Test customer does not exist - creating new user")
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Customer login successful: {data['user']['email']}")
        return data["token"]
    
    def test_register_new_user_for_testing(self):
        """Register a new test user if needed"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test123!",
            "name": "Test User",
            "role": "customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ New user registered: {test_email}")
        return data["token"], data["user"]["user_id"]


class TestReportUserFeature:
    """Tests for Report User functionality (POST /api/reports)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for testing"""
        # Try login first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        
        # Register new user if login fails
        test_email = f"test_reporter_{uuid.uuid4().hex[:6]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test123!",
            "name": "Test Reporter",
            "role": "customer"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_report_user_success(self, auth_token):
        """Test reporting a user successfully"""
        response = requests.post(
            f"{BASE_URL}/api/reports",
            json={
                "reported_user_id": "user_123",  # Some user ID
                "reason": "inappropriate",
                "details": "Test report - automated testing"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "report_id" in data
        assert data["reason"] == "inappropriate"
        assert data["status"] == "pending"
        print(f"✓ Report created successfully: {data['report_id']}")
    
    def test_report_user_without_auth_fails(self):
        """Test reporting without authentication returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/reports",
            json={
                "reported_user_id": "user_123",
                "reason": "fraud",
                "details": "Test"
            }
        )
        assert response.status_code == 401
        print("✓ Unauthenticated report correctly rejected (401)")
    
    def test_report_user_harassment_reason(self, auth_token):
        """Test report with harassment reason"""
        response = requests.post(
            f"{BASE_URL}/api/reports",
            json={
                "reported_user_id": "user_456",
                "reason": "harassment",
                "details": "Harassment test case"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["reason"] == "harassment"
        print("✓ Harassment report created")
    
    def test_report_user_minimal_data(self, auth_token):
        """Test report with only required fields (no details)"""
        response = requests.post(
            f"{BASE_URL}/api/reports",
            json={
                "reported_user_id": "user_789",
                "reason": "fake_profile"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["details"] is None  # Optional field
        print("✓ Report created with minimal data")


class TestReviewSystem:
    """Tests for Review/Rating System (POST /api/reviews, GET /api/reviews/helper/{helper_id})"""
    
    @pytest.fixture
    def auth_token_and_user(self):
        """Get auth token and user_id for testing"""
        test_email = f"test_reviewer_{uuid.uuid4().hex[:6]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "Test123!",
            "name": "Test Reviewer",
            "role": "customer"
        })
        assert response.status_code == 200
        data = response.json()
        return data["token"], data["user"]["user_id"]
    
    @pytest.fixture
    def helper_id(self):
        """Get a valid helper ID from the system"""
        response = requests.get(f"{BASE_URL}/api/helpers?limit=1")
        assert response.status_code == 200
        data = response.json()
        if data.get("helpers") and len(data["helpers"]) > 0:
            return data["helpers"][0]["helper_id"]
        pytest.skip("No helpers in system to test reviews")
    
    def test_create_review_success(self, auth_token_and_user, helper_id):
        """Test creating a review with valid data"""
        token, user_id = auth_token_and_user
        
        # First create a booking (required for review)
        booking_response = requests.post(
            f"{BASE_URL}/api/bookings",
            json={
                "helper_id": helper_id,
                "service_type": "cleaning",
                "date": "2025-02-01",
                "time": "10:00",
                "duration_hours": 2,
                "total_amount": 30.00,
                "platform_fee": 3.00,
                "notes": "Test booking for review"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert booking_response.status_code == 200
        booking_id = booking_response.json()["booking_id"]
        
        # Now create review
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json={
                "booking_id": booking_id,
                "helper_id": helper_id,
                "rating": 5,
                "comment": "Excellent service! Very professional and thorough."
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "review_id" in data
        assert data["rating"] == 5
        assert "Excellent" in data["comment"]
        print(f"✓ Review created: {data['review_id']} with rating {data['rating']}")
    
    def test_create_review_without_auth_fails(self, helper_id):
        """Test creating review without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json={
                "booking_id": "booking_test",
                "helper_id": helper_id,
                "rating": 4,
                "comment": "Good service"
            }
        )
        assert response.status_code == 401
        print("✓ Unauthenticated review correctly rejected (401)")
    
    def test_get_helper_reviews(self, helper_id):
        """Test fetching reviews for a helper"""
        response = requests.get(f"{BASE_URL}/api/reviews/helper/{helper_id}")
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        assert "total" in data
        print(f"✓ Got {data['total']} reviews for helper {helper_id}")


class TestHelpersList:
    """Tests for Browse Helpers functionality (used by Map View)"""
    
    def test_get_helpers_list(self):
        """Test fetching helpers list"""
        response = requests.get(f"{BASE_URL}/api/helpers")
        assert response.status_code == 200
        data = response.json()
        assert "helpers" in data
        assert "total" in data
        print(f"✓ Got {data['total']} helpers")
    
    def test_get_helpers_with_category_filter(self):
        """Test filtering helpers by category"""
        response = requests.get(f"{BASE_URL}/api/helpers?category=cleaning")
        assert response.status_code == 200
        data = response.json()
        assert "helpers" in data
        # Verify all returned helpers have cleaning category
        for helper in data["helpers"]:
            assert "cleaning" in helper.get("categories", []), f"Helper {helper['helper_id']} doesn't have cleaning category"
        print(f"✓ Category filter works: {len(data['helpers'])} cleaning helpers")
    
    def test_get_helpers_with_postcode_filter(self):
        """Test filtering helpers by postcode"""
        response = requests.get(f"{BASE_URL}/api/helpers?postcode=SW1")
        assert response.status_code == 200
        data = response.json()
        assert "helpers" in data
        print(f"✓ Postcode filter works: {len(data['helpers'])} helpers in SW1 area")
    
    def test_get_helper_profile(self):
        """Test getting individual helper profile"""
        # First get a helper ID
        list_response = requests.get(f"{BASE_URL}/api/helpers?limit=1")
        assert list_response.status_code == 200
        helpers = list_response.json().get("helpers", [])
        
        if not helpers:
            pytest.skip("No helpers to test")
        
        helper_id = helpers[0]["helper_id"]
        
        # Get individual profile
        response = requests.get(f"{BASE_URL}/api/helpers/{helper_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["helper_id"] == helper_id
        assert "bio" in data
        assert "categories" in data
        assert "hourly_rate" in data
        print(f"✓ Helper profile retrieved: {data.get('user_name', helper_id)}")


class TestMessagingSystem:
    """Tests for Real-time Chat / Messaging System"""
    
    @pytest.fixture
    def two_users(self):
        """Create two users for messaging test"""
        # User 1
        user1_email = f"chat_user1_{uuid.uuid4().hex[:6]}@test.com"
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": user1_email,
            "password": "Test123!",
            "name": "Chat User 1"
        })
        assert response1.status_code == 200
        user1 = response1.json()
        
        # User 2
        user2_email = f"chat_user2_{uuid.uuid4().hex[:6]}@test.com"
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": user2_email,
            "password": "Test123!",
            "name": "Chat User 2"
        })
        assert response2.status_code == 200
        user2 = response2.json()
        
        return (user1["token"], user1["user"]["user_id"]), (user2["token"], user2["user"]["user_id"])
    
    def test_create_conversation(self, two_users):
        """Test creating a conversation between two users"""
        (token1, user1_id), (token2, user2_id) = two_users
        
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            params={"other_user_id": user2_id},
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "conversation_id" in data
        assert user1_id in data["participants"]
        assert user2_id in data["participants"]
        print(f"✓ Conversation created: {data['conversation_id']}")
        return data["conversation_id"]
    
    def test_send_and_get_messages(self, two_users):
        """Test sending and retrieving messages"""
        (token1, user1_id), (token2, user2_id) = two_users
        
        # Create conversation
        conv_response = requests.post(
            f"{BASE_URL}/api/conversations",
            params={"other_user_id": user2_id},
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert conv_response.status_code == 200
        conv_id = conv_response.json()["conversation_id"]
        
        # Send message from user 1
        msg_response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "conversation_id": conv_id,
                "content": "Hello, I need help with cleaning!"
            },
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert msg_response.status_code == 200, f"Expected 200, got {msg_response.status_code}: {msg_response.text}"
        msg_data = msg_response.json()
        assert "message_id" in msg_data
        assert msg_data["content"] == "Hello, I need help with cleaning!"
        print(f"✓ Message sent: {msg_data['message_id']}")
        
        # Get messages - user 2 should see the message
        get_response = requests.get(
            f"{BASE_URL}/api/messages/{conv_id}",
            headers={"Authorization": f"Bearer {token2}"}
        )
        assert get_response.status_code == 200
        messages = get_response.json()["messages"]
        assert len(messages) >= 1
        assert any(m["content"] == "Hello, I need help with cleaning!" for m in messages)
        print(f"✓ Messages retrieved: {len(messages)} messages in conversation")
    
    def test_get_conversations_list(self, two_users):
        """Test getting list of conversations"""
        (token1, user1_id), (token2, user2_id) = two_users
        
        # Create conversation first
        requests.post(
            f"{BASE_URL}/api/conversations",
            params={"other_user_id": user2_id},
            headers={"Authorization": f"Bearer {token1}"}
        )
        
        # Get conversations list
        response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        print(f"✓ Got {len(data['conversations'])} conversations")
    
    def test_message_access_denied_for_non_participant(self, two_users):
        """Test that non-participants can't access conversation"""
        (token1, user1_id), (token2, user2_id) = two_users
        
        # Create conversation between user1 and user2
        conv_response = requests.post(
            f"{BASE_URL}/api/conversations",
            params={"other_user_id": user2_id},
            headers={"Authorization": f"Bearer {token1}"}
        )
        conv_id = conv_response.json()["conversation_id"]
        
        # Create a third user
        user3_email = f"outsider_{uuid.uuid4().hex[:6]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": user3_email,
            "password": "Test123!",
            "name": "Outsider"
        })
        token3 = reg_response.json()["token"]
        
        # Third user tries to access conversation
        response = requests.get(
            f"{BASE_URL}/api/messages/{conv_id}",
            headers={"Authorization": f"Bearer {token3}"}
        )
        assert response.status_code == 403
        print("✓ Non-participant correctly denied access (403)")


class TestAdminReports:
    """Tests for Admin Reports management (GET /api/admin/reports)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin user not configured")
        return response.json()["token"]
    
    def test_admin_can_view_reports(self, admin_token):
        """Test admin can view all reports"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "reports" in data
        assert "total" in data
        print(f"✓ Admin retrieved {data['total']} reports")
    
    def test_non_admin_cannot_view_reports(self):
        """Test non-admin users cannot access admin reports"""
        # Register a regular user
        email = f"regular_{uuid.uuid4().hex[:6]}@test.com"
        reg = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test123!",
            "name": "Regular User"
        })
        token = reg.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/reports",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
        print("✓ Non-admin correctly denied access to reports (403)")


class TestCategories:
    """Test categories endpoint for Browse Helpers page"""
    
    def test_get_all_categories(self):
        """Test getting all categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert "groups" in data
        assert len(data["categories"]) > 0
        print(f"✓ Got {len(data['categories'])} categories in {len(data['groups'])} groups")
    
    def test_get_popular_categories_by_region(self):
        """Test getting popular categories by postcode"""
        response = requests.get(f"{BASE_URL}/api/categories/popular/SW1")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✓ Got {len(data['categories'])} popular categories for SW1 region")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
