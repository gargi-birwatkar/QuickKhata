import React from 'react';
import { BookOpen, LogOut, ShieldCheck, Phone, MessageSquare } from 'lucide-react';
import { SessionManager } from '../services/api';

export default function Navbar({ userPhone, onLogout }) {
  const deliveryChannel = SessionManager.getDeliveryChannel();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">QuickKhata</span>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Digital Ledger for Local Vendors & Freelancers</p>
          </div>
        </div>

        {/* User Status & Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* MiniMoth Auth Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium">MiniMoth OTP Auth</span>
          </div>

          {/* User Phone Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>{userPhone || SessionManager.getUserPhone() || 'Logged In'}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
            title="Sign out of QuickKhata"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
