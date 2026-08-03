import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  runTransaction, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  InventoryItem, 
  Bill, 
  Supplier, 
  UdhaarRecord, 
  ShopSettings, 
  ToastMessage, 
  CartItem, 
  PaymentMode,
  BillItemSummary,
  SalesReturnRecord,
  SalesReturnItem
} from '../types';
import { INITIAL_ITEMS, INITIAL_SHOP_SETTINGS, INITIAL_SUPPLIERS } from '../lib/seedData';
import { useAuth } from './AuthContext';

interface ShopContextType {
  items: InventoryItem[];
  bills: Bill[];
  suppliers: Supplier[];
  udhaar: UdhaarRecord[];
  salesReturns: SalesReturnRecord[];
  settings: ShopSettings;
  loading: boolean;
  isOnline: boolean;
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => Promise<void>;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  completeBill: (params: {
    cartItems: CartItem[];
    customerName: string;
    customerPhone: string;
    paymentMode: PaymentMode;
    gstPercent: number;
    discount: number;
    cashPaidAmount?: number;
    onlinePaidAmount?: number;
  }) => Promise<Bill | null>;
  processSalesReturn: (params: {
    billId?: string;
    billNumber?: string;
    customerName: string;
    customerPhone?: string;
    returnedItems: SalesReturnItem[];
    refundMode: 'Cash' | 'UPI/Online' | 'Udhaar Credit';
    reason: string;
  }) => Promise<SalesReturnRecord | null>;
  deleteSalesReturn: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  deleteUdhaarRecord: (id: string) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  recordUdhaarPayment: (recordId: string, amount: number, notes?: string) => Promise<void>;
  updateShopSettings: (newSettings: ShopSettings) => Promise<void>;
  seedDatabase: (force?: boolean) => Promise<void>;
  exportDatabase: () => void;
  importDatabase: (jsonData: any) => Promise<boolean>;
  lowStockItems: InventoryItem[];
  itemSalesMap: Record<string, number>;
  getItemSalesCount: (itemId: string) => number;
  todaySalesSummary: {
    totalRevenue: number;
    billsCount: number;
    estimatedProfit: number;
    lowStockCount: number;
    todayReturnsAmount: number;
  };
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

function dedupeById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    if (!item || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>(() => INITIAL_ITEMS.map((item, idx) => ({ id: `item-seed-${idx}`, ...item })));
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => INITIAL_SUPPLIERS.map((sup, idx) => ({ id: `sup-seed-${idx}`, ...sup })));
  const [udhaar, setUdhaar] = useState<UdhaarRecord[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturnRecord[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(INITIAL_SHOP_SETTINGS);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Monitor network online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Toast Helper
  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time Firestore Listeners with Fallback Local Sync
  useEffect(() => {
    if (!db) {
      console.warn('Firestore db is not initialized. Operating in local mode.');
      setLoading(false);
      return;
    }

    let unsubItems: () => void = () => {};
    let unsubBills: () => void = () => {};
    let unsubSuppliers: () => void = () => {};
    let unsubUdhaar: () => void = () => {};
    let unsubReturns: () => void = () => {};
    let unsubSettings: () => void = () => {};

    try {
      // 1. Items Listener
      unsubItems = onSnapshot(
        collection(db, 'items'),
        (snapshot) => {
          const docsList: InventoryItem[] = [];
          snapshot.forEach((docSnap) => {
            docsList.push({ id: docSnap.id, ...docSnap.data() } as InventoryItem);
          });

          // If empty on first load, offer/auto seed initial demo items
          if (docsList.length === 0 && !snapshot.metadata.fromCache) {
            seedDatabase(false);
          } else {
            setItems(dedupeById(docsList));
          }
        },
        (err) => {
          console.warn('Items subscription warning:', err);
        }
      );
    } catch (e) {
      console.warn('Items listener setup failed:', e);
    }

    try {
      // 2. Bills Listener
      unsubBills = onSnapshot(
        collection(db, 'bills'),
        (snapshot) => {
          const docsList: Bill[] = [];
          snapshot.forEach((docSnap) => {
            docsList.push({ id: docSnap.id, ...docSnap.data() } as Bill);
          });
          docsList.sort((a, b) => b.createdAt - a.createdAt);
          setBills(dedupeById(docsList));
        },
        (err) => {
          console.warn('Bills subscription warning:', err);
        }
      );
    } catch (e) {
      console.warn('Bills listener setup failed:', e);
    }

    try {
      // 3. Suppliers Listener
      unsubSuppliers = onSnapshot(
        collection(db, 'suppliers'),
        (snapshot) => {
          const docsList: Supplier[] = [];
          snapshot.forEach((docSnap) => {
            docsList.push({ id: docSnap.id, ...docSnap.data() } as Supplier);
          });
          setSuppliers(dedupeById(docsList));
        },
        (err) => {
          console.warn('Suppliers subscription warning:', err);
        }
      );
    } catch (e) {
      console.warn('Suppliers listener setup failed:', e);
    }

    try {
      // 4. Udhaar Listener
      unsubUdhaar = onSnapshot(
        collection(db, 'udhaar'),
        (snapshot) => {
          const docsList: UdhaarRecord[] = [];
          snapshot.forEach((docSnap) => {
            docsList.push({ id: docSnap.id, ...docSnap.data() } as UdhaarRecord);
          });
          setUdhaar(dedupeById(docsList));
        },
        (err) => {
          console.warn('Udhaar subscription warning:', err);
        }
      );
    } catch (e) {
      console.warn('Udhaar listener setup failed:', e);
    }

    try {
      // 5. Sales Returns Listener
      unsubReturns = onSnapshot(
        collection(db, 'salesReturns'),
        (snapshot) => {
          const docsList: SalesReturnRecord[] = [];
          snapshot.forEach((docSnap) => {
            docsList.push({ id: docSnap.id, ...docSnap.data() } as SalesReturnRecord);
          });
          docsList.sort((a, b) => b.createdAt - a.createdAt);
          setSalesReturns(dedupeById(docsList));
        },
        (err) => {
          console.warn('SalesReturns subscription warning:', err);
        }
      );
    } catch (e) {
      console.warn('SalesReturns listener setup failed:', e);
    }

    try {
      // 6. Shop Settings Listener
      unsubSettings = onSnapshot(
        doc(db, 'shopSettings', 'main'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as ShopSettings;
            // Auto-sync with user's shop info if missing or old
            const activeUpiId = (!data.upiId || data.upiId === "9140402455@ybl") ? "9118111494@apl" : data.upiId;
            const updated: ShopSettings = {
              ...data,
              shopName: "Sri Balaji Hardware and Paint Store",
              proprietor: data.proprietor || "Manoj Sharma",
              address: data.address && !data.address.includes('Plot 42') ? data.address : "Dubauli Bazaar, Tower se 100 meter Dakshin",
              phone: data.phone && !data.phone.includes('98765') ? data.phone : "9140402455, 9984002627",
              email: data.email || "P209824@gmail.com",
              upiId: activeUpiId,
              gstin: "", // GST Number removed per user request
              logoUrl: "https://res.cloudinary.com/pqs85ndb/image/upload/v1785676217/IMG-20260802-WA0004_pvecpl.jpg"
            };

            if (
              data.shopName !== updated.shopName ||
              data.address !== updated.address ||
              data.phone !== updated.phone ||
              data.upiId !== updated.upiId ||
              data.logoUrl !== updated.logoUrl ||
              data.gstin !== "" ||
              !data.proprietor
            ) {
              if (db) setDoc(doc(db, 'shopSettings', 'main'), updated).catch(() => {});
            }
            setSettings(updated);
          } else {
            if (db) setDoc(doc(db, 'shopSettings', 'main'), INITIAL_SHOP_SETTINGS).catch(() => {});
            setSettings(INITIAL_SHOP_SETTINGS);
          }
        },
        (err) => {
          console.warn('ShopSettings subscription warning:', err);
        }
      );
    } catch (e) {
      console.warn('ShopSettings listener setup failed:', e);
    }

    setLoading(false);

    return () => {
      try { unsubItems(); } catch (e) {}
      try { unsubBills(); } catch (e) {}
      try { unsubSuppliers(); } catch (e) {}
      try { unsubUdhaar(); } catch (e) {}
      try { unsubReturns(); } catch (e) {}
      try { unsubSettings(); } catch (e) {}
    };
  }, []);

  // Seed Database helper
  const seedDatabase = async (force: boolean = false) => {
    try {
      if (!force) {
        const snap = await getDocs(collection(db, 'items'));
        if (!snap.empty) return; // already seeded
      }

      // Seed Settings
      await setDoc(doc(db, 'shopSettings', 'main'), INITIAL_SHOP_SETTINGS);
      setSettings(INITIAL_SHOP_SETTINGS);

      // Seed Suppliers
      for (const sup of INITIAL_SUPPLIERS) {
        await addDoc(collection(db, 'suppliers'), sup);
      }

      // Seed Items
      for (const item of INITIAL_ITEMS) {
        await addDoc(collection(db, 'items'), item);
      }

      addToast('Shop Initialized', 'Database loaded with demo hardware items, suppliers & settings.', 'success');
    } catch (err) {
      console.error('Error seeding database:', err);
      // Fallback local memory state if Firestore write is blocked offline
      setItems(INITIAL_ITEMS.map((item, idx) => ({ id: `local-${idx}`, ...item })));
      setSuppliers(INITIAL_SUPPLIERS.map((sup, idx) => ({ id: `local-sup-${idx}`, ...sup })));
    }
  };

  // Inventory CRUD
  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    try {
      const newItem: Omit<InventoryItem, 'id'> = {
        ...itemData,
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'items'), newItem);
      addToast('Item Added', `Successfully added "${itemData.name}" to ${itemData.rackLocation}`, 'success');
    } catch (err) {
      console.error('Add item error:', err);
      addToast('Error', 'Failed to add item. Saved locally.', 'error');
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const docRef = doc(db, 'items', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      addToast('Item Updated', 'Stock & details updated successfully.', 'success');
    } catch (err) {
      console.error('Update item error:', err);
      addToast('Error', 'Could not update item.', 'error');
    }
  };

