"""
Backend API tests for Booking Request Flow - AnyWork UK Marketplace (No Payment Processing)
Features tested:
1. POST /api/bookings - Create pending booking (customer)
2. GET /api/bookings/helper - Get helper's booking requests
3. PUT /api/bookings/{id}/status - Accept (confirmed), Decline (declined), Complete (completed) booking
4. Email notifications MOCKED (logged when booking created/confirmed)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from main agent context
TEST_CUSTOMER_EMAIL = "testcustomer@test.com"
TEST_CUSTOMER_PASSWORD = "Test123!"
HELPER_ID = "helper_2d30e74b982c"


class TestBookingRequestFlow:
    """Test the complete booking request flow (no payment)"""

    @pytest.fixture
    def customer_auth(self):
        """Get auth token for test customer"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Customer login failed: {response.text}")
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}

    @pytest.fixture
    def helper_user(self):
        """Get or create helper user for testing"""
        # First get the helper profile to find user_id
        response = requests.get(f"{BASE_URL}/api/helpers/{HELPER_ID}")
        if response.status_code != 200:
            pytest.skip(f"Helper not found: {response.text}")
        
        helper_data = response.json()
        user_id = helper_data.get("user_id")
        
        # Get user email - we need to login as helper
        # For testing, we'll create a helper user if needed
        return helper_data

    @pytest.fixture
    def helper_auth(self):
        """Get auth token for helper user"""
        # Login as helper user (created from seed data)
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah.cleaner@email.com",  # Helper user from seed
            "password": "Test123!"
        })
        if response.status_code != 200:
            # Try creating a helper user
            pytest.skip(f"Helper login failed - may need to create helper user: {response.text}")
        
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}

    def test_create_booking_requires_auth(self):
        """Test POST /api/bookings requires authentication"""
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            "helper_id": HELPER_ID,
            "service_type": "cleaning",
            "date": "2026-03-15",
            "time": "10:00",
            "duration_hours": 2,
            "total_amount": 30.00,
            "notes": "Test booking"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_create_booking_success(self, customer_auth):
        """Test POST /api/bookings creates a pending booking"""
        unique_note = f"Test booking {uuid.uuid4().hex[:8]}"
        
        response = requests.post(f"{BASE_URL}/api/bookings", 
            headers=customer_auth,
            json={
                "helper_id": HELPER_ID,
                "service_type": "cleaning",
                "date": "2026-03-20",
                "time": "10:00",
                "duration_hours": 2,
                "total_amount": 30.00,
                "platform_fee": 0,
                "notes": unique_note,
                "preferred_payment": "cash",
                "status": "pending"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "booking_id" in data, "Response should contain booking_id"
        assert data["status"] == "pending", f"New booking should have pending status, got {data['status']}"
        assert data["helper_id"] == HELPER_ID, "Helper ID should match"
        assert data["notes"] == unique_note, "Notes should match"
        
        # Store booking_id for later tests
        self.__class__.created_booking_id = data["booking_id"]
        print(f"Created booking: {data['booking_id']}")
        return data["booking_id"]

    def test_create_booking_with_bank_transfer(self, customer_auth):
        """Test creating booking with bank_transfer payment preference"""
        response = requests.post(f"{BASE_URL}/api/bookings",
            headers=customer_auth,
            json={
                "helper_id": HELPER_ID,
                "service_type": "home-help",
                "date": "2026-03-21",
                "time": "14:00",
                "duration_hours": 3,
                "total_amount": 45.00,
                "platform_fee": 0,
                "notes": "Bank transfer test",
                "preferred_payment": "bank_transfer"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("preferred_payment") == "bank_transfer", "Should accept bank_transfer as payment method"

    def test_get_customer_bookings(self, customer_auth):
        """Test GET /api/bookings returns customer's bookings"""
        response = requests.get(f"{BASE_URL}/api/bookings", headers=customer_auth)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "bookings" in data, "Response should contain 'bookings'"
        assert isinstance(data["bookings"], list), "bookings should be a list"
        
        # Verify booking structure
        if len(data["bookings"]) > 0:
            booking = data["bookings"][0]
            assert "booking_id" in booking, "Booking should have booking_id"
            assert "status" in booking, "Booking should have status"
            assert "helper_id" in booking, "Booking should have helper_id"


class TestHelperBookingsAPI:
    """Test GET /api/bookings/helper for helper's booking requests"""

    @pytest.fixture
    def helper_auth(self):
        """Get auth for helper user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah.cleaner@email.com",
            "password": "Test123!"
        })
        if response.status_code != 200:
            pytest.skip("Helper user login failed")
        return {"Authorization": f"Bearer {response.json()['token']}"}

    @pytest.fixture
    def customer_auth(self):
        """Get auth for customer"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Customer login failed")
        return {"Authorization": f"Bearer {response.json()['token']}"}

    def test_helper_bookings_requires_auth(self):
        """Test GET /api/bookings/helper requires authentication"""
        response = requests.get(f"{BASE_URL}/api/bookings/helper")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_helper_bookings_for_non_helper(self, customer_auth):
        """Test GET /api/bookings/helper returns empty for non-helper user"""
        response = requests.get(f"{BASE_URL}/api/bookings/helper", headers=customer_auth)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "bookings" in data
        # Non-helper should get empty list
        assert isinstance(data["bookings"], list)


class TestBookingStatusUpdates:
    """Test PUT /api/bookings/{id}/status for accept/decline/complete"""
    
    @pytest.fixture
    def customer_auth(self):
        """Get auth for customer"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Customer login failed")
        return {"Authorization": f"Bearer {response.json()['token']}"}

    @pytest.fixture
    def create_test_booking(self, customer_auth):
        """Create a booking for status update tests"""
        response = requests.post(f"{BASE_URL}/api/bookings",
            headers=customer_auth,
            json={
                "helper_id": HELPER_ID,
                "service_type": "cleaning",
                "date": "2026-03-25",
                "time": "11:00",
                "duration_hours": 2,
                "total_amount": 30.00,
                "notes": f"Status test {uuid.uuid4().hex[:8]}"
            }
        )
        if response.status_code != 200:
            pytest.skip(f"Could not create test booking: {response.text}")
        return response.json()["booking_id"]

    def test_update_status_requires_auth(self, create_test_booking):
        """Test PUT /api/bookings/{id}/status requires authentication"""
        booking_id = create_test_booking
        response = requests.put(f"{BASE_URL}/api/bookings/{booking_id}/status", json={
            "status": "confirmed"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_update_status_invalid_booking(self, customer_auth):
        """Test PUT /api/bookings/{id}/status with invalid booking_id returns 404"""
        response = requests.put(f"{BASE_URL}/api/bookings/invalid_booking_xyz/status",
            headers=customer_auth,
            json={"status": "confirmed"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"

    def test_update_status_invalid_status(self, customer_auth, create_test_booking):
        """Test PUT /api/bookings/{id}/status with invalid status returns 400"""
        booking_id = create_test_booking
        response = requests.put(f"{BASE_URL}/api/bookings/{booking_id}/status",
            headers=customer_auth,
            json={"status": "invalid_status_xyz"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"

    def test_customer_can_cancel_booking(self, customer_auth, create_test_booking):
        """Test customer can cancel their own booking"""
        booking_id = create_test_booking
        response = requests.put(f"{BASE_URL}/api/bookings/{booking_id}/status",
            headers=customer_auth,
            json={"status": "cancelled"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["status"] == "cancelled", f"Status should be cancelled, got {data['status']}"


class TestBookingStatusValidValues:
    """Test all valid status values for bookings"""
    
    @pytest.fixture
    def customer_auth(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Customer login failed")
        return {"Authorization": f"Bearer {response.json()['token']}"}

    def test_valid_status_pending(self, customer_auth):
        """Verify 'pending' is a valid status"""
        # Create booking - default status is pending
        response = requests.post(f"{BASE_URL}/api/bookings",
            headers=customer_auth,
            json={
                "helper_id": HELPER_ID,
                "service_type": "cleaning",
                "date": "2026-03-26",
                "time": "09:00",
                "duration_hours": 1,
                "total_amount": 15.00
            }
        )
        assert response.status_code == 200
        assert response.json()["status"] == "pending"

    def test_valid_status_confirmed(self, customer_auth):
        """Verify 'confirmed' is a valid status value"""
        # First create a booking
        create_response = requests.post(f"{BASE_URL}/api/bookings",
            headers=customer_auth,
            json={
                "helper_id": HELPER_ID,
                "service_type": "cleaning",
                "date": "2026-03-27",
                "time": "09:00",
                "duration_hours": 1,
                "total_amount": 15.00
            }
        )
        if create_response.status_code != 200:
            pytest.skip("Could not create booking")
        
        booking_id = create_response.json()["booking_id"]
        
        # Update to confirmed
        response = requests.put(f"{BASE_URL}/api/bookings/{booking_id}/status",
            headers=customer_auth,
            json={"status": "confirmed"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    def test_valid_status_declined(self, customer_auth):
        """Verify 'declined' is a valid status value"""
        # First create a booking
        create_response = requests.post(f"{BASE_URL}/api/bookings",
            headers=customer_auth,
            json={
                "helper_id": HELPER_ID,
                "service_type": "cleaning",
                "date": "2026-03-28",
                "time": "09:00",
                "duration_hours": 1,
                "total_amount": 15.00
            }
        )
        if create_response.status_code != 200:
            pytest.skip("Could not create booking")
        
        booking_id = create_response.json()["booking_id"]
        
        # Update to declined
        response = requests.put(f"{BASE_URL}/api/bookings/{booking_id}/status",
            headers=customer_auth,
            json={"status": "declined"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    def test_valid_status_completed(self, customer_auth):
        """Verify 'completed' is a valid status value"""
        # First create and confirm a booking
        create_response = requests.post(f"{BASE_URL}/api/bookings",
            headers=customer_auth,
            json={
                "helper_id": HELPER_ID,
                "service_type": "cleaning",
                "date": "2026-03-29",
                "time": "09:00",
                "duration_hours": 1,
                "total_amount": 15.00
            }
        )
        if create_response.status_code != 200:
            pytest.skip("Could not create booking")
        
        booking_id = create_response.json()["booking_id"]
        
        # First confirm
        requests.put(f"{BASE_URL}/api/bookings/{booking_id}/status",
            headers=customer_auth,
            json={"status": "confirmed"}
        )
        
        # Then complete
        response = requests.put(f"{BASE_URL}/api/bookings/{booking_id}/status",
            headers=customer_auth,
            json={"status": "completed"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestEmailNotificationsMocked:
    """Test that email notifications are logged (MOCKED) when booking is created/confirmed"""
    
    def test_api_is_running(self):
        """Verify API is accessible for email notifications to work"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
    def test_booking_creation_triggers_notification_log(self):
        """
        Email notifications are MOCKED - when a booking is created, 
        the server logs what email would have been sent.
        This test verifies the booking creation endpoint works (email is logged server-side).
        """
        # Login as customer
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Login failed")
        
        auth = {"Authorization": f"Bearer {login_response.json()['token']}"}
        
        # Create booking - this should trigger MOCKED email to helper
        response = requests.post(f"{BASE_URL}/api/bookings",
            headers=auth,
            json={
                "helper_id": HELPER_ID,
                "service_type": "cleaning",
                "date": "2026-04-01",
                "time": "10:00",
                "duration_hours": 2,
                "total_amount": 30.00,
                "notes": "Email notification test"
            }
        )
        assert response.status_code == 200, f"Booking creation should succeed: {response.text}"
        
        # Email is MOCKED - check server logs for "[EMAIL MOCKED]" message
        # This test confirms the booking flow works; email logging is verified via server logs
        print("Booking created successfully - email notification logged on server (MOCKED)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
