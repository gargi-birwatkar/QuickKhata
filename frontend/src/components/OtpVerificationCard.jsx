import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, RotateCw, Loader2, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

export default function OtpVerificationCard({
  phone,
  otpId,
  mockOtpHint,
  onVerify,
  onResend,
  onBack,
  isLoading,
  error,
  setError,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    setError('');
    // Handle paste of complete 6-digit string
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
        if (pasted.length === 6) {
          onVerify(pasted);
        }
        return;
      }
    }

    const clean = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    // Auto-advance to next box if filled
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are typed
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && clean) {
      onVerify(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setDigits(newDigits);
      if (pastedData.length === 6) {
        onVerify(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }
    onVerify(code);
  };

  const handleResendClick = () => {
    if (!canResend) return;
    setDigits(['', '', '', '', '', '']);
    setTimer(30);
    setCanResend(false);
    onResend();
    inputRefs.current[0]?.focus();
  };

  const fillMockOtp = () => {
    const code = mockOtpHint || '123456';
    const arr = code.split('');
    setDigits(arr);
    onVerify(code);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Change phone number</span>
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
          <KeyRound className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          Verify Security Code
        </h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          We sent a 6-digit one-time password to WhatsApp & SMS on{' '}
          <strong className="text-slate-800 font-semibold">{phone}</strong>.
        </p>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <span className="font-bold text-sm leading-none">!</span>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Sandbox Test Hint Banner */}
        {mockOtpHint && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-[11px] text-amber-900 font-medium">
                Sandbox Mode OTP: <strong className="font-mono text-amber-950 font-bold">{mockOtpHint}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={fillMockOtp}
              className="text-[11px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
            >
              Auto-fill
            </button>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* 6 Digit Inputs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
              Enter 6-Digit OTP
            </label>
            <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border transition-all outline-none ${
                    digit
                      ? 'border-emerald-600 bg-emerald-50/50 text-slate-900 shadow-sm'
                      : 'border-slate-300 bg-slate-50/30 text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading || digits.join('').length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-white font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-lg shadow-emerald-600/25 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying code with MiniMoth...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Resend and Countdown */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Didn't receive the OTP?</span>
          {canResend ? (
            <button
              onClick={handleResendClick}
              className="flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Resend OTP</span>
            </button>
          ) : (
            <span className="font-mono text-slate-400 font-medium">
              Resend in <span className="text-slate-700 font-bold">{timer}s</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
