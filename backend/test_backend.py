import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)

def test_full_flow():
    print("\n--- 1. Testing Health Check ---")
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    print("Health check response:", resp.json())

    print("\n--- 2. Testing Send OTP ---")
    resp = client.post("/api/auth/send-otp", json={"phone": "+919876543210"})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    send_data = resp.json()
    print("Send OTP response:", send_data)
    otp_id = send_data["otp_id"]
    assert otp_id, "otp_id should not be empty"

    print("\n--- 3. Testing Verify OTP with Invalid Code ---")
    resp = client.post("/api/auth/verify-otp", json={"otp_id": otp_id, "otp": "999888"})
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
    print("Invalid OTP rejected as expected:", resp.json())

    print("\n--- 4. Testing Verify OTP with Valid Code (123456) ---")
    resp = client.post("/api/auth/verify-otp", json={"otp_id": otp_id, "otp": "123456"})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    verify_data = resp.json()
    print("Verify OTP response:", verify_data)
    access_token = verify_data["access_token"]
    assert access_token, "access_token should not be empty"

    print("\n--- 5. Testing Protected Dashboard without Token (Expect 401) ---")
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("Unauthorized access rejected as expected:", resp.json())

    print("\n--- 6. Testing Protected Dashboard with Valid Bearer Token ---")
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = client.get("/api/dashboard/stats", headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    stats_data = resp.json()
    print("Dashboard Stats response:")
    print("  Total Revenue:", stats_data["total_revenue"])
    print("  Pending Dues:", stats_data["pending_dues"])
    print("  Active Customers:", stats_data["active_customers"])
    print("  Total Invoices:", stats_data["total_invoices"])
    print(f"  Loaded {len(stats_data['recent_invoices'])} invoices")

    print("\n--- 7. Testing Creating a New Ledger Invoice ---")
    new_inv_payload = {
        "customer": "Kiran Deshmukh",
        "phone": "+91 99887 76655",
        "amount": "₹3,400",
        "status": "Pending",
        "description": "Custom woodworking batch"
    }
    resp = client.post("/api/invoices", json=new_inv_payload, headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    created_inv = resp.json()
    print("Created invoice:", created_inv)
    assert created_inv["customer"] == "Kiran Deshmukh"

    print("\n--- 8. Testing Updated Stats after Invoice Creation ---")
    resp = client.get("/api/dashboard/stats", headers=headers)
    assert resp.status_code == 200
    updated_stats = resp.json()
    print("Updated Total Invoices:", updated_stats["total_invoices"])
    assert updated_stats["total_invoices"] == stats_data["total_invoices"] + 1

    print("\n>>> ALL BACKEND TESTS PASSED SUCCESSFULLY! <<<\n")

if __name__ == "__main__":
    test_full_flow()
