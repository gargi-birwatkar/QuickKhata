import React, { useState } from 'react';
import { Phone, ArrowRight, ShieldCheck, Loader2, Sparkles, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function LoginCard({ onOtpSent, isLoading, error, setError }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const raw = phoneNumber.replace(/\D/g, '');
    if (!raw || raw.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = `${countryCode}${raw}`;
    onOtpSent(fullPhone);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/25 mb-4">
          <span className="text-3xl">📒</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          QuickKhata
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The passwordless daily ledger for local vendors & freelancers
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold w-fit mb-6">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>MiniMoth WhatsApp OTP Delivery</span>
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          Sign In with Mobile
        </h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          No passwords to remember. We'll send a secure one-time verification code directly to your WhatsApp or SMS.
        </p>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 animate-shake">
            <span className="font-bold text-sm leading-none">!</span>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="flex rounded-xl shadow-sm border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all overflow-hidden bg-slate-50/50">
              <span className="inline-flex items-center px-3.5 bg-slate-100/80 border-r border-slate-300 text-slate-700 text-sm font-semibold select-none">
                🇮🇳 {countryCode}
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter 10-digit number"
                maxLength={10}
                autoFocus
                className="block w-full px-4 py-3 text-slate-900 text-base font-medium placeholder-slate-400 bg-transparent focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Enter your 10-digit registered WhatsApp mobile number
            </p>
          </div>


          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-white font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-lg shadow-emerald-600/25 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending OTP via MiniMoth...</span>
              </>
            ) : (
              <>
                <span>Send WhatsApp OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Feature Badges */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 text-left">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <span className="text-[11px] text-slate-600 font-medium leading-tight">
              Instant WhatsApp priority delivery
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <span className="text-[11px] text-slate-600 font-medium leading-tight">
              Automatic SMS failover & zero passwords
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center mt-6 text-xs text-slate-400">
        Secured by <a href="https://minimoth.dev" target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline">MiniMoth OTP Authentication</a>
      </div>
    </div>
  );
}