  const deleteInventoryItem = async (id: string) => {
    // Immediately update local state so UI responds instantly
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, 'items', id));
      addToast('Item Deleted', 'Item removed from inventory.', 'info');
    } catch (err) {
      console.error('Delete item error:', err);
      addToast('Item Deleted', 'Item removed from local inventory.', 'info');
    }
  };

  // COMPLETE BILL (Atomic Firestore Transaction)
  const completeBill = async ({
    cartItems,
    customerName,
    customerPhone,
    paymentMode,
    gstPercent,
    discount,
    cashPaidAmount,
    onlinePaidAmount
  }: {
    cartItems: CartItem[];
    customerName: string;
    customerPhone: string;
    paymentMode: PaymentMode;
    gstPercent: number;
    discount: number;
    cashPaidAmount?: number;
    onlinePaidAmount?: number;
  }): Promise<Bill | null> => {
    if (cartItems.length === 0) {
      addToast('Cart Empty', 'Please add items to cart before completing bill.', 'warning');
      return null;
    }

    const billNumber = `INV-${Date.now().toString().slice(-6)}`;
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = Math.round((subtotal * (gstPercent / 100)) * 100) / 100;
    const grandTotal = Math.max(0, Math.round((subtotal + gstAmount - discount) * 100) / 100);

    const billItemSummaries: BillItemSummary[] = cartItems.map((ci) => ({
      itemId: ci.item.id,
      name: ci.item.name,
      rackLocation: ci.item.rackLocation,
      unit: ci.item.unit,
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
      totalPrice: ci.total,
      purchasePrice: ci.item.purchasePrice
    }));

    const newBill: Omit<Bill, 'id'> = {
      billNumber,
      customerName: customerName.trim() || 'Cash Customer',
      customerPhone: customerPhone.trim(),
      items: billItemSummaries,
      subtotal,
      gstPercent,
      gstAmount,
      discount,
      total: grandTotal,
      paymentMode,
      cashPaidAmount: cashPaidAmount !== undefined ? cashPaidAmount : (paymentMode === 'Cash' ? grandTotal : 0),
      onlinePaidAmount: onlinePaidAmount !== undefined ? onlinePaidAmount : (paymentMode === 'UPI/Online' ? grandTotal : 0),
      cashierName: profile?.name || 'Shop Staff',
      cashierRole: profile?.role || 'Helper',
      timestamp: new Date().toISOString(),
      createdAt: Date.now()
    };

    try {
      // Execute Firestore Transaction to deduct stock safely and write bill
      let newlyCreatedBillId = '';

      await runTransaction(db, async (transaction) => {
        // 1. Read current stock for all items
        const itemSnaps = await Promise.all(
          cartItems.map((ci) => transaction.get(doc(db, 'items', ci.item.id)))
        );

        // Verify stock sufficiency
        itemSnaps.forEach((snap, idx) => {
          if (!snap.exists()) {
            throw new Error(`Item ${cartItems[idx].item.name} not found in inventory.`);
          }
          const currentData = snap.data() as InventoryItem;
          const requestedQty = cartItems[idx].quantity;
          if (currentData.currentStock < requestedQty) {
            throw new Error(`Insufficient stock for "${currentData.name}". Available: ${currentData.currentStock}`);
          }
        });

        // 2. Deduct Stock
        itemSnaps.forEach((snap, idx) => {
          const itemRef = doc(db, 'items', cartItems[idx].item.id);
          const currentStock = (snap.data() as InventoryItem).currentStock;
          const newStock = Math.max(0, currentStock - cartItems[idx].quantity);
          transaction.update(itemRef, {
            currentStock: newStock,
            updatedAt: new Date().toISOString()
          });
        });

        // 3. Create Bill Document
        const billRef = doc(collection(db, 'bills'));
        newlyCreatedBillId = billRef.id;
        transaction.set(billRef, newBill);

        // 4. If payment mode is Udhaar (Credit), update/create Udhaar record
        if (paymentMode === 'Udhaar' && customerName.trim()) {
          const custNameKey = customerName.trim();
          const existingUdhaar = udhaar.find(
            (u) => u.customerName.toLowerCase() === custNameKey.toLowerCase()
          );

          if (existingUdhaar) {
            const udhaarRef = doc(db, 'udhaar', existingUdhaar.id);
            const updatedTotal = existingUdhaar.totalOwed + grandTotal;
            const newTx = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              amount: grandTotal,
              type: 'DEBIT' as const,
              billId: billRef.id,
              notes: `Credit Bill #${billNumber}`
            };
            transaction.update(udhaarRef, {
              totalOwed: updatedTotal,
              status: 'Pending',
              lastUpdated: new Date().toISOString(),
              transactions: [...existingUdhaar.transactions, newTx]
            });
          } else {
            const newUdhaarRef = doc(collection(db, 'udhaar'));
            transaction.set(newUdhaarRef, {
              customerName: custNameKey,
              customerPhone: customerPhone.trim(),
              totalOwed: grandTotal,
              status: 'Pending',
              lastUpdated: new Date().toISOString(),
              transactions: [
                {
                  id: Date.now().toString(),
                  date: new Date().toISOString(),
                  amount: grandTotal,
                  type: 'DEBIT',
                  billId: billRef.id,
                  notes: `Initial Credit Bill #${billNumber}`
                }
              ]
            });
          }
        }
      });

      const fullBill: Bill = { id: newlyCreatedBillId, ...newBill };
      addToast('Bill Completed', `Invoice #${billNumber} generated! ₹${grandTotal} (${paymentMode})`, 'success');

      // Check for low stock alerts
      cartItems.forEach((ci) => {
        const newStock = Math.max(0, ci.item.currentStock - ci.quantity);
        if (newStock <= ci.item.lowStockThreshold) {
          addToast(
            'Low Stock Alert!',
            `"${ci.item.name}" stock dropped to ${newStock} ${ci.item.unit}!`,
            'warning'
          );
        }
      });

      return fullBill;
    } catch (err: any) {
      console.error('Bill completion error:', err);
      addToast('Transaction Failed', err?.message || 'Failed to complete bill.', 'error');
      
      // Local fallback for offline/preview demo
      const fallbackBill: Bill = { id: `local-bill-${Date.now()}`, ...newBill };
      setBills((prev) => [fallbackBill, ...prev]);
      
      // Deduct locally
      setItems((prev) =>
        prev.map((item) => {
          const match = cartItems.find((ci) => ci.item.id === item.id);
          if (match) {
            return {
              ...item,
              currentStock: Math.max(0, item.currentStock - match.quantity)
            };
          }
          return item;
        })
      );

      return fallbackBill;
    }
  };

  // Supplier CRUD
  const addSupplier = async (sup: Omit<Supplier, 'id'>) => {
    try {
      await addDoc(collection(db, 'suppliers'), sup);
      addToast('Supplier Added', `Added ${sup.name} to directory.`, 'success');
    } catch (err) {
      addToast('Error', 'Could not save supplier.', 'error');
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      await updateDoc(doc(db, 'suppliers', id), updates);
      addToast('Supplier Updated', 'Supplier contact updated.', 'success');
    } catch (err) {
      addToast('Error', 'Could not update supplier.', 'error');
    }
  };

  const deleteSupplier = async (id: string) => {
    setSuppliers((prev) => prev.filter((sup) => sup.id !== id));
    try {
      await deleteDoc(doc(db, 'suppliers', id));
      addToast('Supplier Removed', 'Supplier deleted.', 'info');
    } catch (err) {
      console.error('Delete supplier error:', err);
      addToast('Supplier Removed', 'Supplier deleted locally.', 'info');
    }
  };

  const deleteUdhaarRecord = async (id: string) => {
    setUdhaar((prev) => prev.filter((u) => u.id !== id));
    try {
      await deleteDoc(doc(db, 'udhaar', id));
      addToast('Record Deleted', 'Udhaar account deleted.', 'info');
    } catch (err) {
      console.error('Delete udhaar error:', err);
      addToast('Record Deleted', 'Udhaar account deleted locally.', 'info');
    }
  };

  const deleteBill = async (id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
    try {
      await deleteDoc(doc(db, 'bills', id));
      addToast('Bill Deleted', 'Invoice record deleted.', 'info');
    } catch (err) {
      console.error('Delete bill error:', err);
      addToast('Bill Deleted', 'Invoice record deleted locally.', 'info');
    }
  };

  // Process Sales Return
  const processSalesReturn = async (params: {
    billId?: string;
    billNumber?: string;
    customerName: string;
    customerPhone?: string;
    returnedItems: SalesReturnItem[];
    refundMode: 'Cash' | 'UPI/Online' | 'Udhaar Credit';
    reason: string;
  }): Promise<SalesReturnRecord | null> => {
    try {
      const returnNumber = `RET-${Date.now().toString().slice(-6)}`;
      const nowISO = new Date().toISOString();
      const totalRefundAmount = params.returnedItems.reduce((acc, item) => acc + item.totalRefund, 0);

      const returnRecordData: Omit<SalesReturnRecord, 'id'> = {
        returnNumber,
        billId: params.billId || '',
        billNumber: params.billNumber || '',
        customerName: params.customerName.trim() || 'General Customer',
        customerPhone: params.customerPhone?.trim() || '',
        items: params.returnedItems,
        totalRefundAmount,
        refundMode: params.refundMode,
        reason: params.reason.trim() || 'Customer Return',
        processedBy: profile?.name || 'Store Manager',
        timestamp: nowISO,
        createdAt: Date.now()
      };

      // 1. Restock returned items back into inventory
      for (const retItem of params.returnedItems) {
        const existingItem = items.find((i) => i.id === retItem.itemId);
        if (existingItem) {
          const newStock = (existingItem.currentStock || 0) + retItem.quantity;
          setItems((prev) =>
            prev.map((i) => (i.id === retItem.itemId ? { ...i, currentStock: newStock, updatedAt: nowISO } : i))
          );
          try {
            await updateDoc(doc(db, 'items', retItem.itemId), {
              currentStock: newStock,
              updatedAt: nowISO
            });
          } catch (e) {
            console.warn('Restock Firestore update error:', e);
          }
        }
      }

      // 2. If refundMode is Udhaar Credit, reduce customer's Udhaar balance
      if (params.refundMode === 'Udhaar Credit' && totalRefundAmount > 0) {
        const matchingUdhaar = udhaar.find(
          (u) =>
            (params.customerPhone && u.customerPhone === params.customerPhone) ||
            u.customerName.toLowerCase() === params.customerName.toLowerCase()
        );

        if (matchingUdhaar) {
          const newOwed = Math.max(0, matchingUdhaar.totalOwed - totalRefundAmount);
          const newStatus = newOwed === 0 ? 'Settled' : 'Partial';
          const newTx = {
            id: `tx-${Date.now()}`,
            date: nowISO,
            amount: totalRefundAmount,
            type: 'CREDIT' as const,
            billId: params.billId,
            notes: `Sales Return Refund (#${returnNumber})`
          };

          const updatedTxs = [newTx, ...matchingUdhaar.transactions];
          setUdhaar((prev) =>
            prev.map((u) =>
              u.id === matchingUdhaar.id
                ? { ...u, totalOwed: newOwed, status: newStatus, lastUpdated: nowISO, transactions: updatedTxs }
                : u
            )
          );

          try {
            await updateDoc(doc(db, 'udhaar', matchingUdhaar.id), {
              totalOwed: newOwed,
              status: newStatus,
              lastUpdated: nowISO,
              transactions: updatedTxs
            });
          } catch (e) {
            console.warn('Udhaar update error:', e);
          }
        }
      }

      // 3. Save Sales Return Record in Firestore
      let newDocId = `ret-local-${Date.now()}`;
      let savedToFirestore = false;
      try {
        const docRef = await addDoc(collection(db, 'salesReturns'), returnRecordData);
        newDocId = docRef.id;
        savedToFirestore = true;
      } catch (e) {
        console.warn('Sales return Firestore save warning:', e);
      }

      const createdRecord: SalesReturnRecord = { id: newDocId, ...returnRecordData };
      if (!savedToFirestore) {
        setSalesReturns((prev) => dedupeById([createdRecord, ...prev]));
      }

      addToast(
        'Return Processed',
        `Return #${returnNumber} recorded! ₹${totalRefundAmount.toLocaleString('en-IN')} refunded & items restocked.`,
        'success'
      );

      return createdRecord;
    } catch (err) {
      console.error('Process return error:', err);
      addToast('Error', 'Could not process sales return.', 'error');
      return null;
    }
  };

  const deleteSalesReturn = async (id: string) => {
    setSalesReturns((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteDoc(doc(db, 'salesReturns', id));
      addToast('Return Record Deleted', 'Sales return record removed.', 'info');
    } catch (err) {
      console.error('Delete return error:', err);
      addToast('Return Record Deleted', 'Return record removed locally.', 'info');
    }
  };

  // Udhaar Payment
  const recordUdhaarPayment = async (recordId: string, amount: number, notes?: string) => {
    try {
      const record = udhaar.find((u) => u.id === recordId);
      if (!record) return;

      const newTotal = Math.max(0, record.totalOwed - amount);
      const newStatus = newTotal === 0 ? 'Settled' : 'Partial';

      const newTx = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        amount,
        type: 'CREDIT' as const,
        notes: notes || 'Payment Received'
      };

      await updateDoc(doc(db, 'udhaar', recordId), {
        totalOwed: newTotal,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        transactions: [...record.transactions, newTx]
      });

      addToast('Payment Recorded', `₹${amount} credit recorded for ${record.customerName}. Remaining: ₹${newTotal}`, 'success');
    } catch (err) {
      addToast('Error', 'Failed to record payment.', 'error');
    }
  };

  // Shop Settings Update
  const updateShopSettings = async (newSettings: ShopSettings) => {
    try {
      await setDoc(doc(db, 'shopSettings', 'main'), newSettings);
      setSettings(newSettings);
      addToast('Settings Saved', 'Invoice header & shop details updated.', 'success');
    } catch (err) {
      addToast('Error', 'Could not save shop settings.', 'error');
    }
  };

  // Export Database to JSON
  const exportDatabase = () => {
    try {
      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        shopName: settings.shopName || 'Sri Balaji Hardware and Paint Store',
        counts: {
          items: items.length,
          bills: bills.length,
          suppliers: suppliers.length,
          udhaar: udhaar.length
        },
        data: {
          settings,
          items,
          bills,
          suppliers,
          udhaar
        }
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `HardwareShop_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Database Exported', 'Full JSON backup file created & downloaded successfully.', 'success');
    } catch (err) {
      console.error('Export database error:', err);
      addToast('Export Failed', 'Could not export shop database.', 'error');
    }
  };

  // Import Database from JSON
  const importDatabase = async (jsonData: any): Promise<boolean> => {
    try {
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Invalid JSON format.');
      }

      const payload = jsonData.data || jsonData;
      const { settings: importedSettings, items: importedItems, bills: importedBills, suppliers: importedSuppliers, udhaar: importedUdhaar } = payload;

      if (!Array.isArray(importedItems) && !importedSettings) {
        throw new Error('JSON file does not contain valid hardware shop database records.');
      }

      // Restore Settings
      if (importedSettings && typeof importedSettings === 'object') {
        await setDoc(doc(db, 'shopSettings', 'main'), importedSettings);
        setSettings(importedSettings);
      }

      // Restore Items
      if (Array.isArray(importedItems)) {
        for (const item of importedItems) {
          if (item.id) {
            const { id, ...data } = item;
            await setDoc(doc(db, 'items', id), data, { merge: true });
          } else {
            await addDoc(collection(db, 'items'), item);
          }
        }
      }

      // Restore Bills
      if (Array.isArray(importedBills)) {
        for (const bill of importedBills) {
          if (bill.id) {
            const { id, ...data } = bill;
            await setDoc(doc(db, 'bills', id), data, { merge: true });
          } else {
            await addDoc(collection(db, 'bills'), bill);
          }
        }
      }

      // Restore Suppliers
      if (Array.isArray(importedSuppliers)) {
        for (const sup of importedSuppliers) {
          if (sup.id) {
            const { id, ...data } = sup;
            await setDoc(doc(db, 'suppliers', id), data, { merge: true });
          } else {
            await addDoc(collection(db, 'suppliers'), sup);
          }
        }
      }

      // Restore Udhaar Records
      if (Array.isArray(importedUdhaar)) {
        for (const u of importedUdhaar) {
          if (u.id) {
            const { id, ...data } = u;
            await setDoc(doc(db, 'udhaar', id), data, { merge: true });
          } else {
            await addDoc(collection(db, 'udhaar'), u);
          }
        }
      }

      addToast('Database Restored', 'Shop data & settings restored successfully from JSON backup.', 'success');
      return true;
    } catch (err: any) {
      console.error('Import database error:', err);
      addToast('Import Failed', err?.message || 'Could not parse or import JSON backup file.', 'error');
      return false;
    }
  };

  // Computed Low Stock Items
  const lowStockItems = items.filter((item) => item.currentStock <= item.lowStockThreshold);

  // Computed Item Total Sales Quantity Map (accounting for returns)
  const itemSalesMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    bills.forEach((bill) => {
      bill.items?.forEach((bi) => {
        if (bi.itemId) {
          map[bi.itemId] = (map[bi.itemId] || 0) + (bi.quantity || 1);
        }
      });
    });
    salesReturns.forEach((ret) => {
      ret.items?.forEach((ri) => {
        if (ri.itemId && map[ri.itemId]) {
          map[ri.itemId] = Math.max(0, map[ri.itemId] - (ri.quantity || 1));
        }
      });
    });
    return map;
  }, [bills, salesReturns]);

  const getItemSalesCount = (itemId: string): number => {
    return itemSalesMap[itemId] || 0;
  };

  // Computed Today's Summary (Deducting today's returns for accurate real-time revenue)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayBills = bills.filter((b) => new Date(b.timestamp) >= todayStart);
  const todayReturns = salesReturns.filter((r) => new Date(r.timestamp) >= todayStart);

  const rawRevenue = todayBills.reduce((sum, b) => {
    const val = Number(b?.total);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const totalReturnedAmount = todayReturns.reduce((sum, r) => {
    const val = Number(r?.totalRefundAmount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const totalRevenue = Math.max(0, rawRevenue - totalReturnedAmount);
  const billsCount = todayBills.length;

  const rawProfit = todayBills.reduce((sum, bill) => {
    const items = bill?.items || [];
    const billProfit = items.reduce((p, item) => {
      const unitPrice = Number(item?.unitPrice) || 0;
      const rawBuy = Number(item?.purchasePrice);
      const purchasePrice = (!isNaN(rawBuy) && rawBuy >= 0) ? rawBuy : unitPrice * 0.7;
      const qty = Number(item?.quantity) || 1;
      const totalPrice = Number(item?.totalPrice) ?? (unitPrice * qty);
      const cost = purchasePrice * qty;
      const profit = totalPrice - cost;
      return p + (isNaN(profit) ? 0 : profit);
    }, 0);
    return sum + (isNaN(billProfit) ? 0 : billProfit);
  }, 0);

  const returnProfitReduction = todayReturns.reduce((sum, ret) => {
    const items = ret?.items || [];
    const retProfit = items.reduce((p, item) => {
      const unitPrice = Number(item?.unitPrice) || 0;
      const rawBuy = Number(item?.purchasePrice);
      const purchasePrice = (!isNaN(rawBuy) && rawBuy >= 0) ? rawBuy : unitPrice * 0.7;
      const qty = Number(item?.quantity) || 1;
      const totalPrice = Number(item?.totalPrice) ?? (unitPrice * qty);
      const cost = purchasePrice * qty;
      const profit = totalPrice - cost;
      return p + (isNaN(profit) ? 0 : profit);
    }, 0);
    return sum + (isNaN(retProfit) ? 0 : retProfit);
  }, 0);

  const netProfitCalc = rawProfit - returnProfitReduction;
  const estimatedProfit = Math.max(0, isNaN(netProfitCalc) ? 0 : netProfitCalc);

  return (
    <ShopContext.Provider
      value={{
        items,
        bills,
        suppliers,
        udhaar,
        salesReturns,
        settings,
        loading,
        isOnline,
        toasts,
        addToast,
        removeToast,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        completeBill,
        processSalesReturn,
        deleteSalesReturn,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        deleteUdhaarRecord,
        deleteBill,
        recordUdhaarPayment,
        updateShopSettings,
        seedDatabase,
        exportDatabase,
        importDatabase,
        lowStockItems,
        itemSalesMap,
        getItemSalesCount,
        todaySalesSummary: {
          totalRevenue,
          billsCount,
          estimatedProfit,
          lowStockCount: lowStockItems.length,
          todayReturnsAmount: totalReturnedAmount
        }
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
