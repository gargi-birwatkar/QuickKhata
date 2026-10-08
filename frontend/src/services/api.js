/**
 * QuickKhata API Client for MiniMoth WhatsApp/SMS OTP Authentication & Protected Routes
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const SessionManager = {
  getAccessToken: () => localStorage.getItem('qk_access_token'),
  getRefreshToken: () => localStorage.getItem('qk_refresh_token'),
  getUserPhone: () => localStorage.getItem('qk_user_phone'),
  getDeliveryChannel: () => localStorage.getItem('qk_delivery_channel') || 'WhatsApp (with SMS fallback)',
  
  setSession: ({ access_token, refresh_token, phone, delivery_channel }) => {
    if (access_token) localStorage.setItem('qk_access_token', access_token);
    if (refresh_token) localStorage.setItem('qk_refresh_token', refresh_token);
    if (phone) localStorage.setItem('qk_user_phone', phone);
    if (delivery_channel) localStorage.setItem('qk_delivery_channel', delivery_channel);
  },
  
  clearSession: () => {
    localStorage.removeItem('qk_access_token');
    localStorage.removeItem('qk_refresh_token');
    localStorage.removeItem('qk_user_phone');
    localStorage.removeItem('qk_delivery_channel');
  },
  
  isAuthenticated: () => Boolean(localStorage.getItem('qk_access_token')),
};

export const api = {
  /**
   * Request OTP to be sent via WhatsApp with automatic SMS fallback
   * MiniMoth Endpoint: POST /v1/otp/send
   */
  async sendOtp(phone) {
    const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Failed to send OTP');
    }
    return data;
  },

  /**
   * Verify the 6-digit OTP code
   * MiniMoth Endpoint: POST /v1/otp/verify
   */
  async verifyOtp(otpId, otp) {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otp_id: otpId, otp }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Invalid or expired OTP');
    }
    return data;
  },

  /**
   * Fetch authenticated dashboard statistics and ledger records
   * Requires Bearer token
   */
  async getDashboardStats() {
    const token = SessionManager.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      SessionManager.clearSession();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to load dashboard data');
    }
    return data;
  },

  /**
   * Create a new invoice/transaction in the QuickKhata ledger
   */
  async createInvoice(payload) {
    const token = SessionManager.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to create invoice');
    }
    return data;
  },

  /**
   * Update invoice status (Paid / Pending / Overdue)
   */
  async updateInvoiceStatus(invoiceId, newStatus) {
    const token = SessionManager.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/status?new_status=${newStatus}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to update invoice');
    }
    return data;
  },
};
