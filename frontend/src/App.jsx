import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginCard from './components/LoginCard';
import OtpVerificationCard from './components/OtpVerificationCard';
import Dashboard from './components/Dashboard';
import { api, SessionManager } from './services/api';

export default function App() {
  const [step, setStep] = useState('login'); // 'login' | 'otp' | 'dashboard'
  const [phone, setPhone] = useState('');
  const [otpId, setOtpId] = useState('');
  const [mockOtpHint, setMockOtpHint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Check existing session on launch
  useEffect(() => {
    if (SessionManager.isAuthenticated()) {
      setStep('dashboard');
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (inputPhone) => {
    try {
      setIsLoading(true);
      setError('');
      setPhone(inputPhone);

      const res = await api.sendOtp(inputPhone);
      setOtpId(res.otp_id);
      if (res.mock_otp_hint) {
        setMockOtpHint(res.mock_otp_hint);
      }
      setStep('otp');
      showToast(res.message || 'OTP sent successfully!');
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (!phone) return;
    try {
      setIsLoading(true);
      setError('');
      const res = await api.sendOtp(phone);
      setOtpId(res.otp_id);
      if (res.mock_otp_hint) {
        setMockOtpHint(res.mock_otp_hint);
      }
      showToast('New OTP dispatched via WhatsApp & SMS!');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (otpCode) => {
    try {
      setIsLoading(true);
      setError('');

      const res = await api.verifyOtp(otpId, otpCode);
      SessionManager.setSession({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        phone: res.phone || phone,
        delivery_channel: 'WhatsApp (SMS fallback)',
      });

      setStep('dashboard');
      showToast('Signed in successfully! Welcome to QuickKhata.');
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Invalid or expired OTP. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    SessionManager.clearSession();
    setStep('login');
    setPhone('');
    setOtpId('');
    setMockOtpHint('');
    showToast('Signed out of QuickKhata.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-600 shadow-red-500/20' : 'bg-emerald-600 shadow-emerald-500/20'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* When on dashboard, show navigation bar */}
      {step === 'dashboard' ? (
        <>
          <Navbar userPhone={phone} onLogout={handleLogout} />
          <main className="flex-1">
            <Dashboard userPhone={phone} onLogout={handleLogout} />
          </main>
        </>
      ) : (
        /* Auth Screen (Login or OTP) */
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {step === 'login' && (
            <LoginCard
              onOtpSent={handleSendOtp}
              isLoading={isLoading}
              error={error}
              setError={setError}
            />
          )}

          {step === 'otp' && (
            <OtpVerificationCard
              phone={phone}
              otpId={otpId}
              mockOtpHint={mockOtpHint}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => {
                setError('');
                setStep('login');
              }}
              isLoading={isLoading}
              error={error}
              setError={setError}
            />
          )}
        </main>
      )}

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        QuickKhata &bull; Powered by <a href="https://minimoth.dev" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-medium">MiniMoth</a> OTP Authentication API
      </footer>
    </div>
  );
}
