'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrder, Order, OrderStatus, PaymentStatus } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Printer, ArrowLeft, Download, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import Link from 'next/link';

interface InvoiceClientProps {
  orderId: string;
  backUrl?: string;
}

export default function InvoiceClient({ orderId, backUrl = '/admin/orders' }: InvoiceClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Calculate Tax details (Assumed 5% GST for garments)
  const subtotal = order.total - (order.shippingCost || 0) + (order.discountAmount || 0);
  const gstRate = 0.05;
  const taxableAmount = Math.round(subtotal / (1 + gstRate));
  const totalGst = subtotal - taxableAmount;
  const cgst = Math.round(totalGst / 2);
  const sgst = totalGst - cgst;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 print:bg-white print:py-0 print:px-0">
      {/* Top Action Bar - Hidden during printing */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl">
            <Link href={backUrl}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Link>
          </Button>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-extrabold text-slate-400">
            <FileText className="w-3 h-3" /> Standalone invoice view · press Download PDF and choose &ldquo;Save as PDF&rdquo;
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="rounded-xl text-xs font-extrabold h-9 shadow-sm">
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs h-9 gap-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none print:rounded-none print:p-0 print:text-black">
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
              <div className="pt-1">
                <span className="font-semibold mr-2">Payment Status:</span>
                <Badge className={order.paymentStatus === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'}>
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
                const itemTax = Math.round(item.subtotal * 0.05);
                const unitNet = Math.round(item.price / 1.05);

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
                    <td className="py-4 px-4 text-right">{formatPrice(unitNet)}</td>
                    <td className="py-4 px-4 text-right text-slate-500">{formatPrice(itemTax)}</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatPrice(item.subtotal)}</td>
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

          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Taxable Subtotal:</span>
              <span className="font-semibold">{formatPrice(taxableAmount)}</span>
            </div>
            {(order.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied:</span>
                <span>-{formatPrice(order.discountAmount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>CGST (2.5%):</span>
              <span>{formatPrice(cgst)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>SGST (2.5%):</span>
              <span>{formatPrice(sgst)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Shipping Charges:</span>
              <span className="font-semibold">
                {(order.shippingCost || 0) === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatPrice(order.shippingCost || 0)}
              </span>
            </div>

            <div className="border-t-2 border-slate-900 dark:border-slate-100 pt-3 flex justify-between items-baseline text-sm font-black text-slate-900 dark:text-white">
              <span>Grand Total:</span>
              <span className="text-lg text-amber-600 dark:text-amber-400 font-mono">{formatPrice(order.total)}</span>
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
