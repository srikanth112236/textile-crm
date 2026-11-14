'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getOrder, Order, OrderStatus, PaymentStatus } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, ArrowLeft, Download, ShieldCheck, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

const invoicePrice = (value?: number | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const round2 = (value: number) => Math.round(value * 100) / 100;

interface InvoiceClientProps {
  orderId: string;
  backUrl?: string;
  /** Render just the invoice sheet (used inside the admin modal). */
  embedded?: boolean;
}

export default function InvoiceClient({ orderId, backUrl = '/admin/orders', embedded = false }: InvoiceClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await getOrder(orderId);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load order invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = useCallback(async () => {
    if (!order || !invoiceRef.current || downloading) return;

    setDownloading(true);
    let success = false;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const sheet = invoiceRef.current;
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: sheet.scrollWidth,
        windowHeight: sheet.scrollHeight,
        onclone: (clonedDoc) => {
          // Always export a light, borderless invoice, even if the admin UI is dark.
          clonedDoc.documentElement.classList.remove('dark');
          const clonedSheet = clonedDoc.querySelector('[data-invoice-sheet]') as HTMLElement | null;
          if (clonedSheet) {
            clonedSheet.style.boxShadow = 'none';
            clonedSheet.style.border = 'none';
            clonedSheet.style.borderRadius = '0';
            clonedSheet.style.background = '#ffffff';
            clonedSheet.style.color = '#0f172a';
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let imgWidth = pageWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // A tax invoice should normally be a single A4 page. If it only slightly
      // overflows, scale it down instead of creating a near-empty second page.
      if (imgHeight > pageHeight && imgHeight <= pageHeight * 1.2) {
        imgHeight = pageHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }
      const x = (pageWidth - imgWidth) / 2;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', x, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', x, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`Mentoos-Invoice-${order.orderNumber}.pdf`);
      success = true;
    } catch (err) {
      console.error('Invoice PDF download failed:', err);
    } finally {
      setDownloading(false);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'mentoos:invoice:download-done', success },
          window.location.origin
        );
      }
    }
  }, [downloading, order]);

  useEffect(() => {
    if (!embedded) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'mentoos:invoice:download') {
        void handleDownload();
      }
      if (event.data?.type === 'mentoos:invoice:ping' && order) {
        window.parent?.postMessage({ type: 'mentoos:invoice:ready' }, window.location.origin);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [embedded, handleDownload, order]);

  useEffect(() => {
    if (!embedded || !order) return;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'mentoos:invoice:ready' }, window.location.origin);
    }
  }, [embedded, order]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Generating Tax Invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl font-semibold text-sm">
          {error || 'Unable to display invoice.'}
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={backUrl}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  // Calculate tax details (assumed 5% GST for garments, prices are GST-inclusive)
  const subtotal = round2(order.total - (order.shippingCost || 0) + (order.discountAmount || 0));
  const gstRate = 0.05;
  const taxableAmount = round2(subtotal / (1 + gstRate));
  const totalGst = round2(subtotal - taxableAmount);
  const cgst = round2(totalGst / 2);
  const sgst = round2(totalGst - cgst);
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={embedded ? 'min-h-full bg-slate-100 p-3 sm:p-5 dark:bg-slate-950 print:bg-white print:p-0' : 'min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 print:bg-white print:py-0 print:px-0'}>
      {/* Top Action Bar - Hidden during printing and in embedded (modal) mode */}
      {!embedded && (
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="rounded-xl">
              <Link href={backUrl}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Link>
            </Button>
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-extrabold text-slate-400">
              <FileText className="w-3 h-3" /> Standalone invoice view · print or download the PDF
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="rounded-xl text-xs font-extrabold h-9 shadow-sm">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs h-9 gap-1.5 shadow-md"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloading ? 'Preparing…' : 'Download PDF'}
            </Button>
          </div>
        </div>
      )}

      {/* Printable Invoice Sheet */}
      <div
        ref={invoiceRef}
        data-invoice-sheet
        className={embedded
          ? 'max-w-4xl mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none print:rounded-none print:p-8 print:text-black'
          : 'max-w-4xl mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none print:rounded-none print:p-8 print:text-black'}
      >
        {/* Header Branding & Invoice Meta */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-8 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-widest text-slate-900 dark:text-white uppercase font-sans">
                MENTOOS<span className="text-amber-500">.</span>
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold border-amber-500 text-amber-600 dark:text-amber-400">
                Official Store
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mentoos Clothing Private Limited</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">GSTIN: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">37AAAAA0000A1Z5</span></p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Somandepalli Road, Andhra Pradesh 515122</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Support: support@mentoos.in | +91 98765 43210</p>
          </div>

          <div className="sm:text-right space-y-1 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shrink-0 print:bg-transparent print:p-0 print:border-none">
            <h2 className="text-base font-extrabold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              Tax Invoice / Bill of Supply
            </h2>
            <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <p><span className="font-semibold">Invoice No:</span> <span className="font-mono font-bold">INV-{order.orderNumber}</span></p>
              <p><span className="font-semibold">Order Ref:</span> <span className="font-mono font-bold">{order.orderNumber}</span></p>
              <p><span className="font-semibold">Date:</span> {invoiceDate}</p>
              <div className="pt-1 flex flex-wrap items-center gap-1.5 sm:justify-end">
                <span className="font-semibold">Payment Status:</span>
                <Badge
                  className={
                    order.paymentStatus === 'confirmed'
                      ? 'bg-emerald-500 text-white whitespace-nowrap'
                      : 'bg-amber-500 text-slate-950 whitespace-nowrap'
                  }
                >
                  {order.paymentStatus.toUpperCase()} ({order.paymentMethod.toUpperCase()})
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 space-y-1 print:bg-transparent print:p-0 print:border-none">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Billed To</h3>
            <p className="font-bold text-sm text-slate-900 dark:text-white">
              {typeof order.userId === 'object' ? order.userId.name : 'Valued Customer'}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              {typeof order.userId === 'object' ? order.userId.email : ''}
            </p>
            <p className="text-slate-600 dark:text-slate-300 font-mono">
              Order ID: {order._id}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 space-y-1 print:bg-transparent print:p-0 print:border-none">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Shipped To Address</h3>
            <p className="font-bold text-sm text-slate-900 dark:text-white">{order.shippingAddress.street}</p>
            <p className="text-slate-600 dark:text-slate-300">
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}
            </p>
            <p className="text-slate-600 dark:text-slate-300 font-semibold">{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto my-8">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-2">#</th>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-2">HSN Code</th>
                <th className="py-3 px-2 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Tax (5%)</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {order.items.map((item, index) => {
                const pid: any = item.productId;
                const prodName = typeof pid === 'object' && pid !== null ? pid.name : `Product ID: ${item.productId}`;
                const sku = typeof pid === 'object' && pid !== null ? pid.sku : '';
                const itemTax = round2(item.subtotal - round2(item.price / 1.05) * item.quantity);
                const unitNet = round2(item.price / 1.05);

                return (
                  <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                    <td className="py-4 px-2 font-bold text-slate-400">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{prodName}</div>
                      {sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {sku}</div>}
                      {item.variations && item.variations.length > 0 && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400">
                          {item.variations.map((v) => `${v.name}: ${v.value}`).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-2 font-mono text-slate-500">6205</td>
                    <td className="py-4 px-2 text-center font-bold text-slate-800 dark:text-slate-200">{item.quantity}</td>
                    <td className="py-4 px-4 text-right">{invoicePrice(unitNet)}</td>
                    <td className="py-4 px-4 text-right text-slate-500">{invoicePrice(itemTax)}</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{invoicePrice(item.subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation & Summary Box */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-3 max-w-sm text-xs text-slate-500">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50 space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Guarantee & Return Policy
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                All Mentoos products are covered under 7-day hassle-free exchange & return warranty. For support, visit mentoos.in/support.
              </p>
            </div>
            <p className="text-[10px] text-slate-400">
              * This is a computer generated tax invoice and requires no physical signature.
            </p>
          </div>

          <div className="w-full sm:w-[21rem] shrink-0 space-y-2 text-xs">
            <div className="flex items-start justify-between gap-4 text-slate-600 dark:text-slate-400">
              <span>Taxable Subtotal:</span>
              <span className="shrink-0 font-semibold whitespace-nowrap">{invoicePrice(taxableAmount)}</span>
            </div>
            {(order.discountAmount || 0) > 0 && (
              <div className="flex items-start justify-between gap-4 text-emerald-600 font-medium">
                <span className="min-w-0">
                  Discount{order.discountCode ? ` (${order.discountCode})` : ''}:
                </span>
                <span className="shrink-0 whitespace-nowrap">-{invoicePrice(order.discountAmount || 0)}</span>
              </div>
            )}
            <div className="flex items-start justify-between gap-4 text-slate-500">
              <span>CGST (2.5%):</span>
              <span className="shrink-0 whitespace-nowrap">{invoicePrice(cgst)}</span>
            </div>
            <div className="flex items-start justify-between gap-4 text-slate-500">
              <span>SGST (2.5%):</span>
              <span className="shrink-0 whitespace-nowrap">{invoicePrice(sgst)}</span>
            </div>
            <div className="flex items-start justify-between gap-4 text-slate-600 dark:text-slate-400">
              <span>Shipping Charges:</span>
              <span className="shrink-0 font-semibold whitespace-nowrap">
                {(order.shippingCost || 0) === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : invoicePrice(order.shippingCost || 0)}
              </span>
            </div>

            <div className="border-t-2 border-slate-900 dark:border-slate-100 pt-3 flex items-baseline justify-between gap-4 text-sm font-black text-slate-900 dark:text-white">
              <span>Grand Total:</span>
              <span className="shrink-0 whitespace-nowrap text-lg text-amber-600 dark:text-amber-400 font-mono">{invoicePrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Authorization */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Thank you for shopping with Mentoos!</p>
            <p className="text-[10px]">www.mentoos.in</p>
          </div>

          <div className="text-right space-y-8">
            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-mono italic">
              Authorized Signatory
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-300 dark:border-slate-700 pt-1">
              Mentoos Retail Pvt Ltd
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
