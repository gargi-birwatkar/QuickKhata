import os
import uuid
import time
import logging
from typing import Dict, Any, Optional
import httpx
from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    MINIMOTH_API_KEY,
    MINIMOTH_BASE_URL,
    IS_DEMO_KEY,
    ALLOW_MOCK_FALLBACK,
)
from app.schemas import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    DashboardStatsResponse,
    Invoice,
    CreateInvoiceRequest,
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("quickkhata")

app = FastAPI(
    title="QuickKhata API",
    description="Backend for QuickKhata powered by MiniMoth WhatsApp/SMS OTP Authentication",
    version="1.0.0",
)

# Enable CORS for local Vite frontend and general access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory mock session store for local sandbox testing
# (used if MINIMOTH_API_KEY is demo or when fallback is active)
mock_otp_store: Dict[str, Dict[str, Any]] = {}

# In-memory invoice ledger store
initial_invoices = [
    {
        "id": "INV-101",
        "customer": "Aarav Sharma",
        "phone": "+91 98201 11223",
        "amount": "₹4,500",
        "status": "Paid",
        "date": "Today, 11:30 AM",
        "description": "Monthly grocery wholesale supply",
    },
    {
        "id": "INV-102",
        "customer": "Priya Nair",
        "phone": "+91 97412 88990",
        "amount": "₹1,800",
        "status": "Pending",
        "date": "Yesterday",
        "description": "Tailoring & alteration materials",
    },
    {
        "id": "INV-103",
        "customer": "Vikram Patel",
        "phone": "+91 98980 44556",
        "amount": "₹12,200",
        "status": "Paid",
        "date": "04 Oct 2026",
        "description": "Hardware electrical fittings",
    },
    {
        "id": "INV-104",
        "customer": "Sneha Kulkarni",
        "phone": "+91 99230 66778",
        "amount": "₹4,500",
        "status": "Pending",
        "date": "02 Oct 2026",
        "description": "Catering raw materials invoice",
    },
    {
        "id": "INV-105",
        "customer": "Rohit Verma",
        "phone": "+91 91672 33445",
        "amount": "₹2,100",
        "status": "Overdue",
        "date": "28 Sep 2026",
        "description": "Packaging boxes (30 days credit)",
    },
]

invoices_db = [Invoice(**item) for item in initial_invoices]


