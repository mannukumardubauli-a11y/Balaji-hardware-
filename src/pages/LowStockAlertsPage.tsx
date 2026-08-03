import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertOctagon, 
  Plus, 
  Printer, 
  Trash2, 
  Share2, 
  CheckCircle2, 
  Search, 
  PackagePlus, 
  Layers, 
  X, 
  FileText,
  Copy,
  Check,
  Download,
  FileDown,
  Send,
  Clock,
  CheckSquare,
  Square,
  ArrowRight
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { downloadLowStockPDF, printLowStockPDF, shareLowStockPDF } from '../lib/pdfGenerator';

interface LowStockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  requiredQty: number;
  isManual?: boolean;
}

export interface PendingOrderItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  requiredQty: number;
  isManual?: boolean;
  checked: boolean;
}

export const LowStockAlertsPage: React.FC = () => {
  const { role } = useAuth();
  const { lowStockItems, items, settings, addToast, getItemSalesCount, updateInventoryItem } = useShop();

  // Active tab state: 'demand' (active low stock list) or 'pending' (generated pending orders list)
  const [activeTab, setActiveTab] = useState<'demand' | 'pending'>('demand');

  // Local state for manual items & adjusted required quantities
  const [manualItems, setManualItems] = useState<LowStockItem[]>(() => {
    try {
      const saved = localStorage.getItem('manual_low_stock_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // State for required quantities map { [itemId]: number }
  const [requiredQtys, setRequiredQtys] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('low_stock_required_qtys');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // State for Generated Pending Orders List
  const [pendingOrderItems, setPendingOrderItems] = useState<PendingOrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('pending_low_stock_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Modal State for adding manual item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Hardware');
  const [customCurrentStock, setCustomCurrentStock] = useState('0');
  const [customUnit, setCustomUnit] = useState('piece');
  const [customRequiredQty, setCustomRequiredQty] = useState('10');
  const [searchItemQuery, setSearchItemQuery] = useState('');

  // Save states to localStorage on change
  useEffect(() => {
    localStorage.setItem('manual_low_stock_items', JSON.stringify(manualItems));
  }, [manualItems]);

  useEffect(() => {
    localStorage.setItem('low_stock_required_qtys', JSON.stringify(requiredQtys));
  }, [requiredQtys]);

  useEffect(() => {
    localStorage.setItem('pending_low_stock_orders', JSON.stringify(pendingOrderItems));
  }, [pendingOrderItems]);

  // Combine auto low-stock items with manual items (avoiding duplicates)
  const combinedList: LowStockItem[] = [];

  // 1. Process Auto Low Stock Items
  lowStockItems.forEach((item) => {
    const qty = requiredQtys[item.id] !== undefined 
      ? requiredQtys[item.id] 
      : Math.max(item.lowStockThreshold * 3, 20); // Default sensible reorder quantity

    combinedList.push({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      requiredQty: qty,
      isManual: false
    });
  });

  // 2. Add Manual Items (if not already present)
  manualItems.forEach((mItem) => {
    if (!combinedList.some((existing) => existing.id === mItem.id || existing.name.toLowerCase() === mItem.name.toLowerCase())) {
      const qty = requiredQtys[mItem.id] !== undefined ? requiredQtys[mItem.id] : mItem.requiredQty;
      combinedList.push({
        ...mItem,
        requiredQty: qty
      });
    }
  });

  // Sort list so that High Demand items (highest sales volume) appear at the top!
  combinedList.sort((a, b) => {
    const salesA = getItemSalesCount(a.id);
    const salesB = getItemSalesCount(b.id);
    if (salesA !== salesB) {
      return salesB - salesA;
    }
    return a.name.localeCompare(b.name);
  });

  // Active Low Stock List excludes items that are currently in pendingOrderItems!
  const activeLowStockList = combinedList.filter((item) => {
    return !pendingOrderItems.some(
      (p) => p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase()
    );
  });

  // Update required quantity for any item
  const handleUpdateQty = (id: string, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setRequiredQtys((prev) => ({
      ...prev,
      [id]: validQty
    }));
  };

  // Remove manual item or auto item override
  const handleRemoveItem = (id: string) => {
    setManualItems((prev) => prev.filter((item) => item.id !== id));
    setRequiredQtys((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    addToast('Item Removed', 'Removed item from low stock demand list.', 'info');
  };

  // Add Manual Item to List
  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedInventoryItemId) {
      // Picked from inventory
      const found = items.find((i) => i.id === selectedInventoryItemId);
      if (found) {
        const newItem: LowStockItem = {
          id: found.id,
          name: found.name,
          category: found.category,
          currentStock: found.currentStock,
          unit: found.unit,
          requiredQty: parseInt(customRequiredQty) || 10,
          isManual: true
        };
        setManualItems((prev) => [...prev, newItem]);
        setRequiredQtys((prev) => ({ ...prev, [found.id]: parseInt(customRequiredQty) || 10 }));
        addToast('Item Added', `"${found.name}" added to Low Stock Order List.`, 'success');
      }
    } else if (customName.trim()) {
      // Custom typed item
      const newId = `manual_${Date.now()}`;
      const newItem: LowStockItem = {
        id: newId,
        name: customName.trim(),
        category: customCategory,
        currentStock: parseInt(customCurrentStock) || 0,
        unit: customUnit || 'piece',
        requiredQty: parseInt(customRequiredQty) || 10,
        isManual: true
      };
      setManualItems((prev) => [...prev, newItem]);
      setRequiredQtys((prev) => ({ ...prev, [newId]: parseInt(customRequiredQty) || 10 }));
      addToast('Custom Item Added', `"${customName}" added to order demand list.`, 'success');
    } else {
      addToast('Select Item', 'Please select a product or enter a item name.', 'error');
      return;
    }

    // Reset Form
    setSelectedInventoryItemId('');
    setCustomName('');
    setCustomCurrentStock('0');
    setCustomRequiredQty('10');
    setIsAddModalOpen(false);
  };

  // CONVERT CURRENT LOW STOCK LIST TO PENDING ORDER BATCH
  const handleGeneratePendingOrder = () => {
    if (activeLowStockList.length === 0) {
      addToast('Empty List', 'There are no active low stock items to convert.', 'error');
      return;
    }

    const newPendingItems: PendingOrderItem[] = activeLowStockList.map((item) => ({
      ...item,
      checked: true // Checked by default
    }));

    setPendingOrderItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
      const filtered = newPendingItems.filter(
        (i) => !existingIds.has(i.id) && !existingNames.has(i.name.toLowerCase())
      );
      return [...prev, ...filtered];
    });

    setActiveTab('pending');
    addToast('Moved to Pending Orders', `${activeLowStockList.length} items moved to Pending Orders list.`, 'success');
  };

  // Ensure Pending List is updated when exporting PDF
  const syncPendingBatchOnPdfGenerate = () => {
    if (activeLowStockList.length > 0) {
      const newPendingItems: PendingOrderItem[] = activeLowStockList.map((item) => ({
        ...item,
        checked: true
      }));

      setPendingOrderItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
        const filtered = newPendingItems.filter(
          (i) => !existingIds.has(i.id) && !existingNames.has(i.name.toLowerCase())
        );
        return [...prev, ...filtered];
      });
      setActiveTab('pending');
    }
  };

  // Helper to get PDF export items
  const getPdfExportList = () => {
    if (pendingOrderItems.length > 0) {
      return pendingOrderItems;
    }
    return activeLowStockList;
  };

  // Automatically convert to Pending Orders list and open PDF options modal when Generate PDF is tapped
  const handleGeneratePdfClick = () => {
    if (activeLowStockList.length === 0 && pendingOrderItems.length === 0) {
      addToast('Empty List', 'There are no low stock items to generate.', 'error');
      return;
    }

    if (activeLowStockList.length > 0) {
      const count = activeLowStockList.length;
      syncPendingBatchOnPdfGenerate();
      addToast('Order Generated', `${count} items automatically moved to Pending Orders list.`, 'success');
    } else {
      setActiveTab('pending');
    }
    setIsPdfOptionsModalOpen(true);
  };

  // Handle PDF Export Options
  const handleDownloadPDF = () => {
    const listToExport = getPdfExportList();
    if (listToExport.length === 0) {
      addToast('Empty List', 'There are no low stock items to export.', 'error');
      return;
    }
    syncPendingBatchOnPdfGenerate();
    downloadLowStockPDF(listToExport, settings);
    addToast('PDF Downloaded', 'Low Stock Order List PDF downloaded.', 'success');
    setIsPdfOptionsModalOpen(false);
    setActiveTab('pending');
  };

  const handlePrintPDFDirect = () => {
    const listToExport = getPdfExportList();
    if (listToExport.length === 0) {
      addToast('Empty List', 'There are no low stock items to print.', 'error');
      return;
    }
    syncPendingBatchOnPdfGenerate();
    printLowStockPDF(listToExport, settings);
    addToast('Print Window', 'Opening print preview window.', 'info');
    setIsPdfOptionsModalOpen(false);
    setActiveTab('pending');
  };

  const handleSharePDF = async () => {
    const listToExport = getPdfExportList();
    if (listToExport.length === 0) {
      addToast('Empty List', 'There are no low stock items to share.', 'error');
      return;
    }
    syncPendingBatchOnPdfGenerate();
    const shared = await shareLowStockPDF(listToExport, settings);
    if (shared) {
      addToast('PDF Shared', 'Low Stock Order List shared successfully.', 'success');
    } else {
      addToast('PDF Ready', 'PDF saved to device for sharing.', 'info');
    }
    setIsPdfOptionsModalOpen(false);
    setActiveTab('pending');
  };

  // Toggle Checkbox for Pending Order Item
  const handleTogglePendingCheck = (id: string) => {
    setPendingOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Toggle All Pending Checkboxes
  const handleToggleAllPending = (checkedState: boolean) => {
    setPendingOrderItems((prev) => prev.map((item) => ({ ...item, checked: checkedState })));
  };

  // Update Pending Item Quantity
  const handleUpdatePendingQty = (id: string, qty: number) => {
    const validQty = Math.max(1, qty);
    setPendingOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, requiredQty: validQty } : item))
    );
  };

  // SUBMIT CHECKED ITEMS TO INVENTORY & RETURN UNCHECKED TO LOW STOCK
  const handleSubmitCheckedToInventory = async () => {
    const checkedItems = pendingOrderItems.filter((i) => i.checked);
    const uncheckedItems = pendingOrderItems.filter((i) => !i.checked);

    if (checkedItems.length === 0) {
      addToast('No Items Selected', 'Please check at least one product to add to inventory.', 'warning');
      return;
    }

    let updatedCount = 0;

    for (const pItem of checkedItems) {
      // Find matching inventory item by ID or name
      const existingInvItem = items.find(
        (inv) => inv.id === pItem.id || inv.name.toLowerCase() === pItem.name.toLowerCase()
      );

      if (existingInvItem) {
        const newStock = existingInvItem.currentStock + pItem.requiredQty;
        await updateInventoryItem(existingInvItem.id, { currentStock: newStock });
        updatedCount++;
      }

      // Remove from manualItems if present
      setManualItems((prev) => prev.filter((m) => m.id !== pItem.id && m.name.toLowerCase() !== pItem.name.toLowerCase()));
      setRequiredQtys((prev) => {
        const copy = { ...prev };
        delete copy[pItem.id];
        return copy;
      });
    }

    // Keep UNCHECKED items in pendingOrderItems or clear if all checked
    setPendingOrderItems(uncheckedItems);

    addToast(
      'Inventory Updated!',
      `${updatedCount} items added to Inventory. ${uncheckedItems.length} unchecked items remain in Low Stock list.`,
      'success'
    );

    // Switch back to demand tab to show remaining low stock items
    if (uncheckedItems.length === 0) {
      setActiveTab('demand');
    }
  };

  // Discard Pending Orders List
  const handleDiscardPendingOrders = () => {
    if (window.confirm('Clear pending orders list? Unchecked items are already in active low stock list.')) {
      setPendingOrderItems([]);
      setActiveTab('demand');
      addToast('Pending List Cleared', 'Pending reorder batch cleared.', 'info');
    }
  };

  // Filter available inventory items for picker dropdown
  const filteredInventoryItems = items.filter((item) => {
    if (!searchItemQuery) return true;
    const q = searchItemQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  if (role !== 'Owner') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-4">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
          <AlertOctagon className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-white">Owner Access Required</h2>
        <p className="text-sm text-zinc-400 max-w-md">
          Low Stock Alerts & Reorder Demand lists are restricted to the Shop Owner role only.
        </p>
      </div>
    );
  }

  const checkedPendingCount = pendingOrderItems.filter((i) => i.checked).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-[#2B2D2F] border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertOctagon className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-xl font-bold text-white">Stock Reorder & Demand List</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Auto-detected low stock products + manual items list for wholesale ordering.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Item Manually
          </button>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION: Active Low Stock vs Pending Orders */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('demand')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'demand'
              ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20'
              : 'bg-white dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-400 border border-slate-300 dark:border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Active Low Stock List</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-zinc-900/60 text-slate-800 dark:text-white border border-slate-300 dark:border-zinc-700">
            {activeLowStockList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
            activeTab === 'pending'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-white dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-400 border border-slate-300 dark:border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Orders List</span>
          {pendingOrderItems.length > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-500/40">
              {pendingOrderItems.length}
            </span>
          ) : (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
              0
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ACTIVE LOW STOCK DEMAND LIST */}
      {activeTab === 'demand' && (
        <>
          {activeLowStockList.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 shadow-lg">
              <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400 mb-4 stroke-[1.5]" />
              <h3 className="text-lg font-bold text-white">No Items In Active Low Stock List</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-5">
                All low stock items have been converted to Pending Orders or inventory stock is healthy.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Item Manually
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 bg-[#2B2D2F]/80 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FF6B00]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Total Reorder Demand Items: ({activeLowStockList.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGeneratePendingOrder}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" /> Convert to Pending List
                  </button>
                </div>
              </div>

              {/* MOBILE LIST VIEW (For phones) */}
              <div className="block md:hidden space-y-2.5 p-3 divide-y divide-zinc-800/60">
                {activeLowStockList.map((item, index) => {
                  const isOut = item.currentStock === 0;
                  const salesCount = getItemSalesCount(item.id);

                  return (
                    <div key={item.id} className="pt-2.5 first:pt-0 space-y-2">
                      {/* Top Header: Index, Item Name & Category */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-zinc-500 font-bold mt-0.5 shrink-0">
                            #{index + 1}
                          </span>
                          <div className="space-y-1 min-w-0">
                            <h4 className="text-xs font-bold text-white leading-snug">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {salesCount > 0 && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                                  🔥 High Demand ({salesCount} Sold)
                                </span>
                              )}
                              <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-zinc-300 border border-zinc-700">
                                {item.category}
                              </span>
                              {item.isManual && (
                                <span className="text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30 font-semibold">
                                  Manual
                                </span>
                              )}
                              {isOut ? (
                                <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                  Critical Out
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Low Stock
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-zinc-400 hover:text-red-400 bg-zinc-800 rounded-lg cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Required Order Quantity Controls */}
                      <div className="bg-[#2B2D2F] p-2 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#FF6B00]">
                          Order Required:
                        </span>

                        <div className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, item.requiredQty - 5)}
                            className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-[10px] cursor-pointer"
                          >
                            -5
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.requiredQty}
                            onChange={(e) => handleUpdateQty(item.id, parseInt(e.target.value) || 1)}
                            className="w-12 text-center bg-transparent font-bold text-white text-xs focus:outline-none"
                          />
                          <span className="text-[10px] text-zinc-400 pr-1">{item.unit}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, item.requiredQty + 5)}
                            className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-[10px] cursor-pointer"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (Hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#2B2D2F] text-zinc-400 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Item Name & Category</th>
                      <th className="py-3 px-4 text-center">Required Order Qty</th>
                      <th className="py-3 px-4 text-center">Status Tag</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {activeLowStockList.map((item, index) => {
                      const isOut = item.currentStock === 0;
                      const salesCount = getItemSalesCount(item.id);

                      return (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-500 font-bold">
                            {index + 1}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                              <span>{item.name}</span>
                              {salesCount > 0 && (
                                <span className="bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 px-1.5 py-0.5 rounded text-[10px] font-extrabold shrink-0">
                                  🔥 High Demand ({salesCount} Sold)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                              <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 border border-zinc-700">
                                {item.category}
                              </span>
                              {item.isManual && (
                                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">
                                  Manual Add
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Required Order Qty Input */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-[#2B2D2F] border border-zinc-700 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, item.requiredQty - 5)}
                                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                -5
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.requiredQty}
                                onChange={(e) => handleUpdateQty(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center bg-transparent font-bold text-white text-xs focus:outline-none"
                              />
                              <span className="text-[10px] text-zinc-400 pr-1">{item.unit}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, item.requiredQty + 5)}
                                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                +5
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isOut ? (
                              <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                                Critical Out
                              </span>
                            ) : item.isManual ? (
                              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-[11px] font-bold">
                                Manual Demand
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-bold">
                                Low Stock
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Remove from Order List"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action Footer */}
              <div className="p-4 bg-[#2B2D2F] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-zinc-400">
                  <span className="font-bold text-white">Sri Balaji Hardware and Paint Store</span>
                  <span className="hidden sm:inline"> • Low Stock Order Engine ({activeLowStockList.length} Items)</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={handleGeneratePdfClick}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <FileText className="w-4.5 h-4.5 text-white" /> Generate PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: PENDING ORDERS LIST (Checkboxes to add to inventory or return to low stock) */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingOrderItems.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 shadow-lg space-y-4">
              <Clock className="w-16 h-16 mx-auto text-amber-400/80 mb-2 stroke-[1.5]" />
              <h3 className="text-lg font-bold text-white">No Pending Orders List</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Generate a PDF or click "Convert to Pending List" from the Active Low Stock list to create a pending reorder batch.
              </p>
              {activeLowStockList.length > 0 && (
                <button
                  onClick={handleGeneratePendingOrder}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-900/20"
                >
                  <Clock className="w-4 h-4" /> Convert {activeLowStockList.length} Items to Pending Orders
                </button>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
              {/* Top Banner Info */}
              <div className="p-4 bg-emerald-950/40 border-b border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Pending Reorder Batch ({pendingOrderItems.length} Products)</h3>
                  </div>
                  <p className="text-xs text-emerald-300/80">
                    Tick checkboxes for items received from supplier to add directly to Inventory. Unchecked items will stay in Low Stock Alerts.
                  </p>
                </div>

                {/* Quick Select All Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleAllPending(true)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg border border-zinc-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Select All
                  </button>
                  <button
                    onClick={() => handleToggleAllPending(false)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg border border-zinc-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5 text-zinc-400" /> Uncheck All
                  </button>
                </div>
              </div>

              {/* MOBILE CHECKBOX LIST VIEW */}
              <div className="block md:hidden divide-y divide-zinc-800/80 p-3 space-y-3">
                {pendingOrderItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`pt-3 first:pt-0 p-3 rounded-xl border transition-all ${
                      item.checked
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-zinc-900 border-zinc-800 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleTogglePendingCheck(item.id)}
                        className="w-5 h-5 mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                      />

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            onClick={() => handleTogglePendingCheck(item.id)}
                            className={`text-xs font-bold cursor-pointer ${
                              item.checked ? 'text-white' : 'text-zinc-400'
                            }`}
                          >
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[10px]">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 border border-zinc-700">
                            {item.category}
                          </span>
                          <span className="text-zinc-400">
                            Ordered: <strong className="text-emerald-400">{item.requiredQty} {item.unit}</strong>
                          </span>
                        </div>

                        {/* Received Quantity Editor */}
                        <div className="pt-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-zinc-300">
                            Received Qty:
                          </span>
                          <div className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdatePendingQty(item.id, item.requiredQty - 1)}
                              className="w-6 h-6 rounded bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.requiredQty}
                              onChange={(e) => handleUpdatePendingQty(item.id, parseInt(e.target.value) || 1)}
                              className="w-12 text-center bg-transparent font-bold text-white text-xs focus:outline-none"
                            />
                            <span className="text-[10px] text-zinc-400 pr-1">{item.unit}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdatePendingQty(item.id, item.requiredQty + 1)}
                              className="w-6 h-6 rounded bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP CHECKBOX TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#2B2D2F] text-zinc-400 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={checkedPendingCount === pendingOrderItems.length}
                          onChange={(e) => handleToggleAllPending(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Product Description & Category</th>
                      <th className="py-3 px-4 text-center">Quantity Received to Add</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {pendingOrderItems.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          item.checked ? 'bg-emerald-950/10 hover:bg-emerald-950/20' : 'hover:bg-zinc-800/40 opacity-70'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleTogglePendingCheck(item.id)}
                            className="w-4.5 h-4.5 accent-emerald-500 rounded cursor-pointer"
                          />
                        </td>

                        <td className="py-3.5 px-4">
                          <div
                            onClick={() => handleTogglePendingCheck(item.id)}
                            className={`font-bold text-sm cursor-pointer ${
                              item.checked ? 'text-white' : 'text-zinc-400 line-through'
                            }`}
                          >
                            {item.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 border border-zinc-700">
                              {item.category}
                            </span>
                          </div>
                        </td>

                        {/* Received Quantity Input */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-[#2B2D2F] border border-zinc-700 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdatePendingQty(item.id, item.requiredQty - 1)}
                              className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.requiredQty}
                              onChange={(e) => handleUpdatePendingQty(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center bg-transparent font-bold text-white text-xs focus:outline-none"
                            />
                            <span className="text-[10px] text-zinc-400 pr-1">{item.unit}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdatePendingQty(item.id, item.requiredQty + 1)}
                              className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {item.checked ? (
                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Ready to Receive
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[11px] font-medium">
                              Keep in Low Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="p-4 bg-[#2B2D2F] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-zinc-300 flex items-center gap-2">
                  <span className="font-extrabold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {checkedPendingCount} / {pendingOrderItems.length} Checked
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    Unchecked items will return to Active Low Stock List.
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={handleDiscardPendingOrders}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clear Batch
                  </button>

                  <button
                    onClick={handleSubmitCheckedToInventory}
                    disabled={checkedPendingCount === 0}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <PackagePlus className="w-4.5 h-4.5" /> Submit & Add ({checkedPendingCount}) to Inventory
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: GENERATE PDF OPTIONS (Download, Print, Share) */}
      <AnimatePresence>
        {isPdfOptionsModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => setIsPdfOptionsModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Generate Low Stock PDF</h3>
                  <p className="text-xs text-zinc-400">
                    {getPdfExportList().length} items in reorder list • Choose an action below
                  </p>
                </div>
              </div>

              {/* Summary pill */}
              <div className="p-3 bg-[#202224] rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300">
                <span className="font-semibold text-zinc-400">Total Demand Items:</span>
                <span className="font-extrabold text-white bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                  {getPdfExportList().length} Products
                </span>
              </div>

              {/* 3 Main Action Options */}
              <div className="space-y-3">
                {/* 1. Download PDF */}
                <button
                  onClick={handleDownloadPDF}
                  className="w-full p-3.5 bg-[#202224] hover:bg-emerald-950/30 border border-zinc-800 hover:border-emerald-500/50 rounded-xl transition-all flex items-center justify-between gap-3 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        Download PDF
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Download low stock PDF file to device (फ़ाइल डाउनलोड करें)
                      </p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                </button>

                {/* 2. Print PDF */}
                <button
                  onClick={handlePrintPDFDirect}
                  className="w-full p-3.5 bg-[#202224] hover:bg-sky-950/30 border border-zinc-800 hover:border-sky-500/50 rounded-xl transition-all flex items-center justify-between gap-3 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-lg group-hover:scale-110 transition-transform">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                        Print PDF
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Open print preview directly (प्रिंट प्रिव्यू / प्रिंट करें)
                      </p>
                    </div>
                  </div>
                  <Printer className="w-4 h-4 text-zinc-500 group-hover:text-sky-400 transition-colors" />
                </button>

                {/* 3. Share PDF */}
                <button
                  onClick={handleSharePDF}
                  className="w-full p-3.5 bg-[#202224] hover:bg-amber-950/30 border border-zinc-800 hover:border-amber-500/50 rounded-xl transition-all flex items-center justify-between gap-3 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        Share PDF
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Share PDF via WhatsApp or other apps (शेयर करें)
                      </p>
                    </div>
                  </div>
                  <Share2 className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsPdfOptionsModalOpen(false)}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD MANUAL ITEM TO LOW STOCK LIST */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#FF6B00]/10 text-[#FF6B00] rounded-xl border border-[#FF6B00]/20">
                  <PackagePlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add Item to Order Demand List</h3>
                  <p className="text-xs text-zinc-400">
                    Pick an existing inventory item or add a custom non-stock item.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddManualItem} className="space-y-4">
                {/* 1. Pick From Inventory */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                    <span>Option A: Pick Product from Inventory</span>
                    <span className="text-[10px] font-normal text-zinc-500">Auto fills details</span>
                  </label>

                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search product name or category..."
                      value={searchItemQuery}
                      onChange={(e) => setSearchItemQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#202224] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00] mb-2"
                    />
                  </div>

                  <select
                    value={selectedInventoryItemId}
                    onChange={(e) => {
                      setSelectedInventoryItemId(e.target.value);
                      if (e.target.value) {
                        setCustomName('');
                      }
                    }}
                    className="w-full p-2.5 bg-[#202224] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="">-- Choose Existing Item --</option>
                    {filteredInventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.category}) - Stock: {item.currentStock} {item.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-zinc-500 font-bold uppercase">
                    OR Custom Item
                  </span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                {/* 2. Custom Item Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 mb-1 block">
                      Custom Item Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Asian Paints Royale 10L, Copper Wire 1mm..."
                      value={customName}
                      onChange={(e) => {
                        setCustomName(e.target.value);
                        if (e.target.value) setSelectedInventoryItemId('');
                      }}
                      className="w-full p-2.5 bg-[#202224] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 mb-1 block">
                        Category
                      </label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full p-2.5 bg-[#202224] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                      >
                        <option value="Hardware">Hardware</option>
                        <option value="Paints">Paints</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Tools">Tools</option>
                        <option value="Chemicals">Chemicals</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-400 mb-1 block">
                        Unit Type
                      </label>
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="w-full p-2.5 bg-[#202224] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                      >
                        <option value="piece">piece</option>
                        <option value="box">box</option>
                        <option value="kg">kg</option>
                        <option value="bag">bag</option>
                        <option value="meter">meter</option>
                        <option value="set">set</option>
                        <option value="packet">packet</option>
                        <option value="liter">liter</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Required Purchase Quantity */}
                <div className="bg-[#202224] p-3 rounded-xl border border-zinc-800 space-y-1">
                  <label className="text-xs font-bold text-[#FF6B00] block">
                    Required Purchase / Order Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customRequiredQty}
                    onChange={(e) => setCustomRequiredQty(e.target.value)}
                    className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add to Order List
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
