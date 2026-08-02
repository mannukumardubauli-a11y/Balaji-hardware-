import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpenCheck, 
  Search, 
  IndianRupee, 
  MessageSquare, 
  Phone, 
  Plus, 
  CheckCircle2, 
  Clock, 
  X, 
  User, 
  Receipt,
  FileText,
  Trash2
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { UdhaarRecord } from '../types';

export const UdhaarLedgerPage: React.FC = () => {
  const { udhaar, recordUdhaarPayment, deleteUdhaarRecord, settings, addToast } = useShop();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Partial' | 'Settled'>('Pending');

  // Delete State
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; name: string } | null>(null);

  // Record Payment Modal State
  const [selectedRecord, setSelectedRecord] = useState<UdhaarRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter Records
  const filteredUdhaar = udhaar.filter((record) => {
    const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      record.customerName.toLowerCase().includes(q) ||
      (record.customerPhone && record.customerPhone.includes(q));

    return matchesStatus && matchesQuery;
  });

  const totalOutstanding = udhaar
    .filter((u) => u.status !== 'Settled')
    .reduce((sum, u) => sum + u.totalOwed, 0);

  const handleOpenPaymentModal = (record: UdhaarRecord) => {
    setSelectedRecord(record);
    setPaymentAmount(record.totalOwed);
    setPaymentNotes('Cash Payment Received');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || paymentAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await recordUdhaarPayment(selectedRecord.id, paymentAmount, paymentNotes);
      setSelectedRecord(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminderWhatsApp = (record: UdhaarRecord) => {
    const message = 
      `*PAYMENT REMINDER - ${settings.shopName.toUpperCase()}*%0A%0A` +
      `Dear ${record.customerName},%0A` +
      `This is a gentle reminder regarding your pending credit account balance of *₹${record.totalOwed.toLocaleString('en-IN')}* at ${settings.shopName}.%0A%0A` +
      `Kindly arrange payment at your earliest convenience.%0A` +
      `Thank you!%0A` +
      `Contact: ${settings.phone}`;

    const phone = record.customerPhone ? record.customerPhone.replace(/[^0-9]/g, '') : '';
    const whatsappUrl = phone 
      ? `https://wa.me/91${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#2B2D2F] border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpenCheck className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-xl font-bold text-white">Customer Udhaar (Credit) Ledger</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Track customer credit debts, record payments received, and send instant WhatsApp reminders.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-700/80 p-4 rounded-xl text-right shrink-0">
          <span className="text-[11px] font-semibold text-zinc-400 block uppercase">Total Udhaar Owed</span>
          <span className="text-2xl font-black text-red-400 font-mono">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-3 max-w-full overflow-hidden">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name or phone..."
            className="w-full pl-10 pr-4 py-2 bg-[#2B2D2F] border border-zinc-700/80 rounded-xl text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-[#FF6B00]"
          />
        </div>

        <div className="flex items-center bg-[#2B2D2F] p-1 rounded-xl border border-zinc-700/80 overflow-x-auto no-scrollbar shrink-0">
          {(['Pending', 'Partial', 'Settled', 'All'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[#FF6B00] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Cards Grid */}
      {filteredUdhaar.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 shadow-lg">
          <BookOpenCheck className="w-12 h-12 mx-auto text-zinc-600 mb-3 stroke-[1.5]" />
          <h3 className="text-base font-bold text-white">No Udhaar Records Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
            Udhaar entries are automatically generated whenever a bill is completed using "Udhaar" payment mode.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUdhaar.map((record) => {
            const isSettled = record.status === 'Settled';

            return (
              <motion.div
                key={record.id}
                whileHover={{ y: -2 }}
                className={`bg-zinc-900 border p-5 rounded-2xl shadow-lg flex flex-col justify-between transition-all ${
                  isSettled
                    ? 'border-zinc-800 opacity-80'
                    : 'border-red-500/30 hover:border-red-500/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#2B2D2F] border border-zinc-700 flex items-center justify-center text-[#FF6B00] font-bold text-sm">
                        {record.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{record.customerName}</h3>
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {record.customerPhone || 'No Phone'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isSettled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : record.status === 'Partial'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {record.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRecordToDelete({ id: record.id, name: record.customerName })}
                        className="p-1 text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Delete Udhaar Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Owed Amount Box */}
                  <div className="my-3 p-3 bg-[#2B2D2F] rounded-xl border border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400">Balance Owed:</span>
                    <span className={`text-lg font-black font-mono ${isSettled ? 'text-emerald-400' : 'text-red-400'}`}>
                      ₹{record.totalOwed.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Recent Transactions list */}
                  <div className="space-y-1.5 text-xs text-zinc-400 max-h-[120px] overflow-y-auto pr-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Ledger History:</span>
                    {record.transactions.slice(-3).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-1.5 bg-zinc-800/40 rounded-lg text-[11px]"
                      >
                        <span className="truncate text-zinc-300">{tx.notes || tx.type}</span>
                        <span className={`font-mono font-bold ${tx.type === 'DEBIT' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {tx.type === 'DEBIT' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2">
                  {!isSettled && (
                    <button
                      onClick={() => handleOpenPaymentModal(record)}
                      className="flex-1 py-2 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Record Payment
                    </button>
                  )}

                  <button
                    onClick={() => handleSendReminderWhatsApp(record)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Reminder
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#2B2D2F] border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpenCheck className="w-5 h-5 text-[#FF6B00]" />
                  Record Udhaar Payment
                </h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                <div className="p-3 bg-[#2B2D2F] rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{selectedRecord.customerName}</span>
                    <span className="text-[11px] text-zinc-400">{selectedRecord.customerPhone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block">Total Owed</span>
                    <span className="text-sm font-bold text-red-400 font-mono">₹{selectedRecord.totalOwed}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Payment Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedRecord.totalOwed}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Payment Notes / Method</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Cash / PhonePe / GPay"
                    className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF6B00]/20"
                  >
                    Confirm & Update Balance
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE UDHAAR CONFIRM MODAL */}
      <AnimatePresence>
        {recordToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Udhaar Record?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Are you sure you want to delete the udhaar ledger entry for <span className="font-semibold text-white">"{recordToDelete.name}"</span>?
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const targetId = recordToDelete.id;
                    setRecordToDelete(null);
                    await deleteUdhaarRecord(targetId);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
