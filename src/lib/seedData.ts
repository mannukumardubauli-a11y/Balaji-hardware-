import { InventoryItem, Supplier, ShopSettings } from '../types';

export const INITIAL_SHOP_SETTINGS: ShopSettings = {
  shopName: "Sri Balaji Hardware and Paint Store",
  tagline: "Paints, Hardware, Tools, Plumbing & Electrical Supplies",
  proprietor: "Manoj Sharma",
  phone: "9140402455, 9984002627",
  email: "P209824@gmail.com",
  upiId: "9118111494@apl",
  address: "Dubauli Bazaar, Tower se 100 meter Dakshin",
  gstin: "",
  terms: "1. Goods once sold will be replaced within 7 days if defective.\n2. Invoice / bill copy required for any claims.\n3. Thank you for your business!",
  logoUrl: "./pwa-icon.png"
};

export const INITIAL_SUPPLIERS: Omit<Supplier, 'id'>[] = [
  {
    name: "Mahavir Steel & Fasteners Corp",
    contactPerson: "Rajesh Sharma",
    phone: "+91 98112 34567",
    email: "orders@mahavirsteel.com",
    address: "Shop 12, Hardware Market, Old City",
    categories: ["Fasteners", "Tools"],
    notes: "Primary supplier for high-tensile bolts, screws, and nails. Delivery within 24 hours."
  },
  {
    name: "Supreme Polymers & Pipes Ltd",
    contactPerson: "Vikram Mehta",
    phone: "+91 98220 88776",
    email: "v.mehta@supremepipes.in",
    address: "GIDC Industrial Estate, Sector 3",
    categories: ["Plumbing", "Sanitary"],
    notes: "PVC, CPVC pipes, ball valves and pipe fittings."
  },
  {
    name: "Havells & Finolex Electrical Distributors",
    contactPerson: "Amit Gupta",
    phone: "+91 98991 22334",
    email: "sales@guptaelectricals.com",
    address: "24 Electric Market Hub",
    categories: ["Electrical"],
    notes: "Wires, switches, circuit breakers, and lighting solutions."
  },
  {
    name: "Asian Paints & Chemicals Agency",
    contactPerson: "Suresh Patel",
    phone: "+91 97654 12345",
    email: "patel.paints@gmail.com",
    address: "Station Road, Shop 5",
    categories: ["Paints", "Chemicals"],
    notes: "Waterproofing, primers, spray paints, and solvent glues."
  }
];

