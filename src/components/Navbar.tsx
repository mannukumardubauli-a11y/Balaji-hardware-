import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Boxes, 
  AlertOctagon, 
  BookOpenCheck, 
  BarChart3, 
  Truck, 
  Settings, 
  ShieldCheck, 
  UserCheck, 
  Wifi, 
  WifiOff, 
  LogOut,
  RotateCcw,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { HanumanLogo } from './HanumanLogo';
import { SecurityAuditModal } from './SecurityAuditModal';

export type TabType = 
  | 'dashboard' 
  | 'billing' 
  | 'inventory' 
  | 'alerts' 
  | 'returns'
  | 'udhaar' 
  | 'reports' 
  | 'suppliers' 
  | 'settings';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { role, switchDemoRole, logout, profile } = useAuth();
  const { settings, lowStockItems, isOnline } = useShop();
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'POS Billing', icon: ShoppingCart },
    { id: 'returns', label: 'Sales Returns', icon: RotateCcw, ownerOnly: true },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { 
      id: 'alerts', 
      label: 'Low Stock', 
      icon: AlertOctagon, 
      badge: lowStockItems.length > 0 ? lowStockItems.length : null,
      ownerOnly: true
    },
    { id: 'udhaar', label: 'Udhaar Ledger', icon: BookOpenCheck, ownerOnly: true },
    { id: 'reports', label: 'Reports', icon: BarChart3, ownerOnly: true },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, ownerOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, ownerOnly: true }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#2B2D2F] border-b border-zinc-800 shadow-xl w-full max-w-full overflow-hidden">
        {/* Top Header Bar */}
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2 overflow-hidden">
          {/* Shop Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <HanumanLogo size={42} logoUrl={settings.logoUrl} className="sm:w-11 sm:h-11 border-[#FF6B00]" />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base md:text-lg font-bold text-white tracking-wide leading-tight break-words flex items-center gap-2">
                {settings.shopName || 'Sri Balaji Hardware and Paint Store'}
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/30">
                  <Shield className="w-3 h-3 text-[#FF6B00]" />
                  RLS Active
                </span>
              </h1>
              <p className="text-xs text-zinc-400 font-medium hidden sm:block">
                Digital POS & Inventory Engine
              </p>
            </div>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* RLS Security Audit Logs Trigger Button */}
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              title="Open Row-Level Security & Audit Logs"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Security Logs</span>
            </button>

            {/* Network Status Badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span>Offline Mode</span>
                </>
              )}
            </div>

            {/* Role Switcher Pill & Logout */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center bg-zinc-800 p-0.5 sm:p-1 rounded-xl border border-zinc-700/80">
                <button
                  onClick={() => switchDemoRole('Owner')}
                  title="Switch to Admin Mode"
                  className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                    role === 'Owner'
                      ? 'bg-[#FF6B00] text-white shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Admin</span>
                </button>

                <button
                  onClick={() => switchDemoRole('Helper')}
                  title="Switch to Helper Mode"
                  className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                    role === 'Helper'
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Helper</span>
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => logout()}
                title="Logout from Terminal"
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Tabs Navigation Row */}
        <div className="max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 overflow-hidden bg-[#242628]">
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 touch-pan-x">
            {navItems.map((tab) => {
              if (tab.ownerOnly && role !== 'Owner') return null;

              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                    isActive 
                      ? 'text-white bg-[#FF6B00]/20 border border-[#FF6B00]/50 shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF6B00]' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>

                  {/* Badge if present */}
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#FF6B00] text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}

                  {/* Sliding Active Tab Underline */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FF6B00] rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Security Audit Logs Modal */}
      <SecurityAuditModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </>
  );
};
