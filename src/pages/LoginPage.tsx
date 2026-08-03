import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, UserCheck, KeyRound, User, Lock, Eye, EyeOff, ArrowRight, Store, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { HanumanLogo } from '../components/HanumanLogo';

export const LoginPage: React.FC = () => {
  const { loginWithCredentials, lockoutRemainingSec } = useAuth();
  const { settings } = useShop();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (lockoutRemainingSec > 0) {
      setErrorMsg(`Terminal locked! Try again in ${lockoutRemainingSec}s.`);
      return;
    }

    if (!userId.trim()) {
      setErrorMsg('Please enter User ID');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter Password');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithCredentials(userId, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || 'Invalid User ID or Password.');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-[#FF6B00] selection:text-white">
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#2B2D2F] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Shop Branding Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 relative">
            <HanumanLogo size={58} logoUrl={settings.logoUrl} className="border-[#FF6B00] shadow-xl shadow-orange-950/40" />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full text-zinc-950 border-2 border-zinc-900">
              <Store className="w-3 h-3 stroke-[2.5]" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
            {settings.shopName || 'Sri Balaji Hardware and Paint Store'}
          </h1>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            POS Billing & Inventory Management System
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit Encrypted Row Level Security (RLS)</span>
          </div>
        </div>

        {/* Lockout Warning Banner */}
        {lockoutRemainingSec > 0 && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center gap-2 text-xs text-red-300 font-bold animate-pulse">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <span>🔒 Security Lockout Active: {lockoutRemainingSec}s remaining</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* User ID Field */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
              User ID / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4.5 h-4.5 text-zinc-400" />
              </div>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={lockoutRemainingSec > 0}
                placeholder="Enter User ID"
                className="w-full pl-10 pr-4 py-3 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all disabled:opacity-50"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4.5 h-4.5 text-zinc-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={lockoutRemainingSec > 0}
                placeholder="Enter Password"
                className="w-full pl-10 pr-11 py-3 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={isLoading || lockoutRemainingSec > 0}
            className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#e05e00] active:scale-[0.99] text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5 text-center">
            🔑 Default Login Credentials (1-Tap Auto Fill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setUserId('balaji274302');
                setPassword('11224455');
              }}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin / Owner</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-mono truncate">
                ID: <strong className="text-zinc-200">balaji274302</strong>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono truncate">
                Pass: <strong className="text-zinc-200">11224455</strong>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setUserId('helpstore821');
                setPassword('balaji11224455@');
              }}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Helper / Staff</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 font-mono truncate">
                ID: <strong className="text-zinc-200">helpstore821</strong>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono truncate">
                Pass: <strong className="text-zinc-200">balaji11224...</strong>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer copyright note */}
      <div className="mt-6 text-center text-xs text-zinc-500 font-medium">
        Sri Balaji Hardware & Paint Store • Secure Multi-User Row Level Access Control
      </div>
    </div>
  );
};
