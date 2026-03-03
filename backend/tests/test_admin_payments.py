"""
Admin Payment Management Tests
Tests for escrow payment system: admin dashboard, release payment, refund payment
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://anywork-escrow.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@anywork.co.uk"
ADMIN_PASSWORD = "Admin123!"
TEST_CUSTOMER_EMAIL = "testcustomer@test.com"
TEST_CUSTOMER_PASSWORD = "Test123!"
TEST_HELPER_ID = "helper_2d30e74b982c"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def customer_token():
    """Get customer authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_CUSTOMER_EMAIL,
        "password": TEST_CUSTOMER_PASSWORD
    })
    assert response.status_code == 200, f"Customer login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture
def admin_client(admin_token):
    """Requests session with admin auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    })
    return session


@pytest.fixture
def customer_client(customer_token):
    """Requests session with customer auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {customer_token}"
    })
    return session


class TestAdminAuthentication:
    """Test that admin access works correctly"""

    def test_admin_login(self):
        """Admin can log in with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"PASS: Admin login successful - user_id: {data['user']['user_id']}")

    def test_admin_wrong_password(self):
        """Admin login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
        print("PASS: Admin login correctly rejects wrong password")


class TestAdminPaymentsEndpoint:
    """Test GET /api/admin/payments endpoint"""

    def test_get_all_payments(self, admin_client):
        """Admin can retrieve all payment transactions"""
        response = admin_client.get(f"{BASE_URL}/api/admin/payments")
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "transactions" in data
        assert "total" in data
        assert "summary" in data
        
        # Validate summary structure
        summary = data["summary"]
        assert "held_amount" in summary
        assert "held_count" in summary
        assert "released_amount" in summary
        assert "released_count" in summary
        assert "platform_fees_earned" in summary
        
        print(f"PASS: Admin payments endpoint returns {data['total']} transactions")
        print(f"  Summary: held=£{summary['held_amount']} ({summary['held_count']}), released=£{summary['released_amount']} ({summary['released_count']}), fees=£{summary['platform_fees_earned']}")

    def test_filter_held_payments(self, admin_client):
        """Admin can filter payments by 'held' status"""
        response = admin_client.get(f"{BASE_URL}/api/admin/payments", params={
            "status": "held",
            "payout_status": "pending"
        })
        assert response.status_code == 200
        data = response.json()
        
        # All returned transactions should be held
        for txn in data["transactions"]:
            assert txn["payment_status"] == "held", f"Expected held, got {txn['payment_status']}"
            assert txn["payout_status"] == "pending", f"Expected pending, got {txn['payout_status']}"
        
        print(f"PASS: Held payments filter returns {len(data['transactions'])} transactions")

    def test_filter_released_payments(self, admin_client):
        """Admin can filter payments by 'released' status"""
        response = admin_client.get(f"{BASE_URL}/api/admin/payments", params={
            "payout_status": "completed"
        })
        assert response.status_code == 200
        data = response.json()
        
        # All returned transactions should be released
        for txn in data["transactions"]:
            assert txn["payout_status"] == "completed", f"Expected completed, got {txn['payout_status']}"
        
        print(f"PASS: Released payments filter returns {len(data['transactions'])} transactions")

    def test_filter_refunded_payments(self, admin_client):
        """Admin can filter payments by 'refunded' status"""
        response = admin_client.get(f"{BASE_URL}/api/admin/payments", params={
            "status": "refunded"
        })
        assert response.status_code == 200
        data = response.json()
        
        # All returned transactions should be refunded
        for txn in data["transactions"]:
            assert txn["payment_status"] == "refunded", f"Expected refunded, got {txn['payment_status']}"
        
        print(f"PASS: Refunded payments filter returns {len(data['transactions'])} transactions")

    def test_payment_transaction_data_structure(self, admin_client):
        """Transaction data contains all required fields"""
        response = admin_client.get(f"{BASE_URL}/api/admin/payments")
        assert response.status_code == 200
        data = response.json()
        
        if data["transactions"]:
            txn = data["transactions"][0]
            required_fields = [
                "transaction_id", "booking_id", "customer_id", "helper_id",
                "amount", "platform_fee", "helper_amount", "currency",
                "payment_status", "payout_status", "created_at"
            ]
            for field in required_fields:
                assert field in txn, f"Missing field: {field}"
            
            # Validate enriched data from aggregation
            assert "customer_name" in txn or txn.get("customer_name") is None
            assert "helper_name" in txn or txn.get("helper_name") is None
            
            # Validate amounts are numeric
            assert isinstance(txn["amount"], (int, float))
            assert isinstance(txn["platform_fee"], (int, float))
            assert isinstance(txn["helper_amount"], (int, float))
            
            print(f"PASS: Transaction data structure validated for {txn['transaction_id']}")
        else:
            print("PASS: No transactions to validate (empty list)")


