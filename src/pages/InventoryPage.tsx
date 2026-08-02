import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Tag, 
  Boxes, 
  AlertOctagon, 
  X, 
  Check, 
  ShieldAlert, 
  RotateCcw, 
  PackageCheck, 
  IndianRupee 
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { InventoryItem } from '../types';
import { MaskedBuyRate } from '../components/MaskedBuyRate';

export const InventoryPage: React.FC = () => {
  const { items, addInventoryItem, updateInventoryItem, deleteInventoryItem, seedDatabase, addToast, getItemSalesCount } = useShop();
  const { role } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'All' | '🔥 High Demand' | 'In Stock' | 'Low Stock' | 'Out of Stock'>('All');

  // Quick Inline Edit State (Stock, Buy Rate, Sale Rate)
  const [activeInlineEdit, setActiveInlineEdit] = useState<{
    itemId: string;
    field: 'stock' | 'buyRate' | 'saleRate';
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  // Custom Category & Unit State
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState<boolean>(false);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  // Form Fields
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Fasteners');
  const [rackLocation, setRackLocation] = useState<string>('Rack A-1');
  const [unit, setUnit] = useState<string>('piece');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [barcode, setBarcode] = useState<string>('');

  // List of standard hardware categories + items categories + custom categories
  const defaultCategories = [
    'Plumbing',
    'Fasteners',
    'Electrical',
    'Paints & Chemicals',
    'Building Materials',
    'Hand Tools',
    'Sanitary',
    'General Hardware'
  ];

  const availableCategories = Array.from(
    new Set([...defaultCategories, ...items.map((i) => i.category), ...customCategories])
  ).filter(Boolean);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  const handleAddCustomCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed) {
      if (!customCategories.includes(trimmed)) {
        setCustomCategories((prev) => [...prev, trimmed]);
      }
      setCategory(trimmed);
      setIsAddingNewCategory(false);
      setNewCategoryInput('');
    }
  };

  const handleStockChange = async (item: InventoryItem, delta: number) => {
    if (role !== 'Owner') {
      addToast('Owner Access Required', 'Helper role cannot edit inventory.', 'warning');
      return;
    }
    const newStock = Math.max(0, item.currentStock + delta);
    if (newStock !== item.currentStock) {
      await updateInventoryItem(item.id, { currentStock: newStock });
    }
  };

  const handleSetStockDirect = async (item: InventoryItem, newStock: number) => {
    if (role !== 'Owner') {
      addToast('Owner Access Required', 'Helper role cannot edit inventory.', 'warning');
      return;
    }
    const safeStock = Math.max(0, isNaN(newStock) ? 0 : newStock);
    await updateInventoryItem(item.id, { currentStock: safeStock });
  };

  const handlePriceChange = async (
    item: InventoryItem,
    field: 'purchasePrice' | 'sellingPrice',
    delta: number
  ) => {
    if (role !== 'Owner') {
      addToast('Owner Access Required', 'Helper role cannot edit inventory.', 'warning');
      return;
    }
    const currentVal = item[field] || 0;
    const newVal = Math.max(0, currentVal + delta);
    if (newVal !== currentVal) {
      await updateInventoryItem(item.id, { [field]: newVal });
    }
  };

  const handleSetPriceDirect = async (
    item: InventoryItem,
    field: 'purchasePrice' | 'sellingPrice',
    newPrice: number
  ) => {
    if (role !== 'Owner') {
      addToast('Owner Access Required', 'Helper role cannot edit inventory.', 'warning');
      return;
    }
    const safeVal = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
    await updateInventoryItem(item.id, { [field]: safeVal });
  };

  const handleOpenAddModal = () => {
    if (role !== 'Owner') {
      addToast('Owner Access Required', 'Helper role cannot add or edit inventory items.', 'warning');
      return;
    }
    setEditingItem(null);
    setName('');
    setCategory(availableCategories[0] || 'Fasteners');
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setRackLocation('Rack A-1');
    setUnit('piece');
    setPurchasePrice(50);
    setSellingPrice(75);
    setCurrentStock(20);
    setLowStockThreshold(5);
    setBarcode(`HW-${Date.now().toString().slice(-4)}`);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    if (role !== 'Owner') {
      addToast('Owner Access Required', 'Helper role cannot add or edit inventory items.', 'warning');
      return;
    }
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setRackLocation(item.rackLocation);
    setUnit(item.unit);
    setPurchasePrice(item.purchasePrice);
    setSellingPrice(item.sellingPrice);
    setCurrentStock(item.currentStock);
    setLowStockThreshold(item.lowStockThreshold);
    setBarcode(item.barcode || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      await updateInventoryItem(editingItem.id, {
        name,
        category,
        rackLocation,
        unit,
        purchasePrice,
        sellingPrice,
        currentStock,
        lowStockThreshold,
        barcode
      });
    } else {
      await addInventoryItem({
        name,
        category,
        rackLocation,
        unit,
        purchasePrice,
        sellingPrice,
        currentStock,
        lowStockThreshold,
        barcode
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, itemName: string) => {
    setItemToDelete({ id, name: itemName });
  };

  // Filter Items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === '🔥 High Demand') matchesStock = getItemSalesCount(item.id) > 0;
    if (stockFilter === 'In Stock') matchesStock = item.currentStock > item.lowStockThreshold;
    if (stockFilter === 'Low Stock') matchesStock = item.currentStock <= item.lowStockThreshold && item.currentStock > 0;
    if (stockFilter === 'Out of Stock') matchesStock = item.currentStock === 0;

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      item.name.toLowerCase().includes(q) ||
      item.rackLocation.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.toLowerCase().includes(q));

    return matchesCategory && matchesStock && matchesQuery;
  }).sort((a, b) => {
    const q = searchQuery.toLowerCase().trim();
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

    // High Demand Priority: Items with higher total sales volume stay on top!
    const salesA = getItemSalesCount(a.id);
    const salesB = getItemSalesCount(b.id);
    if (salesA !== salesB) {
      return salesB - salesA;
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#2B2D2F] border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-xl font-bold text-white">Inventory & Rack Management</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Track stock counts, shelf locations, purchase vs selling prices, and safety alert levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === 'Owner' ? (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-[#FF6B00]/20 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Hardware Item
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Helper Mode (View Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 sm:p-4 rounded-2xl shadow-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          {/* Search */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item name, rack (Rack B-2), category..."
              className="w-full pl-10 pr-4 py-2 bg-[#2B2D2F] border border-zinc-700/80 rounded-xl text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          {/* Stock Filter Selector */}
          <div className="md:col-span-4 flex items-center bg-[#2B2D2F] p-1 rounded-xl border border-zinc-700/80 overflow-x-auto no-scrollbar">
            {(['All', '🔥 High Demand', 'In Stock', 'Low Stock', 'Out of Stock'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStockFilter(filter)}
                className={`flex-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all whitespace-nowrap ${
                  stockFilter === filter
                    ? 'bg-[#FF6B00] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MOBILE LIST VIEW (Visible on small screens) */}
      <div className="block md:hidden space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
            <Boxes className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-300">No items match your search</p>
            <p className="text-xs text-zinc-500 mt-1">Try resetting filters or click Add Hardware Item.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOut = item.currentStock === 0;
            const isLow = item.currentStock <= item.lowStockThreshold && !isOut;
            const salesCount = getItemSalesCount(item.id);

            return (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-md space-y-2.5"
              >
                {/* Item Name & Status Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {salesCount > 0 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                          🔥 High Demand ({salesCount} Sold)
                        </span>
                      )}
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {item.category}
                      </span>
                      {item.rackLocation && (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-[#FF6B00]" />
                          {item.rackLocation}
                        </span>
                      )}
                      {item.barcode && (
                        <span className="text-[9px] text-zinc-500 font-mono">
                          [{item.barcode}]
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {activeInlineEdit?.itemId === item.id && activeInlineEdit?.field === 'stock' ? (
                      <div className="flex items-center gap-1 bg-[#2B2D2F] border border-[#FF6B00] rounded-xl p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => handleStockChange(item, -1)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 text-red-400 hover:bg-red-500/20 active:scale-90 font-black text-base flex items-center justify-center border border-zinc-700"
                          title="Decrease stock (-1)"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.currentStock}
                          onChange={(e) => handleSetStockDirect(item, parseInt(e.target.value))}
                          className="w-12 text-center bg-zinc-900 border border-zinc-700 rounded-md font-bold text-white text-xs font-mono py-1 focus:outline-none focus:border-[#FF6B00]"
                        />
                        <button
                          type="button"
                          onClick={() => handleStockChange(item, 1)}
                          className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 active:scale-90 font-black text-base flex items-center justify-center shadow-sm"
                          title="Increase stock (+1)"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveInlineEdit(null)}
                          className="p-1 text-zinc-400 hover:text-emerald-400"
                          title="Done"
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        {role === 'Owner' ? (
                          <button
                            type="button"
                            onClick={() => setActiveInlineEdit({ itemId: item.id, field: 'stock' })}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95 cursor-pointer shadow-sm ${
                              isOut
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title="Tap to change quantity (+ / -)"
                          >
                            <span>{isOut ? 'Out of Stock' : `${item.currentStock} ${item.unit}`}</span>
                            <span className="text-[9px] bg-black/40 px-1 py-0.2 rounded text-zinc-300 font-semibold">
                              ±
                            </span>
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isOut
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : `${item.currentStock} ${item.unit}`}
                          </span>
                        )}
                        <div className="text-[9px] text-zinc-500 mt-0.5">Min: {item.lowStockThreshold}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rates & Action Buttons */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Buy Rate */}
                    <div>
                      <span className="text-[8px] text-zinc-500 block uppercase font-normal">Buy Rate</span>
                      {activeInlineEdit?.itemId === item.id && activeInlineEdit?.field === 'buyRate' ? (
                        <div className="flex items-center gap-1 bg-[#2B2D2F] border border-[#FF6B00] rounded-lg p-0.5 mt-0.5 shadow-md">
                          <button
                            type="button"
                            onClick={() => handlePriceChange(item, 'purchasePrice', -1)}
                            className="w-5 h-5 rounded bg-zinc-800 text-red-400 hover:bg-red-500/20 active:scale-90 font-bold text-xs flex items-center justify-center border border-zinc-700"
                            title="Decrease Buy Rate (-1)"
                          >
                            -
                          </button>
                          <div className="flex items-center text-[11px] font-mono font-bold text-zinc-200 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5">
                            <span className="text-zinc-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={item.purchasePrice}
                              onChange={(e) => handleSetPriceDirect(item, 'purchasePrice', parseFloat(e.target.value))}
                              className="w-10 text-center bg-transparent focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePriceChange(item, 'purchasePrice', 1)}
                            className="w-5 h-5 rounded bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 active:scale-90 font-bold text-xs flex items-center justify-center"
                            title="Increase Buy Rate (+1)"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveInlineEdit(null)}
                            className="p-0.5 text-emerald-400 hover:text-emerald-300"
                            title="Done"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MaskedBuyRate
                            price={item.purchasePrice}
                            prefix=""
                            showIcon
                          />
                          {role === 'Owner' && (
                            <button
                              type="button"
                              onClick={() => setActiveInlineEdit({ itemId: item.id, field: 'buyRate' })}
                              className="text-[8px] text-zinc-500 hover:text-[#FF6B00] font-bold px-1 py-0.5 rounded bg-zinc-800/40 border border-zinc-800"
                              title="Edit Buy Rate"
                            >
                              ±
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="h-5 w-px bg-zinc-800" />

                    {/* Sale Rate */}
                    <div>
                      <span className="text-[9px] text-zinc-400 block uppercase font-medium">Sale Rate</span>
                      {activeInlineEdit?.itemId === item.id && activeInlineEdit?.field === 'saleRate' ? (
                        <div className="flex items-center gap-1 bg-[#2B2D2F] border border-[#FF6B00] rounded-lg p-0.5 mt-0.5 shadow-md">
                          <button
                            type="button"
                            onClick={() => handlePriceChange(item, 'sellingPrice', -1)}
                            className="w-5 h-5 rounded bg-zinc-800 text-red-400 hover:bg-red-500/20 active:scale-90 font-bold text-xs flex items-center justify-center border border-zinc-700"
                            title="Decrease Sale Rate (-1)"
                          >
                            -
                          </button>
                          <div className="flex items-center text-[11px] font-mono font-bold text-[#FF6B00] bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5">
                            <span>₹</span>
                            <input
                              type="number"
                              min="0"
                              value={item.sellingPrice}
                              onChange={(e) => handleSetPriceDirect(item, 'sellingPrice', parseFloat(e.target.value))}
                              className="w-10 text-center bg-transparent focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePriceChange(item, 'sellingPrice', 1)}
                            className="w-5 h-5 rounded bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 active:scale-90 font-bold text-xs flex items-center justify-center"
                            title="Increase Sale Rate (+1)"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveInlineEdit(null)}
                            className="p-0.5 text-emerald-400 hover:text-emerald-300"
                            title="Done"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : role === 'Owner' ? (
                        <button
                          type="button"
                          onClick={() => setActiveInlineEdit({ itemId: item.id, field: 'saleRate' })}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] font-mono bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.5 rounded transition-all active:scale-95 cursor-pointer mt-0.5"
                          title="Tap to change Sale Rate"
                        >
                          <span>₹{item.sellingPrice}/{item.unit}</span>
                          <span className="text-[9px] text-zinc-300 font-bold">±</span>
                        </button>
                      ) : (
                        <span className="inline-block text-xs font-bold text-[#FF6B00] font-mono bg-zinc-800/80 border border-zinc-800 px-1.5 py-0.5 rounded mt-0.5">
                          ₹{item.sellingPrice}/{item.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {role === 'Owner' ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-medium select-none">🔒 View Only</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Visible on tablet and desktop screens) */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2B2D2F] text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-800">
                <th className="p-4">Item & Rack Location</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4 text-right">Purchase Price</th>
                <th className="p-4 text-right">Selling Price</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    <Boxes className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-zinc-300">No items match your criteria</p>
                    <p className="text-xs text-zinc-500 mt-1">Try resetting filters or click Add Item.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOut = item.currentStock === 0;
                  const isLow = item.currentStock <= item.lowStockThreshold && !isOut;
                  const salesCount = getItemSalesCount(item.id);

                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                      {/* Name & Rack */}
                      <td className="p-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                          <span>{item.name}</span>
                          {salesCount > 0 && (
                            <span className="bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 px-1.5 py-0.5 rounded text-[10px] font-extrabold shrink-0">
                              🔥 High Demand ({salesCount} Sold)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 font-mono text-[11px] bg-[#2B2D2F] px-2 py-0.5 rounded text-orange-400 font-semibold border border-zinc-700">
                            <MapPin className="w-3 h-3 text-[#FF6B00]" />
                            {item.rackLocation}
                          </span>
                          {item.barcode && (
                            <span className="font-mono text-[10px] text-zinc-400">
                              [{item.barcode}]
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-semibold text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      {/* Stock Status */}
                      <td className="p-4">
                        {activeInlineEdit?.itemId === item.id && activeInlineEdit?.field === 'stock' ? (
                          <div className="inline-flex items-center gap-1.5 bg-[#2B2D2F] border border-[#FF6B00] rounded-xl p-1 shadow-md">
                            <button
                              type="button"
                              onClick={() => handleStockChange(item, -1)}
                              className="w-7 h-7 rounded-lg bg-zinc-800 text-red-400 hover:bg-red-500/20 active:scale-90 font-black text-base flex items-center justify-center border border-zinc-700"
                              title="Decrease stock (-1)"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={item.currentStock}
                              onChange={(e) => handleSetStockDirect(item, parseInt(e.target.value))}
                              className="w-14 text-center bg-zinc-900 border border-zinc-700 rounded-md font-bold text-white text-xs font-mono py-1 focus:outline-none focus:border-[#FF6B00]"
                            />
                            <span className="text-[10px] text-zinc-300 font-medium">{item.unit}</span>
                            <button
                              type="button"
                              onClick={() => handleStockChange(item, 1)}
                              className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 active:scale-90 font-black text-base flex items-center justify-center shadow-sm"
                              title="Increase stock (+1)"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveInlineEdit(null)}
                              className="p-1 text-zinc-400 hover:text-emerald-400 ml-0.5"
                              title="Done"
                            >
                              <Check className="w-4 h-4 text-emerald-400" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {role === 'Owner' ? (
                              <button
                                type="button"
                                onClick={() => setActiveInlineEdit({ itemId: item.id, field: 'stock' })}
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                  isOut
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : isLow
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}
                                title="Click to adjust quantity (+ / -)"
                              >
                                <span>{isOut ? 'Out of Stock' : `${item.currentStock} ${item.unit}`}</span>
                                <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-zinc-300 font-semibold">
                                  ± Adjust
                                </span>
                              </button>
                            ) : (
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                                  isOut
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : isLow
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {isOut ? 'Out of Stock' : `${item.currentStock} ${item.unit}`}
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-400">
                              (Min: {item.lowStockThreshold})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Purchase Price (Buy Rate) */}
                      <td className="p-4 text-right font-mono">
                        {activeInlineEdit?.itemId === item.id && activeInlineEdit?.field === 'buyRate' ? (
                          <div className="inline-flex items-center gap-1 bg-[#2B2D2F] border border-[#FF6B00] rounded-xl p-1 shadow-md">
                            <button
                              type="button"
                              onClick={() => handlePriceChange(item, 'purchasePrice', -1)}
                              className="w-6 h-6 rounded bg-zinc-800 text-red-400 hover:bg-red-500/20 active:scale-90 font-bold text-xs flex items-center justify-center border border-zinc-700"
                              title="Decrease Buy Rate (-1)"
                            >
                              -
                            </button>
                            <div className="flex items-center text-xs font-mono font-bold text-zinc-200 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5">
                              <span className="text-zinc-500 pr-0.5">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={item.purchasePrice}
                                onChange={(e) => handleSetPriceDirect(item, 'purchasePrice', parseFloat(e.target.value))}
                                className="w-12 text-center bg-transparent focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePriceChange(item, 'purchasePrice', 1)}
                              className="w-6 h-6 rounded bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 active:scale-90 font-bold text-xs flex items-center justify-center"
                              title="Increase Buy Rate (+1)"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveInlineEdit(null)}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                              title="Done"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : role === 'Owner' ? (
                          <button
                            type="button"
                            onClick={() => setActiveInlineEdit({ itemId: item.id, field: 'buyRate' })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-all active:scale-95 cursor-pointer"
                            title="Click to adjust Buy Rate"
                          >
                            <span>₹{item.purchasePrice}</span>
                            <span className="text-[10px] text-[#FF6B00] font-bold">±</span>
                          </button>
                        ) : (
                          <span className="inline-block text-xs font-semibold text-zinc-300 font-mono bg-zinc-800/80 border border-zinc-800 px-2 py-1 rounded">
                            ₹{item.purchasePrice}
                          </span>
                        )}
                      </td>

                      {/* Selling Price (Sale Rate) */}
                      <td className="p-4 text-right font-mono">
                        {activeInlineEdit?.itemId === item.id && activeInlineEdit?.field === 'saleRate' ? (
                          <div className="inline-flex items-center gap-1 bg-[#2B2D2F] border border-[#FF6B00] rounded-xl p-1 shadow-md">
                            <button
                              type="button"
                              onClick={() => handlePriceChange(item, 'sellingPrice', -1)}
                              className="w-6 h-6 rounded bg-zinc-800 text-red-400 hover:bg-red-500/20 active:scale-90 font-bold text-xs flex items-center justify-center border border-zinc-700"
                              title="Decrease Sale Rate (-1)"
                            >
                              -
                            </button>
                            <div className="flex items-center text-xs font-mono font-bold text-[#FF6B00] bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5">
                              <span className="pr-0.5">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={item.sellingPrice}
                                onChange={(e) => handleSetPriceDirect(item, 'sellingPrice', parseFloat(e.target.value))}
                                className="w-12 text-center bg-transparent focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePriceChange(item, 'sellingPrice', 1)}
                              className="w-6 h-6 rounded bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 active:scale-90 font-bold text-xs flex items-center justify-center"
                              title="Increase Sale Rate (+1)"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveInlineEdit(null)}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                              title="Done"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : role === 'Owner' ? (
                          <button
                            type="button"
                            onClick={() => setActiveInlineEdit({ itemId: item.id, field: 'saleRate' })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#FF6B00] hover:text-[#FF6B00]/90 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-all active:scale-95 cursor-pointer"
                            title="Click to adjust Sale Rate"
                          >
                            <span>₹{item.sellingPrice}</span>
                            <span className="text-[10px] text-zinc-300 font-bold">±</span>
                          </button>
                        ) : (
                          <span className="inline-block text-xs font-bold text-[#FF6B00] font-mono bg-zinc-800/80 border border-zinc-800 px-2 py-1 rounded">
                            ₹{item.sellingPrice}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        {role === 'Owner' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                              title="Edit Item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-medium select-none">🔒 View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT ITEM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#2B2D2F] border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#FF6B00]" />
                  {editingItem ? 'Edit Inventory Item' : 'Add New Hardware Item'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Steel Wire Nails 2 Inch (1kg Box)"
                    className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Category (कैटेगरी)</label>
                    {isAddingNewCategory ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          required
                          value={newCategoryInput}
                          onChange={(e) => setNewCategoryInput(e.target.value)}
                          placeholder="Type category..."
                          className="w-full px-2.5 py-2 bg-[#2B2D2F] border border-[#FF6B00] rounded-xl text-white text-xs focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCategory();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="p-2 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl transition-colors shrink-0"
                          title="Save Category"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewCategory(false)}
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl transition-colors shrink-0"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={category}
                          onChange={(e) => {
                            if (e.target.value === '__add_new__') {
                              setIsAddingNewCategory(true);
                              setNewCategoryInput('');
                            } else {
                              setCategory(e.target.value);
                            }
                          }}
                          className="w-full px-2.5 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00] truncate"
                        >
                          {availableCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__add_new__" className="font-bold text-[#FF6B00]">
                            + Add New Category
                          </option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewCategory(true);
                            setNewCategoryInput('');
                          }}
                          className="p-2 bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30 text-[#FF6B00] border border-[#FF6B00]/40 rounded-xl transition-colors shrink-0"
                          title="Add New Category (+)"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Rack / Shelf Location *</label>
                    <input
                      type="text"
                      required
                      value={rackLocation}
                      onChange={(e) => setRackLocation(e.target.value)}
                      placeholder="Rack A-1 (Bin 2)"
                      className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Unit (इकाई)</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-2 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                    >
                      <option value="piece">piece (नग)</option>
                      <option value="kg">kg (किग्रा)</option>
                      <option value="gram">gram (ग्राम)</option>
                      <option value="bucket">bucket (बाल्टी)</option>
                      <option value="box">box (डिब्बा/बॉक्स)</option>
                      <option value="bag">bag (बोरी)</option>
                      <option value="feet">feet (फीट)</option>
                      <option value="inch">inch (इंच)</option>
                      <option value="meter">meter (मीटर)</option>
                      <option value="set">set (सेट)</option>
                      <option value="packet">packet (पैकेट)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Purchase Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Current Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Low-Stock Alert Level</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Barcode / SKU Code</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="HW-SKU-101"
                    className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF6B00]/20"
                  >
                    {editingItem ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {itemToDelete && (
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
                <h3 className="text-lg font-bold text-white">Delete Item?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Are you sure you want to delete <span className="font-semibold text-white">"{itemToDelete.name}"</span>? This action will permanently remove it from inventory.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const targetId = itemToDelete.id;
                    setItemToDelete(null);
                    await deleteInventoryItem(targetId);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30"
                >
                  Delete Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
