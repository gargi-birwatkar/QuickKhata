# QuickKhata 📒

> **Passwordless Daily Expense & Invoice Ledger for Local Vendors & Freelancers**  
> Powered by **[MiniMoth](https://minimoth.dev)** WhatsApp OTP Delivery (with automatic SMS fallback).

---

## 🌟 Overview

In traditional retail and freelance workflows, passwords create friction, forgotten credentials cause lockouts, and customers rarely check emails. **QuickKhata** replaces passwords entirely with **mobile-number-only authentication**:

1. **WhatsApp Delivery First:** OTPs land directly in the user's primary business chat app.
2. **Instant SMS Fallback:** If WhatsApp delivery encounters delays or network issues, MiniMoth automatically falls back to SMS.
3. **Session Management:** Issues secure `access_token` and `refresh_token` for authenticated API calls.
4. **Vendor Ledger:** Daily dashboard displaying collected revenue, pending dues, customer accounts, and 1-click WhatsApp payment reminders.

---

## ⚠️ Important: Why did I not receive an OTP on my physical phone?

If you entered your mobile number and saw **"OTP sent"** on the screen, but didn't receive a message on your phone, check your API key in `backend/.env`:

### 1. You are using a Sandbox Key (`mm_test_...`)
- Keys starting with **`mm_test_`** are MiniMoth **Sandbox Keys**.
- In sandbox mode, MiniMoth **simulates delivery without sending physical WhatsApp or SMS messages** so that developers can test integrations without consuming credits or sending unnecessary messages.
- **How to log in with a test key:** Simply enter the test OTP code **`000000`** (or **`123456`**). The system will verify and log you into the dashboard immediately!

### 2. How to receive REAL WhatsApp & SMS messages:
1. Log into your MiniMoth dashboard at **[https://app.minimoth.dev](https://app.minimoth.dev)**.
2. Switch to your **Live API Key** (starts with **`mm_live_...`**).
3. Ensure your project has active message credits.
4. Update `backend/.env`:
   ```env
   MINIMOTH_API_KEY=mm_live_your_actual_live_key_here
   ALLOW_MOCK_FALLBACK=false
   ```
5. Restart the backend. Real OTPs will now be delivered directly to your WhatsApp and phone.

---

## 🏗️ Architecture

```
[ Frontend: React 18 + Vite + Tailwind CSS ]
                     │
                     ▼
       [ Backend: FastAPI (Python 3.13) ]
          ├── POST /api/auth/send-otp   ──> MiniMoth API (POST https://api.minimoth.dev/v1/otp/send)
          ├── POST /api/auth/verify-otp ──> MiniMoth API (POST https://api.minimoth.dev/v1/otp/verify)
          ├── GET  /api/dashboard/stats ──> Protected route (Verifies Bearer access_token)
          ├── POST /api/invoices        ──> Record new ledger transaction
          └── PATCH /api/invoices/{id}/status ──> Toggle Paid / Pending / Overdue
```

---

## 📁 Project Directory Structure

```
QuickKhata/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Python package marker
│   │   ├── config.py             # Loads .env & handles test key detection
│   │   ├── schemas.py            # Pydantic models with +91 phone sanitization
│   │   └── main.py               # FastAPI proxy routes & protected ledger API
│   ├── .env                      # Active environment variables (MINIMOTH_API_KEY)
│   ├── .env.example              # Template configuration
│   ├── requirements.txt          # Python dependencies
│   ├── run.py                    # Uvicorn server launcher
│   └── test_backend.py           # End-to-end automated test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header with phone badge & logout
│   │   │   ├── LoginCard.jsx           # Screen 1: Mobile number login card
│   │   │   ├── OtpVerificationCard.jsx # Screen 2: 6-digit OTP verification card
│   │   │   ├── Dashboard.jsx           # Screen 3: Ledger dashboard & invoice table
│   │   │   └── StatsCard.jsx           # Metric visualization cards
│   │   ├── services/
│   │   │   └── api.js                  # MiniMoth API client & session manager
│   │   ├── App.jsx                     # State machine & page router
│   │   ├── index.css                   # Tailwind styling
│   │   └── main.jsx                    # Vite React entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js                  # Vite dev server + proxy to :8000
│   └── tailwind.config.js
│
├── start_dev.bat                       # 1-Click Windows development launcher
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (Python 3.13 supported)
- **Node.js 18+** (Node v24 supported)

---

### 1. Backend Setup (FastAPI)

1. Open a terminal in the `backend` folder:
   ```powershell
   cd backend
   ```
2. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Configure your API key in `backend/.env`:
   ```env
   # Your MiniMoth API Key (either mm_test_... or mm_live_...)
   MINIMOTH_API_KEY=mm_test_your_key_here
   MINIMOTH_BASE_URL=https://api.minimoth.dev/v1
   PORT=8000
   HOST=0.0.0.0
   ALLOW_MOCK_FALLBACK=true
   ```
4. Run the automated test suite:
   ```powershell
   python test_backend.py
   ```
   *(Expected result: `>>> ALL BACKEND TESTS PASSED SUCCESSFULLY! <<<`)*
5. Start the backend server:
   ```powershell
   python run.py
   ```
   - API runs at: `http://localhost:8000`
   - Interactive Swagger API docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup (React + Vite + Tailwind CSS)

1. Open a terminal in the `frontend` folder:
   ```powershell
   cd frontend
   ```
2. Install Node dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open your browser:
   ```
   http://localhost:5173
   ```

---

### 3. Quick Launch (Both Together on Windows)

Double-click `start_dev.bat` in the root folder, or run:
```powershell
.\start_dev.bat
```
This opens two terminal windows running both the FastAPI backend (`:8000`) and the Vite frontend (`:5173`).

---

## 🔑 MiniMoth API Integration Reference

### 1. Send OTP
- **QuickKhata Endpoint:** `POST /api/auth/send-otp`
- **MiniMoth Endpoint:** `POST https://api.minimoth.dev/v1/otp/send`
- **Headers:** `x-api-key: <MINIMOTH_API_KEY>`
- **Request Body:**
  ```json
  {
    "phone": "+919876543210"
  }
  ```
- **Response:**
  ```json
  {
    "message": "OTP sent",
    "otp_id": "b28c81f2-6cc5-4c66-8d39-ca3f44f90280",
    "delivery_channel": "WhatsApp (with SMS fallback)",
    "is_mock": false
  }
  ```

### 2. Verify OTP
- **QuickKhata Endpoint:** `POST /api/auth/verify-otp` (or `/api/auth/verify`)
- **MiniMoth Endpoint:** `POST https://api.minimoth.dev/v1/otp/verify`
- **Headers:** `x-api-key: <MINIMOTH_API_KEY>`
- **Request Body:**
  ```json
  {
    "otp_id": "b28c81f2-6cc5-4c66-8d39-ca3f44f90280",
    "otp": "000000"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "qk_live_token_...",
    "refresh_token": "qk_refresh_token_...",
    "expires_at": 1792078865,
    "phone": "+919876543210"
  }
  ```

### 3. Protected Dashboard Stats
- **QuickKhata Endpoint:** `GET /api/dashboard/stats`
- **Header:** `Authorization: Bearer <access_token>`
- **Response:**
  ```json
  {
    "status": "authenticated",
    "total_revenue": "₹42,850",
    "pending_dues": "₹6,300",
    "active_customers": 24,
    "total_invoices": 18,
    "recent_invoices": [
      {
        "id": "INV-101",
        "customer": "Aarav Sharma",
        "phone": "+91 98201 11223",
        "amount": "₹4,500",
        "status": "Paid",
        "date": "Today, 11:30 AM",
        "description": "Monthly wholesale supply"
      }
    ]
  }
  ```

---

## 📱 Frontend Screens

1. **Screen 1 — Mobile Login Card:**
   - Clean Indian mobile input with `+91` prefix.
   - Strict 10-digit validation.
   - Clean loading state during OTP dispatch.
   - WhatsApp priority delivery indicator badge.

2. **Screen 2 — OTP Verification Card:**
   - 6 individual digit input boxes with auto-focus, auto-advance, backspace navigation, and paste support.
   - 30-second countdown timer for resending OTPs.
   - Test key helper banner with 1-click **Auto-fill** for sandbox testing.
   - Option to jump back and change the mobile number.

3. **Screen 3 — Business Ledger Dashboard:**
   - **Financial Metrics:** Total Revenue Collected, Outstanding Dues, Active Customers, and Total Invoices.
   - **Interactive Table:** Real-time search and filter tabs (*All, Paid, Pending, Overdue*).
   - **One-Click Actions:** Direct status toggle between *Paid* and *Pending*.
   - **WhatsApp Reminder:** Generates a pre-filled WhatsApp payment reminder for clients with outstanding invoices.
   - **New Transaction Modal:** Quickly record new customer transactions into the ledger.
   - **Logout:** Completely purges stored session tokens and resets UI state.

---

## 🛠️ Testing & Troubleshooting

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| OTP sent but not received on phone | Using `mm_test_` sandbox key | In test mode, MiniMoth does not send real messages. Enter `000000` to verify, or switch to a `mm_live_` key in `backend/.env`. |
| 401 Unauthorized on dashboard | Missing or invalid Bearer token | Ensure you pass the `Authorization: Bearer <access_token>` header, or log in via the UI. |
| CORS or connection error | Backend not running | Start the backend on port 8000 using `python run.py`. The Vite proxy redirects `/api` automatically. |