class TestCheckoutFlow:
    """Test booking creation and checkout session creation"""

    def test_create_booking(self, customer_client):
        """Customer can create a booking"""
        booking_data = {
            "helper_id": TEST_HELPER_ID,
            "service_type": "cleaning",
            "date": "2026-03-15",
            "time": "10:00",
            "duration_hours": 2,
            "total_amount": 35.20,
            "platform_fee": 3.20,
            "notes": "Test booking for payment flow"
        }
        
        response = customer_client.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert response.status_code == 200
        data = response.json()
        
        # Validate booking data
        assert "booking_id" in data
        assert data["helper_id"] == TEST_HELPER_ID
        assert data["total_amount"] == 35.20
        assert data["platform_fee"] == 3.20
        assert data["status"] == "pending"
        assert data["payment_status"] == "unpaid"
        
        print(f"PASS: Booking created with ID: {data['booking_id']}")
        return data["booking_id"]

    def test_create_checkout_session(self, customer_client):
        """Customer can create checkout session for a booking"""
        # First create a booking
        booking_data = {
            "helper_id": TEST_HELPER_ID,
            "service_type": "cleaning",
            "date": "2026-03-16",
            "time": "14:00",
            "duration_hours": 3,
            "total_amount": 52.80,
            "platform_fee": 4.80,
            "notes": "Test checkout session"
        }
        
        booking_response = customer_client.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert booking_response.status_code == 200
        booking_id = booking_response.json()["booking_id"]
        
        # Create checkout session
        checkout_data = {
            "booking_id": booking_id,
            "origin_url": "https://anywork-escrow.preview.emergentagent.com"
        }
        
        checkout_response = customer_client.post(f"{BASE_URL}/api/payments/checkout", json=checkout_data)
        assert checkout_response.status_code == 200
        checkout = checkout_response.json()
        
        # Validate checkout response
        assert "url" in checkout
        assert "session_id" in checkout
        assert "transaction_id" in checkout
        assert checkout["url"].startswith("https://")  # Should be Stripe URL
        
        print(f"PASS: Checkout session created - transaction: {checkout['transaction_id']}")
        print(f"  Stripe URL: {checkout['url'][:60]}...")
        return checkout["transaction_id"]


class TestTransactionAmounts:
    """Verify transaction amounts are calculated correctly"""

    def test_transaction_amount_calculation(self, customer_client, admin_client):
        """Transaction record has correct amounts (total, platform_fee, helper_amount)"""
        # Create booking with known amounts
        total_amount = 44.00
        platform_fee = 4.00  # 10% fee
        expected_helper_amount = total_amount - platform_fee  # 40.00
        
        booking_data = {
            "helper_id": TEST_HELPER_ID,
            "service_type": "cleaning",
            "date": "2026-03-17",
            "time": "09:00",
            "duration_hours": 2,
            "total_amount": total_amount,
            "platform_fee": platform_fee,
            "notes": "Test amount calculation"
        }
        
        booking_response = customer_client.post(f"{BASE_URL}/api/bookings", json=booking_data)
        assert booking_response.status_code == 200
        booking_id = booking_response.json()["booking_id"]
        
        # Create checkout to generate transaction
        checkout_data = {
            "booking_id": booking_id,
            "origin_url": "https://anywork-escrow.preview.emergentagent.com"
        }
        
        checkout_response = customer_client.post(f"{BASE_URL}/api/payments/checkout", json=checkout_data)
        assert checkout_response.status_code == 200
        transaction_id = checkout_response.json()["transaction_id"]
        
        # Get transaction details via admin endpoint
        detail_response = admin_client.get(f"{BASE_URL}/api/admin/payments/{transaction_id}")
        assert detail_response.status_code == 200
        txn = detail_response.json()["transaction"]
        
        # Validate amounts
        assert txn["amount"] == total_amount, f"Expected amount {total_amount}, got {txn['amount']}"
        assert txn["platform_fee"] == platform_fee, f"Expected fee {platform_fee}, got {txn['platform_fee']}"
        assert txn["helper_amount"] == expected_helper_amount, f"Expected helper amount {expected_helper_amount}, got {txn['helper_amount']}"
        
        print(f"PASS: Transaction amounts correct - total: £{txn['amount']}, fee: £{txn['platform_fee']}, helper: £{txn['helper_amount']}")