export const INITIAL_ITEMS: Omit<InventoryItem, 'id'>[] = [
  {
    name: "Steel Wire Nails 2 Inch (1kg Box)",
    category: "Fasteners",
    rackLocation: "Rack A-1 (Bin 2)",
    unit: "kg",
    purchasePrice: 65,
    sellingPrice: 90,
    currentStock: 35,
    lowStockThreshold: 10,
    barcode: "HW-NFL-001",
    updatedAt: new Date().toISOString()
  },
  {
    name: "M6 Hex Stainless Bolts & Nuts (Pack of 50)",
    category: "Fasteners",
    rackLocation: "Rack A-2 (Bin 5)",
    unit: "box",
    purchasePrice: 120,
    sellingPrice: 180,
    currentStock: 4, // LOW STOCK
    lowStockThreshold: 8,
    barcode: "HW-BLT-002",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Heavy Duty Drywall Screws 35mm (Box of 100)",
    category: "Fasteners",
    rackLocation: "Rack A-3 (Bin 1)",
    unit: "box",
    purchasePrice: 85,
    sellingPrice: 130,
    currentStock: 18,
    lowStockThreshold: 5,
    barcode: "HW-SCR-003",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Finolex 1.5 sqmm Copper Wire Coil (90m, Red)",
    category: "Electrical",
    rackLocation: "Rack B-1 (Shelf 2)",
    unit: "box",
    purchasePrice: 1450,
    sellingPrice: 1850,
    currentStock: 2, // LOW STOCK
    lowStockThreshold: 5,
    barcode: "HW-ELE-101",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Anchor 16A Modular Switch (White)",
    category: "Electrical",
    rackLocation: "Rack B-2 (Bin 3)",
    unit: "piece",
    purchasePrice: 42,
    sellingPrice: 65,
    currentStock: 48,
    lowStockThreshold: 12,
    barcode: "HW-ELE-102",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Philips 12W Cool Daylight LED Bulb",
    category: "Electrical",
    rackLocation: "Rack B-3 (Shelf 1)",
    unit: "piece",
    purchasePrice: 80,
    sellingPrice: 120,
    currentStock: 25,
    lowStockThreshold: 8,
    barcode: "HW-ELE-103",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Supreme PVC Pipe 1 Inch (10 Feet)",
    category: "Plumbing",
    rackLocation: "Rack C-1 (Floor Yard)",
    unit: "piece",
    purchasePrice: 180,
    sellingPrice: 240,
    currentStock: 0, // OUT OF STOCK
    lowStockThreshold: 10,
    barcode: "HW-PLM-201",
    updatedAt: new Date().toISOString()
  },
  {
    name: "CPVC Heavy Duty Ball Valve 3/4 Inch",
    category: "Plumbing",
    rackLocation: "Rack C-2 (Bin 8)",
    unit: "piece",
    purchasePrice: 95,
    sellingPrice: 150,
    currentStock: 14,
    lowStockThreshold: 5,
    barcode: "HW-PLM-202",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Thread Seal PTFE Teflon Tape (12mm x 10m)",
    category: "Plumbing",
    rackLocation: "Rack C-3 (Bin 1)",
    unit: "piece",
    purchasePrice: 12,
    sellingPrice: 25,
    currentStock: 80,
    lowStockThreshold: 20,
    barcode: "HW-PLM-203",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Brass Water Tap 1/2 Inch Chrome Finish",
    category: "Plumbing",
    rackLocation: "Rack C-2 (Shelf 3)",
    unit: "piece",
    purchasePrice: 220,
    sellingPrice: 320,
    currentStock: 3, // LOW STOCK
    lowStockThreshold: 6,
    barcode: "HW-PLM-204",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Taparia Claw Hammer 500g Rubber Grip",
    category: "Tools",
    rackLocation: "Rack D-1 (Wall Display)",
    unit: "piece",
    purchasePrice: 280,
    sellingPrice: 420,
    currentStock: 9,
    lowStockThreshold: 3,
    barcode: "HW-TLS-301",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Taparia Screwdriver Set (6 Pieces)",
    category: "Tools",
    rackLocation: "Rack D-1 (Shelf 2)",
    unit: "set",
    purchasePrice: 310,
    sellingPrice: 460,
    currentStock: 6,
    lowStockThreshold: 3,
    barcode: "HW-TLS-302",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Adjustable Steel Spanner Wrench 10 Inch",
    category: "Tools",
    rackLocation: "Rack D-2 (Bin 4)",
    unit: "piece",
    purchasePrice: 240,
    sellingPrice: 360,
    currentStock: 12,
    lowStockThreshold: 4,
    barcode: "HW-TLS-303",
    updatedAt: new Date().toISOString()
  },
  {
    name: "Asian Paints Royale White Primer 1 Litre",
    category: "Paints",
    rackLocation: "Rack E-1 (Shelf 1)",
    unit: "piece",
    purchasePrice: 190,
    sellingPrice: 260,
    currentStock: 15,
    lowStockThreshold: 5,
    barcode: "HW-PNT-401",
    updatedAt: new Date().toISOString()
  },
  {
    name: "M-Seal Quick Curing Epoxy Compound 100g",
    category: "Chemicals",
    rackLocation: "Rack E-2 (Bin 2)",
    unit: "piece",
    purchasePrice: 22,
    sellingPrice: 35,
    currentStock: 45,
    lowStockThreshold: 15,
    barcode: "HW-CHM-402",
    updatedAt: new Date().toISOString()
  },
  {
    name: "WD-40 Multi-Use Rust & Lubricant Spray 100ml",
    category: "Chemicals",
    rackLocation: "Rack E-2 (Shelf 3)",
    unit: "piece",
    purchasePrice: 110,
    sellingPrice: 160,
    currentStock: 1, // OUT OF STOCK NEARLY
    lowStockThreshold: 5,
    barcode: "HW-CHM-403",
    updatedAt: new Date().toISOString()
  },
  {
    name: "UltraTech Cement Bag 50kg",
    category: "Building",
    rackLocation: "Yard Stack B",
    unit: "bag",
    purchasePrice: 340,
    sellingPrice: 390,
    currentStock: 50,
    lowStockThreshold: 15,
    barcode: "HW-BLD-501",
    updatedAt: new Date().toISOString()
  }
];
