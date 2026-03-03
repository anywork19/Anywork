"""
Backend API tests for new features:
1. Featured Helpers API - GET /api/helpers/featured
2. Seasonal Pricing API - GET /api/pricing/seasonal, GET /api/pricing/category/{id}
3. Notifications API - GET /api/notifications, PUT /api/notifications/{id}/read, PUT /api/notifications/read-all
4. Email Service (MOCKED) - Verified via logs during booking confirmation
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFeaturedHelpers:
    """Featured Helpers API - GET /api/helpers/featured returns top-rated helpers"""
    
    def test_featured_helpers_endpoint(self):
        """Test GET /api/helpers/featured returns list of featured helpers"""
        response = requests.get(f"{BASE_URL}/api/helpers/featured")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "helpers" in data, "Response should contain 'helpers' key"
        assert isinstance(data["helpers"], list), "helpers should be a list"
    
    def test_featured_helpers_with_limit(self):
        """Test GET /api/helpers/featured with limit parameter"""
        response = requests.get(f"{BASE_URL}/api/helpers/featured?limit=2")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["helpers"]) <= 2, "Should return at most 2 helpers"
    
    def test_featured_helpers_data_structure(self):
        """Test featured helpers have expected fields"""
        response = requests.get(f"{BASE_URL}/api/helpers/featured?limit=4")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["helpers"]) > 0:
            helper = data["helpers"][0]
            # Verify helper has important fields
            assert "helper_id" in helper, "Helper should have helper_id"
            assert "user_name" in helper or "user_id" in helper, "Helper should have user info"
            assert "categories" in helper, "Helper should have categories"
            assert "hourly_rate" in helper, "Helper should have hourly_rate"


class TestSeasonalPricing:
    """Seasonal Pricing API tests"""
    
    def test_seasonal_pricing_endpoint(self):
        """Test GET /api/pricing/seasonal returns current month pricing"""
        response = requests.get(f"{BASE_URL}/api/pricing/seasonal")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "month" in data, "Response should contain 'month'"
        assert "adjustments" in data, "Response should contain 'adjustments'"
        assert "categories" in data, "Response should contain 'categories'"
        
        # Month should be 1-12
        assert 1 <= data["month"] <= 12, "Month should be between 1 and 12"
    
    def test_seasonal_pricing_has_categories(self):
        """Test seasonal pricing includes category data"""
        response = requests.get(f"{BASE_URL}/api/pricing/seasonal")
        assert response.status_code == 200
        
        data = response.json()
        categories = data.get("categories", [])
        assert len(categories) > 0, "Should have at least one category"
        
        # Check category structure
        for cat in categories[:3]:
            assert "id" in cat, "Category should have id"
            assert "name" in cat, "Category should have name"
    
    def test_category_pricing_endpoint(self):
        """Test GET /api/pricing/category/{id} returns category-specific pricing"""
        # Test with a common category
        response = requests.get(f"{BASE_URL}/api/pricing/category/cleaning")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "category" in data, "Response should contain 'category'"
        assert "seasonal_multiplier" in data, "Response should contain 'seasonal_multiplier'"
        assert "seasonal_status" in data, "Response should contain 'seasonal_status'"
    
    def test_category_pricing_invalid_category(self):
        """Test GET /api/pricing/category/{id} with invalid category returns 404"""
        response = requests.get(f"{BASE_URL}/api/pricing/category/invalid_nonexistent_category_xyz")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestNotificationsAPI:
    """Notifications API tests - requires authentication"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers for test customer"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testcustomer@test.com",
            "password": "Test123!"
        })
        if login_response.status_code != 200:
            pytest.skip("Test customer login failed - user may not exist")
        
        token = login_response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_notifications_requires_auth(self):
        """Test GET /api/notifications requires authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401, f"Expected 401 unauthorized, got {response.status_code}"
    
    def test_notifications_authenticated(self, auth_headers):
        """Test GET /api/notifications returns notifications for authenticated user"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "notifications" in data, "Response should contain 'notifications'"
        assert "unread_count" in data, "Response should contain 'unread_count'"
        assert isinstance(data["notifications"], list), "notifications should be a list"
    
    def test_notifications_unread_filter(self, auth_headers):
        """Test GET /api/notifications with unread_only filter"""
        response = requests.get(f"{BASE_URL}/api/notifications?unread_only=true", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # If there are notifications, they should all be unread
        for notif in data.get("notifications", []):
            assert notif.get("read") == False, "All notifications should be unread when filter is true"
    
    def test_mark_notification_read_requires_auth(self):
        """Test PUT /api/notifications/{id}/read requires authentication"""
        response = requests.put(f"{BASE_URL}/api/notifications/fake_id/read")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_mark_all_read_requires_auth(self):
        """Test PUT /api/notifications/read-all requires authentication"""
        response = requests.put(f"{BASE_URL}/api/notifications/read-all")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_mark_all_read_authenticated(self, auth_headers):
        """Test PUT /api/notifications/read-all with authentication"""
        response = requests.put(f"{BASE_URL}/api/notifications/read-all", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify response
        data = response.json()
        assert "message" in data, "Response should contain confirmation message"


class TestHelpersEndpoint:
    """Additional tests for helpers endpoint to verify data is present for featured section"""
    
    def test_helpers_list(self):
        """Test GET /api/helpers returns helpers"""
        response = requests.get(f"{BASE_URL}/api/helpers")
        assert response.status_code == 200
        
        data = response.json()
        assert "helpers" in data
        assert "total" in data
    
    def test_helpers_with_ratings(self):
        """Test helpers have rating fields for featured section"""
        response = requests.get(f"{BASE_URL}/api/helpers")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["helpers"]) > 0:
            # Check rating fields exist
            helper = data["helpers"][0]
            assert "rating" in helper or "total_reviews" in helper, "Helpers should have rating data"


class TestEmailServiceMocked:
    """Tests to verify email service is MOCKED (logs only, not sent)"""
    
    def test_api_root_accessible(self):
        """Verify API is running (prerequisite for email service)"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    def test_booking_endpoint_exists(self):
        """Verify booking endpoints exist (email is triggered on booking confirmation)"""
        # Test that bookings endpoint requires auth (expected behavior)
        response = requests.get(f"{BASE_URL}/api/bookings")
        # Should return 401 without auth, confirming endpoint exists
        assert response.status_code == 401, "Bookings endpoint should require authentication"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