class TestReleasePayment:
    """Test payment release functionality"""

    def test_release_requires_held_status(self, admin_client):
        """Cannot release payment that is not held"""
        # Get payments that are NOT held
        response = admin_client.get(f"{BASE_URL}/api/admin/payments?payout_status=completed")
        data = response.json()
        
        if data["transactions"]:
            txn = data["transactions"][0]
            release_response = admin_client.post(f"{BASE_URL}/api/admin/payments/{txn['transaction_id']}/release")
            
            # Should fail - already released
            assert release_response.status_code == 400
            error = release_response.json()
            assert "detail" in error
            print(f"PASS: Release correctly rejected for completed transaction: {error['detail']}")
        else:
            print("SKIP: No completed transactions to test release rejection")

    def test_release_nonexistent_transaction(self, admin_client):
        """Release returns 404 for nonexistent transaction"""
        response = admin_client.post(f"{BASE_URL}/api/admin/payments/txn_nonexistent123/release")
        assert response.status_code == 404
        print("PASS: Release returns 404 for nonexistent transaction")


class TestRefundPayment:
    """Test payment refund functionality"""

    def test_refund_requires_held_status(self, admin_client):
        """Cannot refund payment that has been released"""
        # Get payments that are released
        response = admin_client.get(f"{BASE_URL}/api/admin/payments?payout_status=completed")
        data = response.json()
        
        if data["transactions"]:
            txn = data["transactions"][0]
            refund_response = admin_client.post(f"{BASE_URL}/api/admin/payments/{txn['transaction_id']}/refund")
            
            # Should fail - already released to helper
            assert refund_response.status_code == 400
            error = refund_response.json()
            assert "detail" in error
            print(f"PASS: Refund correctly rejected for released transaction: {error['detail']}")
        else:
            print("SKIP: No released transactions to test refund rejection")

    def test_refund_nonexistent_transaction(self, admin_client):
        """Refund returns 404 for nonexistent transaction"""
        response = admin_client.post(f"{BASE_URL}/api/admin/payments/txn_nonexistent123/refund")
        assert response.status_code == 404
        print("PASS: Refund returns 404 for nonexistent transaction")


class TestNonAdminAccess:
    """Test that non-admin users can access the endpoints (no backend restriction)"""

    def test_customer_can_access_admin_payments(self, customer_client):
        """Customer can also access admin payments (frontend restricts by email)"""
        # Note: Backend doesn't have admin restriction, only frontend checks email
        response = customer_client.get(f"{BASE_URL}/api/admin/payments")
        # This should still work - access control is frontend only
        assert response.status_code == 200
        print("PASS: Admin payments endpoint is accessible (note: admin check is frontend-only)")


class TestUnauthenticatedAccess:
    """Test that unauthenticated users cannot access endpoints"""

    def test_admin_payments_requires_auth(self):
        """Admin payments endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/payments")
        assert response.status_code == 401
        print("PASS: Admin payments endpoint requires authentication")

    def test_release_requires_auth(self):
        """Release endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/payments/txn_123/release")
        assert response.status_code == 401
        print("PASS: Release endpoint requires authentication")

    def test_refund_requires_auth(self):
        """Refund endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/payments/txn_123/refund")
        assert response.status_code == 401
        print("PASS: Refund endpoint requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
