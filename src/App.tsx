import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShopProvider, useShop } from './context/ShopContext';
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
        setActiveTab(availableTabs[currentIndex + 1]);
      }
    } else if (direction === 'right') {
      // Swiping right moves to the PREVIOUS tab
      if (currentIndex > 0) {
        setActiveTab(availableTabs[currentIndex - 1]);
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

    // Must be a predominantly horizontal swipe (>50px, fast enough <600ms)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4 && deltaTime < 600) {
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
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white max-w-full overflow-x-hidden touch-pan-y"
    >
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

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
                setActiveTab={setActiveTab}
                onSelectBillForPreview={(bill) => setSelectedBillForPDF(bill)}
              />
            )}

            {activeTab === 'billing' && (
              <BillingPage
                onBillCompleted={(bill) => setSelectedBillForPDF(bill)}
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
    <AuthProvider>
      <ShopProvider>
        <MainAppContent />
      </ShopProvider>
    </AuthProvider>
  );
}
