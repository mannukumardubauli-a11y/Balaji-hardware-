import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar, TabType } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { BillPDFModal } from './components/BillPDFModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

import { DashboardPage } from './pages/DashboardPage';
import { BillingPage } from './pages/BillingPage';
import { InventoryPage } from './pages/InventoryPage';
import { LowStockAlertsPage } from './pages/LowStockAlertsPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { UdhaarLedgerPage } from './pages/UdhaarLedgerPage';
import { ReportsPage } from './pages/ReportsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { Bill } from './types';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedBillForPDF, setSelectedBillForPDF] = useState<Bill | null>(null);
  const { settings } = useShop();
  const { role, isLoggedIn } = useAuth();

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Initialize history state on mount so back button navigates in-app instead of exiting app
  React.useEffect(() => {
    if (isLoggedIn) {
      window.history.replaceState({ tab: 'dashboard' }, '');
    }
  }, [isLoggedIn]);

  // Handle browser & physical mobile Back button
  React.useEffect(() => {
    if (!isLoggedIn) return;

    const handlePopState = (e: PopStateEvent) => {
      // If PDF modal is currently open, back button closes the modal
      if (selectedBillForPDF) {
        setSelectedBillForPDF(null);
        return;
      }

      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab as TabType);
      } else {
        // Fallback to dashboard if popped to root history
        setActiveTab('dashboard');
        window.history.pushState({ tab: 'dashboard' }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn, selectedBillForPDF]);

  // Tab switch handler with browser history support
  const handleTabChange = (newTab: TabType) => {
    if (newTab !== activeTab) {
      window.history.pushState({ tab: newTab }, '');
      setActiveTab(newTab);
    }
  };

  // Open PDF modal with history state push
  const handleOpenBillPDF = (bill: Bill | null) => {
    if (bill) {
      window.history.pushState({ modal: 'pdf', billId: bill.id }, '');
      setSelectedBillForPDF(bill);
    } else {
      setSelectedBillForPDF(null);
    }
  };

  // Attempt portrait orientation lock
  React.useEffect(() => {
    try {
      if (window.screen && window.screen.orientation && 'lock' in window.screen.orientation) {
        (window.screen.orientation as any).lock('portrait').catch(() => {});
      }
    } catch (e) {}
  }, []);

  if (!isLoggedIn) {
    return (
      <>
        <PWAInstallPrompt />
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  const ALL_TABS: { id: TabType; ownerOnly?: boolean }[] = [
    { id: 'dashboard' },
    { id: 'billing' },
    { id: 'returns', ownerOnly: true },
    { id: 'inventory' },
    { id: 'alerts', ownerOnly: true },
    { id: 'udhaar', ownerOnly: true },
    { id: 'reports', ownerOnly: true },
    { id: 'suppliers', ownerOnly: true },
    { id: 'settings', ownerOnly: true },
  ];

  const availableTabs = ALL_TABS.filter(t => !t.ownerOnly || role === 'Owner').map(t => t.id);

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentIndex = availableTabs.indexOf(activeTab);
    if (currentIndex === -1) return;

    if (direction === 'left') {
      // Swiping left moves to the NEXT tab
      if (currentIndex < availableTabs.length - 1) {
        handleTabChange(availableTabs[currentIndex + 1]);
      }
    } else if (direction === 'right') {
      // Swiping right moves to the PREVIOUS tab
      if (currentIndex > 0) {
        handleTabChange(availableTabs[currentIndex - 1]);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;

    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;

    // Must be a predominantly horizontal swipe (>40px, fast enough <700ms)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2 && deltaTime < 700) {
      const target = e.target as HTMLElement;
      // Skip swipe tab change if initiated inside inputs, textareas, or inner scroll boxes
      if (
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('.no-scrollbar') ||
        target.closest('.overflow-x-auto')
      ) {
        return;
      }

      if (deltaX < 0) {
        handleSwipe('left');
      } else {
        handleSwipe('right');
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white w-full"
    >
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardPage
                setActiveTab={handleTabChange}
                onSelectBillForPreview={(bill) => handleOpenBillPDF(bill)}
              />
            )}

            {activeTab === 'billing' && (
              <BillingPage
                onBillCompleted={(bill) => handleOpenBillPDF(bill)}
              />
            )}

            {activeTab === 'inventory' && <InventoryPage />}

            {activeTab === 'alerts' && <LowStockAlertsPage />}

            {activeTab === 'returns' && <ReturnsPage />}

            {activeTab === 'udhaar' && <UdhaarLedgerPage />}

            {activeTab === 'reports' && <ReportsPage />}

            {activeTab === 'suppliers' && <SuppliersPage />}

            {activeTab === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bill PDF Invoice Modal */}
      <BillPDFModal
        bill={selectedBillForPDF}
        shopSettings={settings}
        onClose={() => setSelectedBillForPDF(null)}
      />

      {/* Floating Toasts Container */}
      <ToastContainer />

      {/* PWA Mobile App Install Banner & Guide */}
      <PWAInstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ShopProvider>
          <MainAppContent />
        </ShopProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
