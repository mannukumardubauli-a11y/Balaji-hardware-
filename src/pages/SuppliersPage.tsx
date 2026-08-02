import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Edit2, 
  Trash2, 
  X, 
  User, 
  Building2 
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Supplier } from '../types';

export const SuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, addToast } = useShop();
  const { role } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form
  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [categoriesText, setCategoriesText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.categories.some((c) => c.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    if (role !== 'Owner') {
      addToast('Owner Access Required', 'Helper role cannot edit supplier records.', 'warning');
      return;
    }
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCategoriesText('Fasteners, Tools');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    if (role !== 'Owner') {
      addToast('Owner Access Required', 'Helper role cannot edit supplier records.', 'warning');
      return;
    }
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setEmail(s.email);
    setAddress(s.address);
    setCategoriesText(s.categories.join(', '));
    setNotes(s.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const categories = categoriesText
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, {
        name,
        contactPerson,
        phone,
        email,
        address,
        categories,
        notes
      });
    } else {
      await addSupplier({
        name,
        contactPerson,
        phone,
        email,
        address,
        categories,
        notes
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, supName: string) => {
    setSupplierToDelete({ id, name: supName });
  };

  const handleWhatsApp = (sup: Supplier) => {
    const phoneDigits = sup.phone.replace(/[^0-9]/g, '');
    const message = `Hello ${sup.contactPerson || sup.name}, inquiry regarding hardware inventory order stock.`;
    const url = `https://wa.me/91${phoneDigits}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#2B2D2F] border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-xl font-bold text-white">Hardware Suppliers Directory</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Manage wholesale distributors, contact details, product categories, and instant WhatsApp reordering.
          </p>
        </div>

        {role === 'Owner' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-[#FF6B00]/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Supplier
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-lg relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by supplier name, contact person, phone, or supply category..."
          className="w-full pl-10 pr-4 py-2 bg-[#2B2D2F] border border-zinc-700/80 rounded-xl text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-[#FF6B00]"
        />
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 shadow-lg">
            <Truck className="w-12 h-12 mx-auto text-zinc-600 mb-3 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-300">No suppliers found</p>
            <p className="text-xs text-zinc-500 mt-1">Click Add New Supplier to populate the supplier directory.</p>
          </div>
        ) : (
          filteredSuppliers.map((sup) => (
            <motion.div
              key={sup.id}
              whileHover={{ y: -2 }}
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{sup.name}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-[#FF6B00]" /> {sup.contactPerson || 'Sales Contact'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sup.id, sup.name)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-300 my-3 p-3 bg-[#2B2D2F] rounded-xl border border-zinc-800">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-mono">{sup.phone}</span>
                  </p>
                  {sup.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{sup.email}</span>
                    </p>
                  )}
                  {sup.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{sup.address}</span>
                    </p>
                  )}
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {sup.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-semibold text-zinc-300"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {sup.notes && (
                  <p className="text-[11px] text-zinc-400 italic line-clamp-2 border-t border-zinc-800 pt-2">
                    "{sup.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2">
                <button
                  onClick={() => handleWhatsApp(sup)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Order
                </button>

                <a
                  href={`tel:${sup.phone}`}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors border border-zinc-700"
                  title="Call Supplier"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#2B2D2F] border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#FF6B00]" />
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Company / Firm Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mahavir Steel & Fasteners Corp"
                    className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Rajesh Sharma"
                      className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98112 34567"
                      className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@supplier.com"
                    className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Address / Warehouse</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Plot 12, Industrial Market"
                    className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Supplied Categories (Comma Separated)</label>
                  <input
                    type="text"
                    value={categoriesText}
                    onChange={(e) => setCategoriesText(e.target.value)}
                    placeholder="Fasteners, Tools, Plumbing"
                    className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Notes / Terms</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Delivers in 24 hrs, minimum order 100 boxes."
                    className="w-full px-3 py-2 bg-[#2B2D2F] border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
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
                    Save Supplier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE SUPPLIER CONFIRM MODAL */}
      <AnimatePresence>
        {supplierToDelete && (
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
                <h3 className="text-lg font-bold text-white">Delete Supplier?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Are you sure you want to delete <span className="font-semibold text-white">"{supplierToDelete.name}"</span>? This will remove them from your directory.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSupplierToDelete(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const targetId = supplierToDelete.id;
                    setSupplierToDelete(null);
                    await deleteSupplier(targetId);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30"
                >
                  Delete Supplier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
