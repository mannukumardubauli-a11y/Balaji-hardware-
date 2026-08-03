import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Receipt, 
  Coins, 
  AlertOctagon, 
  PlusCircle, 
  BookOpenCheck, 
  Boxes, 
  ArrowRight, 
  Eye, 
  Printer, 
  Wrench,
  Clock,
  UserCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  X,
  Phone,
  User
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { CountUpNumber } from '../components/CountUpNumber';
import { Bill } from '../types';

interface DashboardPageProps {
  setActiveTab: (tab: any) => void;
  onSelectBillForPreview: (bill: Bill) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  setActiveTab, 
  onSelectBillForPreview 
}) => {
  const { todaySalesSummary, bills, lowStockItems, settings } = useShop();
  const { role } = useAuth();
  const sliderRef = useRef<HTMLDivElement>(null);

  const [isInvoiceSearchOpen, setIsInvoiceSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const recentBills = bills.slice(0, 5);

  const filteredInvoices = bills.filter((bill) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const bNum = (bill.billNumber || '').toLowerCase();
    const cName = (bill.customerName || '').toLowerCase();
    const cPhone = (bill.customerPhone || '').toLowerCase();
    const bId = (bill.id || '').toLowerCase();

    return bNum.includes(query) || cName.includes(query) || cPhone.includes(query) || bId.includes(query);
  });

  const functionModules = [
    {
      id: 'billing',
      title: 'POS Billing',
      subtitle: 'पीओएस बिलिंग / Invoice',
      icon: Receipt,
      color: 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/30 hover:border-[#FF6B00]',
      badge: 'Fast Billing'
    },
    {
      id: 'view-invoices',
      title: 'View Invoices',
      subtitle: 'इन्वॉइस खोजें / Search',
      icon: Search,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:border-indigo-500',
      badge: 'Search Bill'
    },
    {
      id: 'udhaar',
      title: 'Udhaar Ledger',
      subtitle: 'उधार खाता / Credit',
      icon: BookOpenCheck,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-500',
      badge: 'Jama Khata'
    },
    {
      id: 'returns',
      title: 'Sales Return',
      subtitle: 'बिक्री वापसी / Refund',
      icon: RotateCcw,
      color: 'bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-500',
      badge: 'Return Bill'
    },
    {
      id: 'inventory',
      title: 'Inventory & Racks',
      subtitle: 'स्टॉक रैक & प्राइजिंग',
      icon: Boxes,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:border-blue-500',
      badge: 'Stock Count'
    },
    {
      id: 'alerts',
      title: 'Low Stock Alerts',
      subtitle: 'कम स्टॉक रीऑर्डर',
      icon: AlertOctagon,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:border-amber-500',
      badge: `${todaySalesSummary.lowStockCount} Low`
    },
    {
      id: 'reports',
      title: 'Sales Reports',
      subtitle: 'दैनिक बिक्री & मुनाफ़ा',
      icon: TrendingUp,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:border-purple-500',
      badge: 'Daily Profit'
    },
    {
      id: 'suppliers',
      title: 'Suppliers List',
      subtitle: 'थोक सप्लायर संपर्क',
      icon: UserCheck,
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:border-cyan-500',
      badge: 'Distributors'
    },
    {
      id: 'settings',
      title: 'Shop Settings',
      subtitle: 'QR, नाम & प्रिंटर',
      icon: Wrench,
      color: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-zinc-500',
      badge: 'Config'
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Section: Quick Navigation & Functions (4 boxes per row on desktop) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                {role === 'Owner' ? 'Owner Portal' : 'Counter Staff'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide">
              Quick Navigation & Functions
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Directly switch to any shop module
            </p>
          </div>

          <button
            onClick={() => setActiveTab('billing')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#FF6B00]/20 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            + New Bill Invoice
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3.5 pt-1">
          {functionModules.map((item) => {
            const IconComponent = item.icon;
            return (
              <motion.button
                key={item.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (item.id === 'view-invoices') {
                    setIsInvoiceSearchOpen(true);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className="flex flex-col justify-between p-2.5 sm:p-3.5 bg-white dark:bg-[#202224] hover:bg-slate-50 dark:hover:bg-[#282a2c] border border-slate-200 dark:border-zinc-800 hover:border-[#FF6B00]/50 rounded-xl sm:rounded-2xl transition-all text-left group shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden h-26 sm:h-30 md:h-32"
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border ${item.color} group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60 shrink-0">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#FF6B00] transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {role === 'Owner' ? (
              <CountUpNumber value={todaySalesSummary.totalRevenue} prefix="₹" decimals={0} />
            ) : (
              <span className="text-zinc-500 text-lg font-bold">🔒 Owner Only</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
            <span>Net sales today</span>
            {todaySalesSummary.todayReturnsAmount > 0 && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                -₹{todaySalesSummary.todayReturnsAmount.toLocaleString('en-IN')} returned
              </span>
            )}
          </p>
        </motion.div>

        {/* Bills Count */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Invoices Generated</span>
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            <CountUpNumber value={todaySalesSummary.billsCount} decimals={0} />
          </div>
          <p className="text-xs text-zinc-400 mt-2">Completed customer transactions</p>
        </motion.div>

        {/* Estimated Profit */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estimated Profit</span>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {role === 'Owner' ? (
              <CountUpNumber value={todaySalesSummary.estimatedProfit} prefix="₹" decimals={0} />
            ) : (
              <span className="text-zinc-500 text-lg font-bold">🔒 Owner Only</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-2">Selling price vs purchase cost margin</p>
        </motion.div>

        {/* Low Stock Alerts */}
        {role === 'Owner' ? (
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => setActiveTab('alerts')}
            className="bg-zinc-900 border border-amber-500/30 p-5 rounded-2xl shadow-lg cursor-pointer group hover:border-amber-500 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Low Stock Items</span>
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400 flex items-center justify-between">
              <span>{todaySalesSummary.lowStockCount}</span>
              <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-zinc-400 mt-2">Items requiring stock reorder</p>
          </motion.div>
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Low Stock Alerts</span>
              <div className="p-2.5 bg-zinc-800 text-zinc-500 rounded-xl">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-lg font-bold text-zinc-500">🔒 Owner Only</div>
            <p className="text-xs text-zinc-500 mt-2">Restricted for helper role</p>
          </div>
        )}
      </div>

      {/* Main Grid: Recent Bills & Low Stock Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Column */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-white">Recent Sales Invoices</h3>
              <p className="text-xs text-zinc-400">Latest completed shop transactions</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-[#FF6B00] hover:underline flex items-center gap-1"
            >
              View Reports <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentBills.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
              <Receipt className="w-12 h-12 text-zinc-600 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium text-zinc-300">No bills generated today yet</p>
              <p className="text-xs text-zinc-500 mt-1">Open POS Billing counter to process customer orders.</p>
              <button
                onClick={() => setActiveTab('billing')}
                className="mt-4 px-4 py-2 bg-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-md"
              >
                Start Billing
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {recentBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3 sm:p-3.5 bg-[#202224] hover:bg-[#282a2c] border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all shadow-sm space-y-2.5"
                >
                  {/* Top Row: Invoice #, Customer Name, Total Amount */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-1 bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 font-mono text-xs font-black rounded-lg shrink-0">
                        #{bill.billNumber.slice(-4)}
                      </span>
                      <span className="text-sm font-bold text-white truncate">
                        {bill.customerName || 'Cash Customer'}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-white font-mono tracking-tight">
                        ₹{bill.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Item count, Time, Payment Mode Badge & Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-xs font-semibold text-zinc-300">
                        {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {new Date(bill.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        bill.paymentMode === 'Udhaar'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : bill.paymentMode === 'UPI/Online'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {bill.paymentMode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onSelectBillForPreview(bill)}
                        className="p-1.5 sm:px-2.5 sm:py-1 bg-zinc-800 hover:bg-[#FF6B00] text-zinc-300 hover:text-white rounded-lg transition-all border border-zinc-700/80 text-xs font-semibold flex items-center gap-1 shadow-xs"
                        title="View/Print Invoice PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Print</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('returns')}
                        className="p-1.5 sm:px-2.5 sm:py-1 bg-zinc-800 hover:bg-red-500 text-zinc-300 hover:text-white rounded-lg transition-all border border-zinc-700/80 text-xs font-semibold flex items-center gap-1 shadow-xs"
                        title="Process Return for this Bill"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Return</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Warning Sidebar Widget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          {role === 'Owner' ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">Low Stock Items</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 font-bold rounded-full">
                    {lowStockItems.length}
                  </span>
                </div>

                {lowStockItems.length === 0 ? (
                  <div className="p-6 text-center text-zinc-400">
                    <p className="text-sm font-semibold text-emerald-400">All Items Well Stocked!</p>
                    <p className="text-xs text-zinc-500 mt-1">No products are below safety thresholds.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.name}</p>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{item.rackLocation}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.currentStock === 0
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {item.currentStock === 0 ? 'Out of Stock' : `${item.currentStock} ${item.unit}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveTab('alerts')}
                className="w-full mt-4 py-2.5 bg-zinc-800 hover:bg-amber-500 hover:text-black text-amber-400 font-bold text-xs rounded-xl transition-all border border-amber-500/30 flex items-center justify-center gap-2"
              >
                Manage All Stock Alerts & Supplier Reorder <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="p-6 text-center text-zinc-500 flex flex-col items-center justify-center h-full my-auto space-y-2 min-h-[220px]">
              <AlertOctagon className="w-10 h-10 text-zinc-600 mb-1" />
              <p className="text-sm font-bold text-zinc-400">Low Stock Reorder Alerts</p>
              <p className="text-xs text-zinc-500 max-w-xs">
                🔒 Low stock counts and reorder supplier lists are visible to Shop Owner only.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* View Invoices Instant Search Modal */}
      {isInvoiceSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#2B2D2F] border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Search & View Invoices</h3>
                  <p className="text-xs text-zinc-400">इन्वॉइस नंबर (उदा. 891689), ग्राहक का नाम या मोबाइल नंबर दर्ज करें</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsInvoiceSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Invoice No. (e.g. 891689), Name, or Mobile..."
                  autoFocus
                  className="w-full pl-11 pr-10 py-3 bg-[#202224] border border-zinc-700/80 focus:border-[#FF6B00] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sample Quick Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-zinc-500 font-semibold">Quick Search Bills:</span>
                {bills.length === 0 ? (
                  <span className="text-zinc-500 italic">No bills yet</span>
                ) : (
                  bills.slice(0, 4).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSearchQuery(b.billNumber.replace('INV-', ''))}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700/60 font-mono transition-all cursor-pointer text-[11px]"
                    >
                      #{b.billNumber.replace('INV-', '')}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Invoices List Results */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 no-scrollbar max-h-[60vh]">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 space-y-2">
                  <FileText className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm font-semibold text-zinc-300">No matching invoices found</p>
                  <p className="text-xs text-zinc-500">
                    "{searchQuery}" se koi bill nahi mila. Kripya invoice number, naam ya mobile check karein.
                  </p>
                </div>
              ) : (
                filteredInvoices.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-4 bg-[#202224] hover:bg-[#25282a] border border-zinc-800 rounded-xl transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30 px-2.5 py-0.5 rounded-lg">
                          {bill.billNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          bill.paymentMode === 'Cash' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : bill.paymentMode === 'UPI/Online'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {bill.paymentMode}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {new Date(bill.timestamp).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300">
                        <span className="font-bold text-white flex items-center gap-1 truncate">
                          <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          {bill.customerName || 'Cash Customer'}
                        </span>
                        {bill.customerPhone && (
                          <span className="text-zinc-400 flex items-center gap-1 font-mono">
                            <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            {bill.customerPhone}
                          </span>
                        )}
                      </div>

                      {/* Items Summary preview */}
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        Items: {(bill.items || []).map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0 gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold">Total Amount</span>
                        <span className="text-lg font-black text-white font-mono">
                          ₹{bill.total.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          onSelectBillForPreview(bill);
                          setIsInvoiceSearchOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-[#FF6B00]/20 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        View / Print
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
