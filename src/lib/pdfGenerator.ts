import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bill, ShopSettings, SalesReturnRecord } from '../types';

export function generateBillPDF(bill: Bill, shopSettings: ShopSettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [30, 35, 42]; // Premium Navy Charcoal #1E232A
  const accentColor = [255, 107, 0];  // Safety Orange #FF6B00

  // Page Dimensions & Margins
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // 1. TOP HEADER BANNER
  const headerHeight = 35;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Orange Top Accent Strip
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Shop Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((shopSettings.shopName || 'Sri Balaji Hardware and Paint Store').toUpperCase(), margin, 10);

  // Proprietor Name
  const proprietorName = shopSettings.proprietor || 'Manoj Sharma';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 170, 90); // Soft orange
  doc.text(`Proprietor: ${proprietorName}`, margin, 15.5);

  // Address Line
  const addressText = shopSettings.address || 'Dubauli Bazaar, Tower se 100 meter Dakshin';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(215, 220, 225);
  doc.text(`Address: ${addressText}`, margin, 20.5);

  // Phone & Email Line
  const phoneText = shopSettings.phone || '9140402455, 9984002627';
  const emailText = shopSettings.email || 'P209824@gmail.com';
  doc.text(`Mobile: ${phoneText}  |  Email: ${emailText}`, margin, 25.5);

  // Right Header - Invoice Title & Number
  doc.setTextColor(255, 107, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RETAIL INVOICE', pageWidth - margin, 11, { align: 'right' });

  doc.setTextColor(200, 205, 210);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`#${bill.billNumber}`, pageWidth - margin, 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(170, 175, 180);
  doc.text('CASH / CREDIT MEMO', pageWidth - margin, 22, { align: 'right' });

  // 2. BILL DETAILS & CUSTOMER INFO BOX
  let y = 39;
  const boxHeight = 22;
  doc.setFillColor(246, 248, 250); // Soft light background
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), boxHeight, 2, 2, 'FD');

  doc.setTextColor(40, 45, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('INVOICE DETAILS:', margin + 4, y + 5.5);
  doc.text('CUSTOMER INFORMATION:', margin + 95, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 75, 80);

  const formattedDate = new Date(bill.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const isSplit = (bill.cashPaidAmount || 0) > 0 && (bill.onlinePaidAmount || 0) > 0;
  const paymentModeLabel = isSplit
    ? `UPI + Cash (Cash: Rs.${bill.cashPaidAmount}, Online: Rs.${bill.onlinePaidAmount})`
    : bill.paymentMode;

  doc.text(`Date & Time: ${formattedDate}`, margin + 4, y + 11);
  doc.text(`Payment Mode: ${paymentModeLabel}`, margin + 4, y + 16.5);

  doc.text(`Customer Name: ${bill.customerName || 'Cash Customer'}`, margin + 95, y + 11);
  doc.text(`Phone Number: ${bill.customerPhone || 'N/A'}`, margin + 95, y + 16.5);

  // 3. ITEMS TABLE
  const tableData = bill.items.map((item, index) => {
    return [
      (index + 1).toString(),
      item.name,
      `${item.quantity} ${item.unit}`,
      `Rs. ${item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Rs. ${item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY: y + boxHeight + 4,
    head: [['S.N.', 'Item Description', 'Qty', 'Unit Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 35, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [35, 40, 45],
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  // Calculate position after table
  // @ts-ignore
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 5 : y + 60;

  // 4. TOTALS & PAYMENT STATUS BOX
  const totalsWidth = 85;
  const totalsX = pageWidth - margin - totalsWidth;
  const summaryBoxHeight = bill.discount > 0 ? 30 : 24;

  // Right Side Summary Box
  doc.setFillColor(250, 251, 252);
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(totalsX, finalY, totalsWidth, summaryBoxHeight, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 85, 90);

  let currentTotalY = finalY + 6;
  doc.text('Subtotal:', totalsX + 4, currentTotalY);
  doc.text(`Rs. ${bill.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 4, currentTotalY, { align: 'right' });

  if (bill.discount > 0) {
    currentTotalY += 5.5;
    doc.text('Discount:', totalsX + 4, currentTotalY);
    doc.text(`- Rs. ${bill.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 4, currentTotalY, { align: 'right' });
  }

  // Divider line
  currentTotalY += 4;
  doc.setDrawColor(210, 215, 220);
  doc.line(totalsX + 4, currentTotalY, pageWidth - margin - 4, currentTotalY);

  // Grand Total Line
  currentTotalY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 107, 0); // Safety Orange
  doc.text('Grand Total:', totalsX + 4, currentTotalY);
  doc.text(`Rs. ${bill.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 4, currentTotalY, { align: 'right' });

  // Left Side Payment Status Box
  const statusBoxWidth = 75;
  const isUdhaar = bill.paymentMode === 'Udhaar';

  doc.setFillColor(isUdhaar ? 254 : 240, isUdhaar ? 242 : 253, isUdhaar ? 242 : 244);
  doc.setDrawColor(isUdhaar ? 239 : 34, isUdhaar ? 68 : 197, isUdhaar ? 68 : 94);
  doc.roundedRect(margin, finalY, statusBoxWidth, summaryBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 45, 50);
  doc.text(`Payment Mode: ${isSplit ? 'UPI/Online + Cash' : bill.paymentMode}`, margin + 4, finalY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  if (isUdhaar) {
    doc.setTextColor(220, 38, 38);
    doc.text('Status: ADDED TO UDHAAR LEDGER', margin + 4, finalY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 105, 110);
    doc.text('Customer credit account updated.', margin + 4, finalY + 18);
  } else if (isSplit) {
    doc.setTextColor(22, 163, 74);
    doc.text('Status: PAID IN FULL (SPLIT PAYMENT)', margin + 4, finalY + 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 65, 70);
    doc.text(`Cash Paid: Rs. ${bill.cashPaidAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 4, finalY + 16);
    doc.text(`Online Paid: Rs. ${bill.onlinePaidAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 4, finalY + 20.5);
  } else {
    doc.setTextColor(22, 163, 74);
    doc.text('Status: PAID IN FULL', margin + 4, finalY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 105, 110);
    doc.text('Payment received with thanks.', margin + 4, finalY + 18);
  }

  // 5. FOOTER
  const footerY = 277;
  doc.setDrawColor(230, 235, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 105, 110);
  doc.text('Terms & Conditions:', margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(130, 135, 140);
  doc.text('1. Goods once sold can be replaced within 7 days if defective.', margin, footerY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 107, 0);
  doc.text('Thank you for shopping with Sri Balaji Hardware and Paint Store!', pageWidth - margin, footerY + 2, { align: 'right' });

  return doc;
}

export function getPDFDataUri(bill: Bill, shopSettings: ShopSettings): string {
  const doc = generateBillPDF(bill, shopSettings);
  return doc.output('datauristring');
}

export function downloadPDF(bill: Bill, shopSettings: ShopSettings): void {
  const doc = generateBillPDF(bill, shopSettings);
  doc.save(`Bill_${bill.billNumber}_${(bill.customerName || 'Cash').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function generateLowStockPDF(
  itemsList: Array<{
    name: string;
    category?: string;
    currentStock: number;
    unit: string;
    requiredQty: number;
    isManual?: boolean;
  }>,
  shopSettings: ShopSettings
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [30, 35, 42];
  const accentColor = [255, 107, 0];

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // Header Banner Background
  const headerHeight = 35;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Orange Top Accent Strip
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Shop Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((shopSettings.shopName || 'Sri Balaji Hardware and Paint Store').toUpperCase(), margin, 10);

  // Proprietor Name
  const proprietorName = shopSettings.proprietor || 'Manoj Sharma';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 170, 90);
  doc.text(`Proprietor: ${proprietorName}`, margin, 15.5);

  // Address Line
  const addressText = shopSettings.address || 'Dubauli Bazaar, Tower se 100 meter Dakshin';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(215, 220, 225);
  doc.text(`Address: ${addressText}`, margin, 20.5);

  // Phone & Email Line
  const phoneText = shopSettings.phone || '9140402455, 9984002627';
  const emailText = shopSettings.email || 'P209824@gmail.com';
  doc.text(`Mobile: ${phoneText}  |  Email: ${emailText}`, margin, 25.5);

  // Document Title (Right Header)
  doc.setTextColor(255, 107, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('STOCK REORDER DEMAND LIST', pageWidth - margin, 11, { align: 'right' });

  doc.setTextColor(200, 205, 210);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const formattedDate = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });
  doc.text(`Date: ${formattedDate}`, pageWidth - margin, 17, { align: 'right' });
  doc.text(`Total Items: ${itemsList.length}`, pageWidth - margin, 22, { align: 'right' });

  const y = 39;

  // Items Table
  const tableData = itemsList.map((item, index) => [
    (index + 1).toString(),
    item.name,
    item.category || 'General',
    `${item.requiredQty} ${item.unit}`,
    item.currentStock === 0 ? 'CRITICAL OUT' : (item.isManual ? 'MANUAL REORDER' : 'LOW STOCK')
  ]);

  autoTable(doc, {
    startY: y,
    head: [['S.N.', 'Item Description', 'Category', 'Required Order Qty', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 35, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [35, 40, 45],
      cellPadding: 2.8
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35 },
      3: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 35, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  // Footer / Signature Section
  const footerY = 275;
  doc.setDrawColor(230, 235, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 105, 110);
  doc.text('Verified by Sri Balaji Hardware and Paint Store.', margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 107, 0);
  doc.text(`Proprietor Signature: ${proprietorName}`, pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

export function downloadLowStockPDF(
  itemsList: Array<{
    name: string;
    category?: string;
    currentStock: number;
    unit: string;
    requiredQty: number;
    isManual?: boolean;
  }>,
  shopSettings: ShopSettings
): void {
  const doc = generateLowStockPDF(itemsList, shopSettings);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Low_Stock_Order_List_${dateStr}.pdf`);
}

export function printLowStockPDF(
  itemsList: Array<{
    name: string;
    category?: string;
    currentStock: number;
    unit: string;
    requiredQty: number;
    isManual?: boolean;
  }>,
  shopSettings: ShopSettings
): void {
  const doc = generateLowStockPDF(itemsList, shopSettings);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
}

export async function shareLowStockPDF(
  itemsList: Array<{
    name: string;
    category?: string;
    currentStock: number;
    unit: string;
    requiredQty: number;
    isManual?: boolean;
  }>,
  shopSettings: ShopSettings
): Promise<boolean> {
  const doc = generateLowStockPDF(itemsList, shopSettings);
  const pdfBlob = doc.output('blob');
  const filename = `Low_Stock_Order_List_${new Date().toISOString().slice(0, 10)}.pdf`;
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Low Stock Demand List - ${shopSettings.shopName}`,
        text: `Low Stock Reorder Demand List from ${shopSettings.shopName}`,
      });
      return true;
    } catch (e) {
      console.log('User cancelled share or share error:', e);
    }
  }

  // Fallback: download PDF
  downloadLowStockPDF(itemsList, shopSettings);
  return false;
}

export function generateReturnReceiptPDF(returnRecord: SalesReturnRecord, shopSettings: ShopSettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [30, 35, 42];
  const accentColor = [220, 38, 38]; // Red for Returns/Refunds #DC2626
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // Header Banner
  const headerHeight = 35;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Shop Name & Details
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((shopSettings.shopName || 'Sri Balaji Hardware and Paint Store').toUpperCase(), margin, 10);

  const proprietorName = shopSettings.proprietor || 'Manoj Sharma';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 170, 90);
  doc.text(`Proprietor: ${proprietorName}`, margin, 15.5);

  const addressText = shopSettings.address || 'Dubauli Bazaar, Tower se 100 meter Dakshin';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(215, 220, 225);
  doc.text(`Address: ${addressText}`, margin, 20.5);

  const phoneText = shopSettings.phone || '9140402455, 9984002627';
  doc.text(`Mobile: ${phoneText}`, margin, 25.5);

  // Right Header - Return Note Title
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SALES RETURN MEMO', pageWidth - margin, 11, { align: 'right' });

  doc.setTextColor(200, 205, 210);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`#${returnRecord.returnNumber}`, pageWidth - margin, 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(170, 175, 180);
  doc.text('CREDIT & REFUND NOTE', pageWidth - margin, 22, { align: 'right' });

  // Customer & Return Details Box
  let y = 39;
  const boxHeight = 24;
  doc.setFillColor(254, 242, 242); // Soft light red background
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), boxHeight, 2, 2, 'FD');

  doc.setTextColor(153, 27, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RETURN DETAILS:', margin + 4, y + 5.5);
  doc.text('CUSTOMER INFO:', margin + 95, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 55, 60);
  const formattedDate = new Date(returnRecord.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  doc.text(`Return Date: ${formattedDate}`, margin + 4, y + 11);
  doc.text(`Original Bill #: ${returnRecord.billNumber || 'Direct Return'}`, margin + 4, y + 16);
  doc.text(`Refund Mode: ${returnRecord.refundMode}`, margin + 4, y + 21);

  doc.text(`Customer Name: ${returnRecord.customerName}`, margin + 95, y + 11);
  doc.text(`Phone Number: ${returnRecord.customerPhone || 'N/A'}`, margin + 95, y + 16);
  doc.text(`Return Reason: ${returnRecord.reason || 'Not specified'}`, margin + 95, y + 21);

  // Items Table
  y += boxHeight + 6;

  const tableData = returnRecord.items.map((item, index) => [
    (index + 1).toString(),
    item.name,
    `${item.quantity} ${item.unit}`,
    `INR ${item.unitPrice.toLocaleString('en-IN')}`,
    `INR ${item.totalRefund.toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['S.N.', 'Returned Item Description', 'Returned Qty', 'Unit Price', 'Refund Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 45, 50],
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  // Total Refund Box
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  doc.setFillColor(254, 226, 226);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(pageWidth - margin - 80, finalY, 80, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL REFUND AMOUNT:', pageWidth - margin - 76, finalY + 6);
  doc.setFontSize(13);
  doc.text(`INR ${returnRecord.totalRefundAmount.toLocaleString('en-IN')}`, pageWidth - margin - 4, finalY + 12, { align: 'right' });

  // Footer / Signature
  const footerY = 275;
  doc.setDrawColor(230, 235, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 105, 110);
  doc.text('Items restocked back into shop inventory. Verified by Sri Balaji Hardware.', margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 38, 38);
  doc.text(`Authorized Signatory: ${proprietorName}`, pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

export function downloadReturnPDF(returnRecord: SalesReturnRecord, shopSettings: ShopSettings): void {
  const doc = generateReturnReceiptPDF(returnRecord, shopSettings);
  doc.save(`Sales_Return_${returnRecord.returnNumber}.pdf`);
}



