import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  CreditCard, 
  Banknote, 
  BookOpenCheck, 
  Receipt, 
  User, 
  Phone, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Tag, 
  Package,
  QrCode
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { InventoryItem, CartItem, PaymentMode, Bill } from '../types';
import { MaskedBuyRate } from '../components/MaskedBuyRate';

interface BillingPageProps {
  onBillCompleted: (bill: Bill) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ onBillCompleted }) => {
  const { items, settings, completeBill, addToast, getItemSalesCount } = useShop();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [gstPercent, setGstPercent] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [cashPortionInput, setCashPortionInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  // Filter and sort items by relevance & High Demand (top sales count first)
  const q = searchQuery.toLowerCase().trim();
  const hasActiveSearch = q.length > 0 || selectedCategory !== 'All';

  // Items sorted by High Demand first when no query is typed
  const allMatchingItems = items
    .filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        item.name.toLowerCase().includes(q) ||
        item.rackLocation.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // 1. Search Query Match Priority (if search query is typed)
      if (q) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        const getScore = (name: string, item: typeof a) => {
          if (name.startsWith(q)) return 1;
          const words = name.split(/\s+/);
          if (words.some((w) => w.startsWith(q))) return 2;
          if (name.includes(q)) return 3;
          if (item.barcode && item.barcode.toLowerCase().startsWith(q)) return 4;
          return 5;
        };

        const scoreA = getScore(nameA, a);
        const scoreB = getScore(nameB, b);

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
      }

      // 2. High Demand Priority: Items with higher sales quantity stay at the top!
      const salesA = getItemSalesCount(a.id);
      const salesB = getItemSalesCount(b.id);
      if (salesA !== salesB) {
        return salesB - salesA;
      }

      // 3. Alphabetical order fallback
      return a.name.localeCompare(b.name);
    });

  // Display top items (up to 8 in POS billing grid)
  const filteredItems = allMatchingItems.slice(0, 8);

  // Cart operations
  const addToCart = (item: InventoryItem) => {
    if (item.currentStock <= 0) {
      addToast('Out of Stock', `"${item.name}" is currently out of stock.`, 'warning');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.currentStock) {
          addToast('Stock Limit', `Cannot exceed available stock of ${item.currentStock} ${item.unit}`, 'warning');
          return prevCart;
        }
        return prevCart.map((ci) =>
          ci.item.id === item.id
            ? { ...ci, quantity: ci.quantity + 1, total: (ci.quantity + 1) * ci.unitPrice }
            : ci
        );
      } else {
        return [
          ...prevCart,
          {
            item,
            quantity: 1,
            unitPrice: item.sellingPrice,
            total: item.sellingPrice
          }
        ];
      }
    });
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((ci) => {
          if (ci.item.id === itemId) {
            const validQty = Math.min(Math.max(1, newQty), ci.item.currentStock);
            if (newQty > ci.item.currentStock) {
              addToast('Stock Limit', `Available stock for ${ci.item.name} is ${ci.item.currentStock}`, 'warning');
            }
            return {
              ...ci,
              quantity: validQty,
              total: validQty * ci.unitPrice
            };
          }
          return ci;
        })
        .filter((ci) => ci.quantity > 0);
    });
  };

  const updateUnitPrice = (itemId: string, newUnitPrice: number) => {
    setCart((prevCart) =>
      prevCart.map((ci) => {
        if (ci.item.id === itemId) {
          const validPrice = Math.max(0, isNaN(newUnitPrice) ? 0 : newUnitPrice);
          return {
            ...ci,
            unitPrice: validPrice,
            total: ci.quantity * validPrice,
          };
        }
        return ci;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setGstPercent(0);
    setPaymentMode('Cash');
    setCashPortionInput('');
  };

  // Subtotal & Totals
  const subtotal = cart.reduce((sum, ci) => sum + ci.total, 0);
  const gstAmount = Math.round((subtotal * (gstPercent / 100)) * 100) / 100;
  const grandTotal = Math.max(0, Math.round((subtotal + gstAmount - discount) * 100) / 100);

  // Split Payment Calculations
  const rawCashInput = parseFloat(cashPortionInput) || 0;
  const parsedCashPaid = paymentMode === 'UPI/Online'
    ? Math.min(grandTotal, Math.max(0, rawCashInput))
    : (paymentMode === 'Cash' ? grandTotal : 0);

  const parsedOnlinePaid = paymentMode === 'UPI/Online'
    ? Math.max(0, grandTotal - parsedCashPaid)
    : 0;

  // Complete Bill Action
  const handleCompleteBill = async () => {
    if (cart.length === 0) return;
    
    if (paymentMode === 'Udhaar' && !customerName.trim()) {
      addToast('Customer Name Required', 'Customer name is mandatory for Udhaar (Credit) sales.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdBill = await completeBill({
        cartItems: cart,
        customerName,
        customerPhone,
        paymentMode,
        gstPercent,
        discount,
        cashPaidAmount: parsedCashPaid,
        onlinePaidAmount: parsedOnlinePaid
      });

      if (createdBill) {
        clearCart();
        onBillCompleted(createdBill);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* LEFT 7 COLUMNS: Item Search & Selection Grid */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 dark:text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Item Name, Barcode, or Rack Location (e.g. Rack A-1)..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-[#2B2D2F] border border-slate-300 dark:border-zinc-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-400 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                    : 'bg-slate-100 dark:bg-[#2B2D2F] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Item Cards Grid */}
        <div className="space-y-2">
          {!hasActiveSearch && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#FF6B00] flex items-center gap-1.5 uppercase tracking-wider">
                🔥 High Demand Products (Top Selling)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Sorted by highest sales volume
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredItems.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-slate-500 dark:text-zinc-400">
                <Package className="w-10 h-10 mx-auto text-slate-400 dark:text-zinc-600 mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No matching hardware items found</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Try clearing search filters or add new stock in Inventory.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const inCart = cart.find((ci) => ci.item.id === item.id);
                const isLow = item.currentStock <= item.lowStockThreshold && item.currentStock > 0;
                const isOut = item.currentStock === 0;
                const salesCount = getItemSalesCount(item.id);

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: isOut ? 1 : 1.01 }}
                    className={`bg-white dark:bg-zinc-900 border p-3 rounded-xl shadow-xs flex flex-col justify-between transition-all ${
                      inCart
                        ? 'border-[#FF6B00] ring-1 ring-[#FF6B00]/30 bg-[#FF6B00]/5'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 truncate">
                            {item.category}
                          </span>
                          {item.rackLocation && (
                            <span className="font-mono bg-slate-100 dark:bg-[#2B2D2F] px-1.5 py-0.5 rounded text-[10px] text-slate-700 dark:text-zinc-300 font-semibold shrink-0 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#FF6B00]" />
                              {item.rackLocation}
                            </span>
                          )}
                          {salesCount > 0 && (
                            <span className="bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 px-1.5 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-0.5 shrink-0">
                              🔥 High Demand ({salesCount})
                            </span>
                          )}
                        </div>

                        {/* Stock Pill */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          isOut
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                            : isLow
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        }`}>
                          {isOut ? 'Out of Stock' : `${item.currentStock} ${item.unit} left`}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">{item.name}</h4>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">Sale Rate:</span>
                          <span className="text-sm font-black text-[#FF6B00]">₹{item.sellingPrice}</span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">/{item.unit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MaskedBuyRate
                            price={item.purchasePrice || Math.round(item.sellingPrice * 0.7)}
                            prefix="Buy Rate: "
                            showIcon
                          />
                        </div>
                      </div>

                      <button
                        disabled={isOut}
                        onClick={() => addToCart(item)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          isOut
                            ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                            : inCart
                            ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/30'
                            : 'bg-slate-100 dark:bg-zinc-800 hover:bg-[#FF6B00] hover:text-white text-slate-800 dark:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {inCart ? `Added (${inCart.quantity})` : 'Add'}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT 5 COLUMNS: Cart & Checkout Panel */}
      <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between sticky top-20 h-fit">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#FF6B00]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Current Cart</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FF6B00]/20 text-[#FF6B00]">
                {cart.length} items
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Customer Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 bg-slate-50 dark:bg-[#2B2D2F] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-[#FF6B00]" /> Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in / Customer"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700/70 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3 text-[#FF6B00]" /> Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Mobile (Optional)"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700/70 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-zinc-500 my-4 border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-400 dark:text-zinc-600 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Cart is empty</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-600 mt-1">Select items from left list to start billing.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {cart.map((ci) => (
                <div
                  key={ci.item.id}
                  className="p-3 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/50 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{ci.item.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>Sale: ₹{ci.unitPrice}/{ci.item.unit}</span>
                      <span className="text-slate-400 dark:text-zinc-600">•</span>
                      <MaskedBuyRate
                        price={ci.item.purchasePrice || Math.round(ci.item.sellingPrice * 0.7)}
                        prefix="Buy: "
                        showIcon
                      />
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-slate-300 dark:border-zinc-700">
                    <button
                      onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                      className="p-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-900 dark:text-white w-6 text-center">{ci.quantity}</span>
                    <button
                      onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                      className="p-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0">
                    {/* Editable Price Control: - [₹360] + */}
                    {editingPriceItemId === ci.item.id ? (
                      <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-[#FF6B00] rounded-lg p-1 shadow-md">
                        <button
                          type="button"
                          onClick={() => updateUnitPrice(ci.item.id, ci.unitPrice - 5)}
                          className="p-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="- ₹5"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <div className="flex items-center text-xs font-bold text-[#FF6B00]">
                          <span>₹</span>
                          <input
                            type="number"
                            value={ci.unitPrice === 0 ? '' : ci.unitPrice}
                            onChange={(e) => updateUnitPrice(ci.item.id, parseFloat(e.target.value) || 0)}
                            className="w-12 bg-transparent text-center focus:outline-none text-xs font-bold text-slate-900 dark:text-white font-mono p-0"
                            autoFocus
                            onBlur={() => setEditingPriceItemId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingPriceItemId(null);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => updateUnitPrice(ci.item.id, ci.unitPrice + 5)}
                          className="p-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="+ ₹5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => updateUnitPrice(ci.item.id, ci.unitPrice - 5)}
                          className="p-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700/60 transition-colors cursor-pointer"
                          title="- ₹5"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPriceItemId(ci.item.id)}
                          className="text-xs font-bold text-[#FF6B00] hover:bg-slate-100 dark:hover:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-zinc-700/60 font-mono transition-all cursor-pointer flex items-center gap-0.5"
                          title="Tap to type custom rate"
                        >
                          <span>₹{ci.total}</span>
                          <span className="text-[8px] text-slate-400 dark:text-zinc-400">✎</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateUnitPrice(ci.item.id, ci.unitPrice + 5)}
                          className="p-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700/60 transition-colors cursor-pointer"
                          title="+ ₹5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => removeFromCart(ci.item.id)}
                      className="text-[10px] text-slate-500 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-1 block ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tax & Discount Options */}
          {cart.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              {/* GST Toggle */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-zinc-400 font-medium">GST Tax rate:</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#2B2D2F] p-1 rounded-lg border border-slate-200 dark:border-zinc-700">
                  {[0, 5, 12, 18].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setGstPercent(rate)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        gstPercent === rate
                          ? 'bg-[#FF6B00] text-white'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-zinc-400 font-medium">Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-24 px-2 py-1 bg-slate-50 dark:bg-[#2B2D2F] border border-slate-300 dark:border-zinc-700 rounded text-right text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Payment Mode Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-800 dark:text-zinc-300 font-bold flex items-center gap-1">
                    Payment Mode (भुगतान का तरीक़ा):
                  </span>
                  {paymentMode === 'Udhaar' && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Udhaar Ledger Record
                    </span>
                  )}
                  {paymentMode === 'Cash' && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Jama Cash Received
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Cash')}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMode === 'Cash'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                        : 'bg-slate-100 dark:bg-[#2B2D2F] text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Banknote className="w-4 h-4" /> Jama Cash
                    </div>
                    <span className="text-[9px] font-normal opacity-80 mt-0.5">नकद जमा</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('Udhaar')}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMode === 'Udhaar'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30 ring-2 ring-amber-400/40'
                        : 'bg-slate-100 dark:bg-[#2B2D2F] text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <BookOpenCheck className="w-4 h-4" /> Udhaar
                    </div>
                    <span className="text-[9px] font-normal opacity-80 mt-0.5">उधार खाता</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI/Online')}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMode === 'UPI/Online'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40'
                        : 'bg-slate-100 dark:bg-[#2B2D2F] text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" /> UPI / Online
                    </div>
                    <span className="text-[9px] font-normal opacity-80 mt-0.5">ऑनलाइन</span>
                  </button>
                </div>

                {/* Status Notice */}
                {paymentMode === 'Udhaar' && (
                  <div className="mt-2.5 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-bold">Udhaar (उधार खाता) Selected</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-200/80 mt-0.5">
                        This bill will be added to the customer's pending Udhaar Ledger. Customer name is required.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMode === 'Cash' && (
                  <div className="mt-2.5 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Jama Cash (नकद जमा): ₹{grandTotal.toLocaleString('en-IN')} cash payment received.</span>
                  </div>
                )}

                {paymentMode === 'UPI/Online' && (
                  <div className="mt-2.5 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 rounded-xl space-y-3">
                    {/* Cash Portion (Split Payment) Option */}
                    <div className="bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-700/80 p-2.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Cash Portion / नकद हिस्सा (Optional Split):
                        </label>
                        {parsedCashPaid > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Cash: ₹{parsedCashPaid.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 dark:text-zinc-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            max={grandTotal}
                            value={cashPortionInput}
                            onChange={(e) => setCashPortionInput(e.target.value)}
                            placeholder="Enter cash paid e.g. 50"
                            className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-[#2B2D2F] border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-[#FF6B00]"
                          />
                        </div>
                        {cashPortionInput && (
                          <button
                            type="button"
                            onClick={() => setCashPortionInput('')}
                            className="text-[11px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white px-2 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-slate-300 dark:border-zinc-700 font-semibold"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {parsedCashPaid > 0 && (
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-zinc-800">
                          <span className="text-emerald-600 dark:text-emerald-400">Cash Received: ₹{parsedCashPaid.toLocaleString('en-IN')}</span>
                          <span className="text-[#FF6B00]">Online QR Request: ₹{parsedOnlinePaid.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-blue-800 dark:text-blue-300 font-bold">
                        <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Dynamic UPI Payment QR Code
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl justify-center shadow-xs border border-slate-200 dark:border-transparent">
                      <QRCodeSVG 
                        value={`upi://pay?pa=${(settings.upiId || '9118111494@apl').trim()}&pn=${encodeURIComponent(settings.shopName || 'Sri Balaji Hardware')}&am=${parsedOnlinePaid}&cu=INR`} 
                        size={110} 
                        level="M" 
                      />
                      <div className="text-zinc-900 space-y-1 text-left">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                          {parsedCashPaid > 0 ? 'UPI Request (Remaining)' : 'Requested Amount'}
                        </p>
                        <p className="text-lg font-black text-[#FF6B00] font-mono leading-none">
                          ₹{parsedOnlinePaid.toLocaleString('en-IN')}
                        </p>
                        {parsedCashPaid > 0 && (
                          <p className="text-[10px] text-emerald-700 font-bold">
                            + ₹{parsedCashPaid.toLocaleString('en-IN')} Cash Paid (Total: ₹{grandTotal.toLocaleString('en-IN')})
                          </p>
                        )}
                        <p className="text-[10px] font-mono text-zinc-600 font-bold">UPI ID: {settings.upiId || '9118111494@apl'}</p>
                        <p className="text-[9px] text-zinc-500">Scan via GPay, PhonePe, Paytm, Amazon Pay, BHIM</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Totals Breakdown & Complete Bill CTA */}
        {cart.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-800 dark:text-zinc-200">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {gstAmount > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>GST ({gstPercent}%):</span>
                  <span className="font-mono">+₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Grand Total:</span>
              <span className="text-xl font-black text-[#FF6B00] font-mono">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              disabled={isSubmitting || cart.length === 0}
              onClick={handleCompleteBill}
              className="w-full py-3 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#FF6B00]/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Processing Order & PDF...</span>
              ) : (
                <>
                  <Receipt className="w-4 h-4" /> Complete Bill & Print PDF
                </>
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
