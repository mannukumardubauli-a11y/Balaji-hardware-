import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  Check, 
  ExternalLink, 
  Receipt, 
  MessageSquare, 
  Building2 
} from 'lucide-react';
import { Bill, ShopSettings } from '../types';
import { generateBillPDF, downloadPDF, getPDFDataUri } from '../lib/pdfGenerator';

interface BillPDFModalProps {
  bill: Bill | null;
  shopSettings: ShopSettings;
  onClose: () => void;
}

export const BillPDFModal: React.FC<BillPDFModalProps> = ({ bill, shopSettings, onClose }) => {
  const [pdfDataUri, setPdfDataUri] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (bill) {
      try {
        const uri = getPDFDataUri(bill, shopSettings);
        setPdfDataUri(uri);
      } catch (err) {
        console.error('PDF generation error:', err);
      }
    }
  }, [bill, shopSettings]);

  if (!bill) return null;

  const handlePrint = () => {
    try {
      const doc = generateBillPDF(bill, shopSettings);
      doc.autoPrint();
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } else {
            window.print();
          }
        } catch (e) {
          console.warn('Iframe print error:', e);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('Print initialization error:', err);
      window.print();
    }
  };

  const handleShare = () => {
    const itemsListText = bill.items
      .map((i) => `• ${i.name} (${i.quantity} ${i.unit}) - ₹${i.totalPrice}`)
      .join('\n');

    const paymentDetails = (bill.cashPaidAmount && bill.cashPaidAmount > 0 && bill.onlinePaidAmount && bill.onlinePaidAmount > 0)
      ? `UPI + Cash (Cash: ₹${bill.cashPaidAmount}, Online: ₹${bill.onlinePaidAmount})`
      : bill.paymentMode;

    const whatsappMessage = 
      `🧾 *TAX INVOICE #${bill.billNumber}*\n` +
      `🏪 *${shopSettings.shopName || 'Sri Balaji Hardware'}*\n` +
      `--------------------------------\n` +
      `👤 *Customer:* ${bill.customerName || 'Cash Customer'}\n` +
      `📱 *Phone:* ${bill.customerPhone || 'N/A'}\n` +
      `📅 *Date:* ${new Date(bill.timestamp).toLocaleDateString('en-IN')}\n\n` +
      `📦 *Items Purchased:*\n${itemsListText}\n\n` +
      `💰 *Grand Total: ₹${bill.total.toLocaleString('en-IN')}*\n` +
      `💳 *Payment:* ${paymentDetails}\n\n` +
      `Thank you for shopping with us! 🙏`;

    // Direct WhatsApp app launch with customer phone number chat
    const encodedText = encodeURIComponent(whatsappMessage);

    if (bill.customerPhone && bill.customerPhone.trim()) {
      const cleanDigits = bill.customerPhone.replace(/[^0-9]/g, '');
      let phoneWithCountry = cleanDigits;
      if (cleanDigits.length === 10) {
        phoneWithCountry = `91${cleanDigits}`;
      } else if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) {
        phoneWithCountry = `91${cleanDigits.slice(1)}`;
      }
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`;
      window.open(whatsappUrl, '_blank');
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleDownload = () => {
    downloadPDF(bill, shopSettings);
  };

  const formattedPhone = bill.customerPhone && bill.customerPhone.replace(/[^0-9]/g, '').slice(-10);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          className="bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#2B2D2F] border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl text-[#FF6B00]">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Bill Invoice #{bill.billNumber}
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                    {(bill.cashPaidAmount && bill.cashPaidAmount > 0 && bill.onlinePaidAmount && bill.onlinePaidAmount > 0)
                      ? `UPI + Cash`
                      : bill.paymentMode}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  {bill.customerName || 'Cash Customer'} {formattedPhone ? `(📱 ${formattedPhone})` : ''} • {new Date(bill.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Action Banner for WhatsApp Share */}
          <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <MessageSquare className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
              <span>
                {formattedPhone 
                  ? `Send Invoice directly to WhatsApp: +91 ${formattedPhone}` 
                  : 'Share invoice bill on WhatsApp Messenger'}
              </span>
            </div>

            <button
              onClick={handleShare}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/40 flex items-center gap-1.5 shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              Open WhatsApp Chat
            </button>
          </div>

          {/* Body Preview */}
          <div className="flex-1 p-2 sm:p-4 bg-zinc-950/60 overflow-y-auto min-h-[220px] flex flex-col items-center justify-center">
            {pdfDataUri ? (
              <iframe
                src={`${pdfDataUri}#toolbar=0&navpanes=0`}
                className="w-full h-[280px] sm:h-[460px] rounded-xl border border-zinc-800 shadow-md bg-white"
                title={`Bill Invoice ${bill.billNumber}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-400 p-8">
                <Building2 className="w-10 h-10 text-[#FF6B00] animate-pulse mb-3" />
                <p className="text-sm font-medium">Generating Tax Invoice PDF...</p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-3 sm:p-4 bg-[#2B2D2F] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-zinc-300 font-mono flex items-center justify-between w-full sm:w-auto gap-4">
              <span>Grand Total:</span>
              <span className="text-lg font-black text-[#FF6B00]">₹{bill.total.toLocaleString('en-IN')}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <button
                onClick={handleShare}
                className="col-span-1 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-md shadow-emerald-600/30"
              >
                <MessageSquare className="w-4 h-4 fill-current shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>

              <button
                onClick={handlePrint}
                className="col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-zinc-700"
              >
                <Printer className="w-4 h-4 text-zinc-300 shrink-0" />
                <span className="truncate">Print</span>
              </button>

              <button
                onClick={handleDownload}
                className="col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-[#FF6B00]/20"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">PDF</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