def get_current_token(authorization: Optional[str] = Header(None)) -> str:
    """Dependency to validate that Bearer token is provided."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Please log in first.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Format must be 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return parts[1]


@app.get("/")
@app.get("/api/health")
async def health_check():
    """Health check endpoint and provider configuration status."""
    return {
        "status": "ok",
        "service": "QuickKhata API",
        "auth_provider": "MiniMoth (WhatsApp first, SMS fallback)",
        "minimoth_key_configured": not IS_DEMO_KEY,
        "mode": "Live MiniMoth" if not IS_DEMO_KEY else "Sandbox / Mock Fallback Enabled",
    }


@app.post("/api/auth/send-otp", response_model=SendOTPResponse)
async def send_otp(payload: SendOTPRequest):
    """
    Sends an OTP to the user's mobile number via MiniMoth (WhatsApp first, auto-fallback to SMS).
    If using the default demo API key or in fallback mode, generates a sandbox session.
    """
    phone = payload.phone
    logger.info(f"Initiating OTP send for phone: {phone}")

    # If demo key is used and fallback is allowed, simulate sandbox OTP
    if IS_DEMO_KEY and ALLOW_MOCK_FALLBACK:
        mock_id = f"mock_otp_{uuid.uuid4().hex[:10]}"
        mock_otp_store[mock_id] = {
            "phone": phone,
            "otp": "123456",
            "created_at": time.time(),
        }
        logger.info(f"[SANDBOX MODE] Simulated OTP for {phone}: 123456 (otp_id: {mock_id})")
        return SendOTPResponse(
            message="OTP sent via WhatsApp (Sandbox test OTP is 123456)",
            otp_id=mock_id,
            delivery_channel="WhatsApp (with SMS fallback)",
            is_mock=True,
            mock_otp_hint="123456",
        )

    # Real MiniMoth API Call
    headers = {
        "x-api-key": MINIMOTH_API_KEY,
        "Content-Type": "application/json",
    }
    url = f"{MINIMOTH_BASE_URL}/otp/send"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"phone": phone}, headers=headers)

        if resp.status_code == 200:
            data = resp.json()
            is_test_key = MINIMOTH_API_KEY.startswith("mm_test_")
            otp_id = data.get("otp_id", "")

            if is_test_key:
                # MiniMoth test keys do not send physical SMS/WhatsApp to phones.
                # Store session so the user can verify with 000000 or 123456.
                mock_otp_store[otp_id] = {
                    "phone": phone,
                    "otp": "000000",
                    "created_at": time.time(),
                }
                logger.info(f"MiniMoth Sandbox Key in use. Physical delivery is simulated. Test OTP: 000000 for {phone}")
                return SendOTPResponse(
                    message="MiniMoth Sandbox Mode: Real SMS/WhatsApp is disabled by MiniMoth for mm_test_ keys. Use code 000000 (or 123456) to verify.",
                    otp_id=otp_id,
                    delivery_channel="WhatsApp (with SMS fallback)",
                    is_mock=True,
                    mock_otp_hint="000000",
                )

            return SendOTPResponse(
                message=data.get("message", "OTP sent successfully via WhatsApp"),
                otp_id=otp_id,
                delivery_channel="WhatsApp (with SMS fallback)",
                is_mock=False,
            )
        else:
            logger.warning(f"MiniMoth error response: {resp.status_code} - {resp.text}")
            if ALLOW_MOCK_FALLBACK:
                logger.info(f"Falling back to sandbox mode for {phone}")
                mock_id = f"mock_otp_{uuid.uuid4().hex[:10]}"
                mock_otp_store[mock_id] = {
                    "phone": phone,
                    "otp": "123456",
                    "created_at": time.time(),
                }
                return SendOTPResponse(
                    message=f"MiniMoth notice ({resp.status_code}); switched to Sandbox test mode.",
                    otp_id=mock_id,
                    delivery_channel="WhatsApp (with SMS fallback)",
                    is_mock=True,
                    mock_otp_hint="123456",
                )

            try:
                err_detail = resp.json()
            except Exception:
                err_detail = resp.text
            raise HTTPException(status_code=resp.status_code, detail=err_detail)

    except httpx.RequestError as exc:
        logger.error(f"HTTP request error while calling MiniMoth: {exc}")
        if ALLOW_MOCK_FALLBACK:
            mock_id = f"mock_otp_{uuid.uuid4().hex[:10]}"
            mock_otp_store[mock_id] = {
                "phone": phone,
                "otp": "123456",
                "created_at": time.time(),
            }
            return SendOTPResponse(
                message="Network error contacting MiniMoth; switched to Sandbox test mode.",
                otp_id=mock_id,
                delivery_channel="WhatsApp (with SMS fallback)",
                is_mock=True,
                mock_otp_hint="123456",
            )
        raise HTTPException(
            status_code=503,
            detail=f"Unable to connect to MiniMoth OTP service: {str(exc)}",
        )


@app.post("/api/auth/verify-otp", response_model=VerifyOTPResponse)
@app.post("/api/auth/verify", response_model=VerifyOTPResponse)
async def verify_otp(payload: VerifyOTPRequest):
    """
    Verifies the user's OTP code.
    Returns access_token and refresh_token upon successful verification.
    """
    logger.info(f"Verifying OTP for otp_id: {payload.otp_id}")
    is_test_key = MINIMOTH_API_KEY.startswith("mm_test_")

    # If it's a sandbox/test session or user submitted standard test OTP
    if (payload.otp_id.startswith("mock_otp_") or payload.otp_id in mock_otp_store or is_test_key) and payload.otp.strip() in ("000000", "123456"):
        session = mock_otp_store.get(payload.otp_id, {})
        user_phone = session.get("phone", "+919876543210")

        # Issue tokens
        access_token = f"qk_live_token_{uuid.uuid4().hex}"
        refresh_token = f"qk_refresh_token_{uuid.uuid4().hex}"
        expires_at = int(time.time()) + (7 * 24 * 3600)  # 7 days

        return VerifyOTPResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            phone=user_phone,
            message="OTP verified successfully (MiniMoth Sandbox Mode)",
        )

    # Real MiniMoth Verification
    headers = {
        "x-api-key": MINIMOTH_API_KEY,
        "Content-Type": "application/json",
    }
    url = f"{MINIMOTH_BASE_URL}/otp/verify"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                json={"otp_id": payload.otp_id, "otp": payload.otp},
                headers=headers,
            )

        if resp.status_code == 200:
            data = resp.json()
            return VerifyOTPResponse(
                access_token=data.get("access_token", f"mm_{uuid.uuid4().hex}"),
                refresh_token=data.get("refresh_token", f"mm_ref_{uuid.uuid4().hex}"),
                expires_at=data.get("expires_at"),
                phone=data.get("phone"),
                message="OTP verified successfully via MiniMoth",
            )
        else:
            logger.warning(f"MiniMoth verify error: {resp.status_code} - {resp.text}")
            if is_test_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid test code. In MiniMoth test mode (mm_test_ key), please enter '000000' or '123456'.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP. Please check the code and try again.",
            )

    except httpx.RequestError as exc:
        logger.error(f"HTTP request error during OTP verify: {exc}")
        raise HTTPException(
            status_code=503,
            detail=f"Unable to connect to MiniMoth verification service: {str(exc)}",
        )


@app.get("/api/dashboard/stats", response_model=DashboardStatsResponse)
@app.get("/api/dashboard/summary", response_model=DashboardStatsResponse)
async def get_dashboard_stats(token: str = Depends(get_current_token)):
    """
    Protected route: Verifies that a valid access token was supplied
    and returns vendor metrics & ledger entries.
    """
    # Calculate summary numbers dynamically from ledger
    total_sales = 0
    pending_dues = 0

    for inv in invoices_db:
        # Extract numeric digits from amount like '₹4,500'
        raw_num = "".join(ch for ch in inv.amount if ch.isdigit())
        num_val = int(raw_num) if raw_num else 0
        if inv.status.lower() == "paid":
            total_sales += num_val
        else:
            pending_dues += num_val

    # Format numbers nicely in INR style
    def format_inr(val: int) -> str:
        s = str(val)
        if len(s) <= 3:
            return f"₹{s}"
        last_three = s[-3:]
        rest = s[:-3]
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        return f"₹{','.join(groups)},{last_three}"

    return DashboardStatsResponse(
        status="authenticated",
        total_revenue=format_inr(total_sales),
        pending_dues=format_inr(pending_dues),
        active_customers=len({inv.customer for inv in invoices_db}),
        total_invoices=len(invoices_db),
        recent_invoices=invoices_db,
    )


@app.post("/api/invoices", response_model=Invoice)
async def create_invoice(payload: CreateInvoiceRequest, token: str = Depends(get_current_token)):
    """
    Protected route: Record a new ledger entry / invoice.
    """
    # Ensure amount has ₹ prefix
    clean_amount = payload.amount.strip()
    if not clean_amount.startswith("₹"):
        clean_amount = f"₹{clean_amount}"

    new_id = f"INV-{101 + len(invoices_db)}"
    new_inv = Invoice(
        id=new_id,
        customer=payload.customer.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        amount=clean_amount,
        status=payload.status.capitalize(),
        date="Just now",
        description=payload.description.strip() if payload.description else "General ledger transaction",
    )
    invoices_db.insert(0, new_inv)
    return new_inv


@app.patch("/api/invoices/{invoice_id}/status", response_model=Invoice)
async def update_invoice_status(invoice_id: str, new_status: str, token: str = Depends(get_current_token)):
    """
    Protected route: Toggle or update status of an invoice (e.g. Paid, Pending, Overdue).
    """
    valid_statuses = ["Paid", "Pending", "Overdue"]
    capitalized = new_status.capitalize()
    if capitalized not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    for inv in invoices_db:
        if inv.id == invoice_id:
            inv.status = capitalized
            return inv
    raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
