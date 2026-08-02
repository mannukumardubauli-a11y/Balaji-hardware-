import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar, 
  Award, 
  AlertOctagon, 
  Coins, 
  Receipt 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useShop } from '../context/ShopContext';

export const ReportsPage: React.FC = () => {
  const { bills, items, salesReturns, addToast } = useShop();
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Filter bills & returns by timeframe
  const now = new Date();
  const isWithinTimeframe = (dateString: string) => {
    const date = new Date(dateString);
    if (timeframe === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return date >= todayStart;
    }
    if (timeframe === 'week') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekStart;
    }
    if (timeframe === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= monthStart;
    }
    return true; // all
  };

  const filteredBills = bills.filter((b) => isWithinTimeframe(b.timestamp));
  const filteredReturns = salesReturns.filter((r) => isWithinTimeframe(r.timestamp));

  // Calculate Product Sales Aggregation
  const itemSalesMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};

  filteredBills.forEach((bill) => {
    (bill.items || []).forEach((bi) => {
      if (!bi || !bi.itemId) return;
      if (!itemSalesMap[bi.itemId]) {
        itemSalesMap[bi.itemId] = {
          name: bi.name || 'Unknown Item',
          quantity: 0,
          revenue: 0,
          profit: 0
        };
      }
      const unitPrice = Number(bi.unitPrice) || 0;
      const rawBuy = Number(bi.purchasePrice);
      const purchasePrice = (!isNaN(rawBuy) && rawBuy >= 0) ? rawBuy : unitPrice * 0.7;
      const qty = Number(bi.quantity) || 1;
      const totalPrice = Number(bi.totalPrice) ?? (unitPrice * qty);
      const cost = purchasePrice * qty;
      const profit = totalPrice - cost;

      itemSalesMap[bi.itemId].quantity += (isNaN(qty) ? 0 : qty);
      itemSalesMap[bi.itemId].revenue += (isNaN(totalPrice) ? 0 : totalPrice);
      itemSalesMap[bi.itemId].profit += (isNaN(profit) ? 0 : profit);
    });
  });

  // Subtract returned items
  filteredReturns.forEach((ret) => {
    (ret.items || []).forEach((ri) => {
      if (!ri || !ri.itemId) return;
      if (itemSalesMap[ri.itemId]) {
        const unitPrice = Number(ri.unitPrice) || 0;
        const rawBuy = Number(ri.purchasePrice);
        const purchasePrice = (!isNaN(rawBuy) && rawBuy >= 0) ? rawBuy : unitPrice * 0.7;
        const qty = Number(ri.quantity) || 1;
        const totalPrice = Number(ri.totalPrice) ?? (unitPrice * qty);
        const cost = purchasePrice * qty;
        const profit = totalPrice - cost;

        itemSalesMap[ri.itemId].quantity = Math.max(0, itemSalesMap[ri.itemId].quantity - (isNaN(qty) ? 0 : qty));
        itemSalesMap[ri.itemId].revenue = Math.max(0, itemSalesMap[ri.itemId].revenue - (isNaN(totalPrice) ? 0 : totalPrice));
        itemSalesMap[ri.itemId].profit = Math.max(0, itemSalesMap[ri.itemId].profit - (isNaN(profit) ? 0 : profit));
      }
    });
  });

  const salesList = Object.values(itemSalesMap);

  // Fast Moving Products (Top 5 by Quantity Sold)
  const fastMoving = [...salesList].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  // Slow Moving Products (Items in inventory with low/zero sales in period)
  const soldItemIds = new Set(Object.keys(itemSalesMap));
  const slowMovingItems = items
    .filter((i) => !soldItemIds.has(i.id) || (itemSalesMap[i.id]?.quantity || 0) <= 2)
    .slice(0, 5);

  // Recharts Data for Chart
  const chartData = fastMoving.map((fm) => ({
    name: fm.name.length > 18 ? `${fm.name.slice(0, 18)}...` : fm.name,
    Sales: fm.revenue,
    Profit: Math.round(fm.profit)
  }));

  // Export CSV Helper
  const exportCSV = () => {
    if (salesList.length === 0) {
      addToast('No Data', 'No sales data available to export for selected timeframe.', 'warning');
      return;
    }

    const headers = 'Item Name, Quantity Sold, Total Revenue (INR), Estimated Profit (INR)\n';
    const rows = salesList
      .map((s) => `"${s.name.replace(/"/g, '""')}",${s.quantity},${s.revenue},${Math.round(s.profit)}`)
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hardware_Sales_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    addToast('CSV Exported', 'Sales report downloaded successfully.', 'success');
  };

  const grossPeriodRevenue = filteredBills.reduce((sum, b) => sum + b.total, 0);
  const totalPeriodReturns = filteredReturns.reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0);
  const totalPeriodRevenue = Math.max(0, grossPeriodRevenue - totalPeriodReturns);
  const totalPeriodBills = filteredBills.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#2B2D2F] border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-xl font-bold text-white">Sales & Fast/Slow Moving Reports</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Identify top-selling items, slow-moving deadstock, and revenue vs profit trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Toggle */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {(['today', 'week', 'month', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  timeframe === t
                    ? 'bg-[#FF6B00] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all border border-zinc-700"
          >
            <Download className="w-4 h-4 text-[#FF6B00]" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-bold text-zinc-400 uppercase">Period Revenue</span>
          <p className="text-2xl font-black text-white mt-1">
            ₹{totalPeriodRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Selected timeframe total</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-bold text-zinc-400 uppercase">Invoices Issued</span>
          <p className="text-2xl font-black text-white mt-1">{totalPeriodBills}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Completed sales</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-bold text-zinc-400 uppercase">Products Sold</span>
          <p className="text-2xl font-black text-[#FF6B00] mt-1">{salesList.length} SKUs</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Unique hardware items</span>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Top Selling Hardware Items (Revenue vs Estimated Profit)
        </h3>

        {chartData.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <BarChart3 className="w-12 h-12 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-300">No sales recorded for this timeframe</p>
            <p className="text-xs text-zinc-500 mt-1">Try switching to "All" time or generate new bills in POS.</p>
          </div>
        ) : (
          <div className="w-full h-[320px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#a1a1aa" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2B2D2F', borderColor: '#444', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [`₹${value}`, 'Amount']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Sales" fill="#FF6B00" radius={[6, 6, 0, 0]} name="Total Sales (₹)" />
                <Bar dataKey="Profit" fill="#10B981" radius={[6, 6, 0, 0]} name="Estimated Profit (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Fast vs Slow Moving Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fast Moving List */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
            <Award className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Fast-Moving Items (Top Sellers)</h3>
              <p className="text-xs text-zinc-400">High velocity inventory items</p>
            </div>
          </div>

          {fastMoving.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">No sales recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {fastMoving.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#2B2D2F] border border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        Qty Sold: <span className="text-white font-bold">{item.quantity}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <p className="text-xs font-bold text-[#FF6B00]">₹{item.revenue}</p>
                    <p className="text-[10px] text-emerald-400">+₹{Math.round(item.profit)} profit</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slow Moving / Deadstock List */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Slow-Moving Items (Deadstock)</h3>
              <p className="text-xs text-zinc-400">Low or zero sales in selected period</p>
            </div>
          </div>

          {slowMovingItems.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">No slow moving items identified.</p>
          ) : (
            <div className="space-y-3">
              {slowMovingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#2B2D2F] border border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      Rack: {item.rackLocation} • Stock: {item.currentStock} {item.unit}
                    </p>
                  </div>

                  <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-lg shrink-0">
                    Low Demand
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
