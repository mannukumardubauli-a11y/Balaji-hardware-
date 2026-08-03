import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, 
  Search, 
  Plus, 
  Trash2, 
  Receipt, 
  User, 
  Phone, 
  Check, 
  AlertCircle, 
  Download, 
  Share2, 
  Boxes, 
  DollarSign, 
  ArrowLeftRight, 
  FileText,
  Calendar,
  X,
  CreditCard,
  Banknote,
  BookOpenCheck
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { SalesReturnRecord, SalesReturnItem, Bill, InventoryItem } from '../types';
import { downloadReturnPDF } from '../lib/pdfGenerator';

export const ReturnsPage: React.FC = () => {
  const { 
    bills, 
    items, 
    salesReturns, 
    processSalesReturn, 
    deleteSalesReturn, 
    settings, 
    addToast 
  } = useShop();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedReturnForDetail, setSelectedReturnForDetail] = useState<SalesReturnRecord | null>(null);

  // Form State for New Return
  const [returnSource, setReturnSource] = useState<'bill' | 'direct'>('bill');
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [billSearch, setBillSearch] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [refundMode, setRefundMode] = useState<'Cash' | 'UPI/Online' | 'Udhaar Credit'>('Cash');
  const [reason, setReason] = useState<string>('Defective Item');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Items to return list
  const [returnCart, setReturnCart] = useState<SalesReturnItem[]>([]);

  // Direct search state
  const [directItemSearch, setDirectItemSearch] = useState<string>('');

  // Summary Metrics
  const totalReturnsCount = salesReturns.length;
  const totalRefundAmount = salesReturns.reduce((sum, r) => sum + r.totalRefundAmount, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRefundAmount = salesReturns
    .filter((r) => new Date(r.timestamp) >= todayStart)
    .reduce((sum, r) => sum + r.totalRefundAmount, 0);

  // Filtered Bills for selector
  const matchingBills = bills.filter((b) => {
    if (!billSearch.trim()) return true;
    const q = billSearch.toLowerCase();
    return (
      b.billNumber.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q)
    );
  }).slice(0, 10);

  // Handle Select Bill
  const handleSelectBill = (bill: Bill) => {
    setSelectedBillId(bill.id);
    setCustomerName(bill.customerName || '');
    setCustomerPhone(bill.customerPhone || '');
    
    // Default: populate return cart with 0 return quantities from the bill
    const initialReturnCart: SalesReturnItem[] = bill.items.map((bi) => ({
      itemId: bi.itemId,
      name: bi.name,
      unit: bi.unit,
      quantity: 0,
      unitPrice: bi.unitPrice,
      totalRefund: 0
    }));

    setReturnCart(initialReturnCart);
  };

  // Update return quantity for a bill item
  const handleUpdateItemReturnQty = (itemId: string, qty: number, maxQty: number) => {
    const validQty = Math.max(0, Math.min(qty, maxQty));
    setReturnCart((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          return {
            ...item,
            quantity: validQty,
            totalRefund: validQty * item.unitPrice
          };
        }
        return item;
      })
    );
  };

  // Direct Inventory Item Add
  const handleAddDirectInventoryItem = (invItem: InventoryItem) => {
    const exists = returnCart.find((ci) => ci.itemId === invItem.id);
    if (exists) {
      handleUpdateItemReturnQty(invItem.id, exists.quantity + 1, 999);
    } else {
      setReturnCart((prev) => [
        ...prev,
        {
          itemId: invItem.id,
          name: invItem.name,
          unit: invItem.unit,
          quantity: 1,
          unitPrice: invItem.sellingPrice,
          totalRefund: invItem.sellingPrice
        }
      ]);
    }
    setDirectItemSearch('');
  };

  // Remove item from return cart
  const handleRemoveFromReturnCart = (itemId: string) => {
    setReturnCart((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  // Calculated Grand Total Refund
  const grandTotalRefund = returnCart.reduce((sum, item) => sum + item.totalRefund, 0);

  // Submit Return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeItems = returnCart.filter((item) => item.quantity > 0);

    if (activeItems.length === 0) {
      addToast('No Items Selected', 'Please select at least 1 item quantity to return.', 'warning');
      return;
    }

    if (!customerName.trim()) {
      addToast('Customer Name Required', 'Please enter customer name.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const selectedBill = bills.find((b) => b.id === selectedBillId);

    const result = await processSalesReturn({
      billId: selectedBillId,
      billNumber: selectedBill?.billNumber || '',
      customerName,
      customerPhone,
      returnedItems: activeItems,
      refundMode,
      reason
    });

    setIsSubmitting(false);

    if (result) {
      // Reset form & close modal
      setIsModalOpen(false);
      setSelectedBillId('');
      setCustomerName('');
      setCustomerPhone('');
      setReturnCart([]);
    }
  };

  // WhatsApp Share Helper
  const handleShareWhatsApp = (record: SalesReturnRecord) => {
    let msg = `*${settings.shopName || 'Sri Balaji Hardware'}*%0A`;
    msg += `*SALES RETURN MEMO #${record.returnNumber}*%0A`;
    msg += `Date: ${new Date(record.timestamp).toLocaleDateString('en-IN')}%0A`;
    msg += `Customer: ${record.customerName}%0A%0A`;
    msg += `*Returned Items:*%0A`;

    record.items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.name} x ${item.quantity} ${item.unit} = ₹${item.totalRefund}%0A`;
    });

    msg += `%0A*Total Refund:* ₹${record.totalRefundAmount}%0A`;
    msg += `*Refund Mode:* ${record.refundMode}%0A`;
    msg += `Reason: ${record.reason}%0A%0A`;
    msg += `Items restocked into inventory. Thank you!`;

    const phone = record.customerPhone ? record.customerPhone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  // Filtered Returns List
  const filteredReturns = salesReturns.filter((r) => {
    const matchesFilter = filterMode === 'All' || r.refundMode === filterMode;
    if (!matchesFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.returnNumber.toLowerCase().includes(q) ||
      (r.billNumber && r.billNumber.toLowerCase().includes(q)) ||
      r.customerName.toLowerCase().includes(q) ||
      (r.customerPhone && r.customerPhone.includes(q)) ||
      r.items.some((i) => i.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#2B2D2F] border border-zinc-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#FF6B00]/20 text-[#FF6B00]">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Sales Returns & Refunds
              </h1>
              <p className="text-xs text-zinc-400">
                Process customer returns, auto-restock inventory, issue refunds or credit Udhaar ledger
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setReturnCart([]);
            setSelectedBillId('');
            setCustomerName('');
            setCustomerPhone('');
            setIsModalOpen(true);
          }}
          className="px-5 py-3 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FF6B00]/30 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" /> Process New Return
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#2B2D2F] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Total Returns</p>
            <p className="text-2xl font-black text-white font-mono mt-0.5">{totalReturnsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#2B2D2F] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Today's Refunds</p>
            <p className="text-2xl font-black text-red-400 font-mono mt-0.5">₹{todayRefundAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#2B2D2F] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Total Refunds Issued</p>
            <p className="text-2xl font-black text-[#FF6B00] font-mono mt-0.5">₹{totalRefundAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#2B2D2F] border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search return #, bill #, customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#202224] border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B00]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Refund Mode Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'Cash', 'UPI/Online', 'Udhaar Credit'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterMode === mode
                  ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/30'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Returns History List */}
      {filteredReturns.length === 0 ? (
        <div className="bg-[#2B2D2F] border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Sales Returns Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchQuery || filterMode !== 'All'
              ? 'No returns match your current filter search. Try resetting filters.'
              : 'When customers return products, click "Process New Return" to log the return and restock inventory.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {filteredReturns.map((record) => (
            <div
              key={record.id}
              className="bg-[#202224] border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 sm:p-3.5 transition-all shadow-sm space-y-2"
            >
              {/* Header: Return #, Customer info, Amount & Payment Mode */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 font-mono text-[11px] font-black rounded-md shrink-0">
                    #{record.returnNumber}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                      <span>{record.customerName}</span>
                      {record.customerPhone && (
                        <span className="text-[11px] font-normal text-zinc-400">({record.customerPhone})</span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm sm:text-base font-black text-red-400 font-mono tracking-tight">
                    ₹{record.totalRefundAmount.toLocaleString('en-IN')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    record.refundMode === 'Cash'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : record.refundMode === 'UPI/Online'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  }`}>
                    {record.refundMode}
                  </span>
                </div>
              </div>

              {/* Sub-line: Date, Time, Original Bill Ref */}
              <div className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
                <span>{new Date(record.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                {record.billNumber && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-300 font-mono">Bill #: {record.billNumber}</span>
                  </>
                )}
              </div>

              {/* Returned Items List */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <Boxes className="w-3 h-3 text-[#FF6B00]" /> Restocked:
                </span>
                {record.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-2 py-0.5 bg-[#2B2D2F] border border-zinc-700/70 rounded-md text-[11px] text-zinc-200 flex items-center gap-1"
                  >
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-red-400 font-mono font-bold">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="text-zinc-400 text-[10px]">(@ ₹{item.unitPrice})</span>
                  </div>
                ))}
              </div>

              {/* Footer: Reason & Compact Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/80">
                <div className="text-[11px] text-zinc-400 truncate max-w-[150px] sm:max-w-xs">
                  <span className="font-medium text-zinc-400">Reason:</span> <span className="text-zinc-300">{record.reason || 'Not specified'}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleShareWhatsApp(record)}
                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
                    title="Share Return Slip on WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    onClick={() => downloadReturnPDF(record, settings)}
                    className="px-2.5 py-1 bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30 text-[#FF6B00] border border-[#FF6B00]/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
                    title="Download Return Slip PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">PDF Slip</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete return record #${record.returnNumber}?`)) {
                        deleteSalesReturn(record.id);
                      }
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW RETURN MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2B2D2F] border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 text-white shadow-2xl my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-700/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#FF6B00]/20 text-[#FF6B00]">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Process Sales Return</h2>
                    <p className="text-xs text-zinc-400">Select returned items to automatically restock inventory</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-5">
                {/* Return Method Toggle */}
                <div className="flex gap-2 p-1 bg-[#202224] rounded-xl border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setReturnSource('bill')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      returnSource === 'bill'
                        ? 'bg-[#FF6B00] text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    1. Select From Previous Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnSource('direct')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      returnSource === 'direct'
                        ? 'bg-[#FF6B00] text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    2. Direct Product Return
                  </button>
                </div>

                {/* Option 1: Select Bill */}
                {returnSource === 'bill' && (
                  <div className="space-y-3 bg-[#202224] p-4 rounded-xl border border-zinc-700/80">
                    <label className="text-xs font-bold text-zinc-300 block">
                      Search & Select Invoice / Bill:
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search by Bill #, customer name, phone..."
                        value={billSearch}
                        onChange={(e) => setBillSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>

                    {/* Bill Selector List */}
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {matchingBills.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => handleSelectBill(b)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            selectedBillId === b.id
                              ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-white'
                              : 'bg-[#2B2D2F] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-white flex items-center gap-2">
                              <span>#{b.billNumber}</span>
                              <span className="text-zinc-400">• {b.customerName}</span>
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {new Date(b.timestamp).toLocaleDateString('en-IN')} • {b.items.length} items • ₹{b.total}
                            </p>
                          </div>
                          {selectedBillId === b.id && (
                            <span className="p-1 rounded-full bg-[#FF6B00] text-white">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Option 2: Direct Search Inventory */}
                {returnSource === 'direct' && (
                  <div className="space-y-3 bg-[#202224] p-4 rounded-xl border border-zinc-700/80">
                    <label className="text-xs font-bold text-zinc-300 block">
                      Search Inventory Item to Return:
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Type pipe, paint, tape, fitting..."
                        value={directItemSearch}
                        onChange={(e) => setDirectItemSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>

                    {directItemSearch.trim() && (
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {items
                          .filter((i) => i.name.toLowerCase().includes(directItemSearch.toLowerCase()))
                          .slice(0, 8)
                          .map((inv) => (
                            <div
                              key={inv.id}
                              onClick={() => handleAddDirectInventoryItem(inv)}
                              className="p-2.5 rounded-xl bg-[#2B2D2F] border border-zinc-800 hover:border-[#FF6B00] cursor-pointer transition-all flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-white">{inv.name}</p>
                                <p className="text-[10px] text-zinc-400">Stock: {inv.currentStock} {inv.unit} • ₹{inv.sellingPrice}</p>
                              </div>
                              <span className="px-2 py-1 bg-[#FF6B00] text-white text-[10px] font-bold rounded-lg flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Customer Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#202224] border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#202224] border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                  </div>
                </div>

                {/* Return Items Quantities Table */}
                {returnCart.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider block">
                      Returned Items & Quantities:
                    </label>

                    <div className="border border-zinc-700 rounded-xl overflow-hidden bg-[#202224]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#1A1C1E] text-zinc-400 font-bold border-b border-zinc-700">
                          <tr>
                            <th className="py-2.5 px-3">Item Description</th>
                            <th className="py-2.5 px-3 text-center">Unit Price</th>
                            <th className="py-2.5 px-3 text-center">Return Qty</th>
                            <th className="py-2.5 px-3 text-right">Refund Total</th>
                            <th className="py-2.5 px-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/80">
                          {returnCart.map((cartItem) => (
                            <tr key={cartItem.itemId} className="hover:bg-zinc-800/40">
                              <td className="py-2.5 px-3 font-semibold text-white">
                                {cartItem.name}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-zinc-300">
                                ₹{cartItem.unitPrice}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-[#2B2D2F] border border-zinc-700 rounded-lg p-1">
                                  <input
                                    type="number"
                                    min="0"
                                    value={cartItem.quantity}
                                    onChange={(e) => handleUpdateItemReturnQty(cartItem.itemId, Number(e.target.value) || 0, 999)}
                                    className="w-14 text-center bg-transparent font-bold font-mono text-white text-xs focus:outline-none"
                                  />
                                  <span className="text-[10px] text-zinc-400 pr-1">{cartItem.unit}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold font-mono text-red-400">
                                ₹{cartItem.totalRefund.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromReturnCart(cartItem.itemId)}
                                  className="text-zinc-500 hover:text-red-400 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Refund Method & Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Refund Mode:
                    </label>
                    <select
                      value={refundMode}
                      onChange={(e) => setRefundMode(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#202224] border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                    >
                      <option value="Cash">Cash Refund</option>
                      <option value="UPI/Online">UPI / Online Refund</option>
                      <option value="Udhaar Credit">Udhaar Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Return Reason:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Defective / Wrong Size / Excess bought"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 bg-[#202224] border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>

                {/* Grand Refund Amount Banner & Submit */}
                <div className="pt-3 border-t border-zinc-700/80 space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <span className="text-sm font-bold text-white">Total Refund Amount:</span>
                    <span className="text-xl font-black text-red-400 font-mono">
                      ₹{grandTotalRefund.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || grandTotalRefund === 0}
                    className="w-full py-3 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FF6B00]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Restocking Inventory & Recording Return...</span>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" /> Confirm Return & Restock Stock
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
