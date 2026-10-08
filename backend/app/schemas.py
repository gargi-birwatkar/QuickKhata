from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import re

class SendOTPRequest(BaseModel):
    phone: str = Field(..., description="Mobile number with country code, e.g. +919876543210")

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        # Strip whitespace, hyphens, parentheses
        cleaned = re.sub(r"[\s\-\(\)]", "", v.strip())
        if not cleaned:
            raise ValueError("Phone number cannot be empty")
        # If user entered 10 digits without country code, prepend +91 for India
        if re.fullmatch(r"\d{10}", cleaned):
            cleaned = "+91" + cleaned
        elif not cleaned.startswith("+"):
            cleaned = "+" + cleaned
        if not re.fullmatch(r"\+\d{10,15}", cleaned):
            raise ValueError("Invalid phone format. Please enter a valid number with country code, e.g. +919876543210")
        return cleaned


class SendOTPResponse(BaseModel):
    message: str
    otp_id: str
    delivery_channel: Optional[str] = "WhatsApp (with SMS fallback)"
    is_mock: Optional[bool] = False
    mock_otp_hint: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    otp_id: str
    otp: str

    @field_validator("otp")
    @classmethod
    def clean_otp(cls, v: str) -> str:
        cleaned = v.strip()
        if not re.fullmatch(r"\d{4,8}", cleaned):
            raise ValueError("OTP must be 4 to 8 digits")
        return cleaned


class VerifyOTPResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: Optional[int] = None
    phone: Optional[str] = None
    message: Optional[str] = "Authentication successful"


class Invoice(BaseModel):
    id: str
    customer: str
    phone: Optional[str] = None
    amount: str
    status: str  # "Paid", "Pending", "Overdue"
    date: str
    description: Optional[str] = None


class CreateInvoiceRequest(BaseModel):
    customer: str
    amount: str
    status: str = "Pending"
    phone: Optional[str] = None
    description: Optional[str] = None


class DashboardStatsResponse(BaseModel):
    status: str = "authenticated"
    user_phone: Optional[str] = None
    total_revenue: str
    pending_dues: str
    active_customers: int
    total_invoices: int
    recent_invoices: List[Invoice]
