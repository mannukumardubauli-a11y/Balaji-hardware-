export type UserRole = 'Owner' | 'Helper';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  rackLocation: string; // e.g., "Rack 2-B", "Shelf A-1"
  unit: string; // "piece", "kg", "box", "bag", "meter", "set", "packet"
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  barcode?: string;
  supplierId?: string;
  supplierName?: string;
  updatedAt: string;
}

export interface CartItem {
  item: InventoryItem;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentMode = 'Cash' | 'UPI/Online' | 'Udhaar';

export interface BillItemSummary {
  itemId: string;
  name: string;
  rackLocation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchasePrice?: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  items: BillItemSummary[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  discount: number;
  total: number;
  paymentMode: PaymentMode;
  cashPaidAmount?: number;
  onlinePaidAmount?: number;
  cashierName: string;
  cashierRole: UserRole;
  timestamp: string; // ISO string
  createdAt: number; // epoch timestamp
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  categories: string[];
  notes?: string;
}

export interface UdhaarTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT'; // DEBIT = bought on credit (+owed), CREDIT = payment made (-owed)
  billId?: string;
  notes?: string;
}

export interface UdhaarRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  totalOwed: number;
  status: 'Pending' | 'Partial' | 'Settled';
  lastUpdated: string;
  transactions: UdhaarTransaction[];
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  phone: string;
  address: string;
  gstin?: string;
  proprietor?: string;
  email?: string;
  upiId?: string;
  terms: string;
  logoUrl?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export interface SalesReturnItem {
  itemId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalRefund: number;
}

export interface SalesReturnRecord {
  id: string;
  returnNumber: string;
  billId?: string;
  billNumber?: string;
  customerName: string;
  customerPhone?: string;
  items: SalesReturnItem[];
  totalRefundAmount: number;
  refundMode: 'Cash' | 'UPI/Online' | 'Udhaar Credit';
  reason: string;
  processedBy: string;
  timestamp: string; // ISO string
  createdAt: number;
}
