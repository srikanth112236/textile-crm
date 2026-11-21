import { ErrorState, RowsSkeleton, SignedOut } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ordersApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import type { Order } from '@/lib/api/types';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeftIcon, DownloadIcon } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SELLER = {
  name: 'Mentoos Apparel Pvt Ltd',
  address: 'Somandepalle, Andhra Pradesh 515001, India',
  gstin: '37ABCDE1234F1Z5',
  email: 'care@mentoos.com',
};

export default function InvoiceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { isSignedIn } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const orderQuery = useQuery({
    queryKey: qk.order(orderId),
    queryFn: async () => (await ordersApi.get(orderId)).data,
    enabled: Boolean(orderId) && isSignedIn,
  });

  const order = orderQuery.data;

  const download = async () => {
    if (!order) return;
    setBusy(true);
    setMessage(null);
    try {
      if (Platform.OS === 'web') {
        await Print.printAsync({ html: buildHtml(order) });
        return;
      }
      const { uri } = await Print.printToFileAsync({ html: buildHtml(order) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share invoice' });
      } else {
        setMessage(`Invoice saved to ${uri}`);
      }
    } catch (error) {
      setMessage((error as Error).message || 'Could not generate the PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2 px-4">
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/invoices'))}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent">
          <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
        </Pressable>
        <Text className="text-h2 text-foreground flex-1">Invoice</Text>
        <Pressable
          accessibilityLabel="Share invoice"
          hitSlop={8}
          onPress={() => order && void Share.share({ message: invoiceText(order) })}
          className="h-9 flex-row items-center gap-1 rounded-full border border-border px-3 active:opacity-70">
          <Icon as={DownloadIcon} size={14} className="text-foreground" />
          <Text className="text-caption text-foreground font-medium">Share</Text>
        </Pressable>
      </View>

      {!isSignedIn ? (
        <SignedOut title="Sign in to view this invoice" />
      ) : orderQuery.isLoading ? (
        <View className="px-4 pt-4">
          <RowsSkeleton rows={4} />
        </View>
      ) : orderQuery.error || !order ? (
        <ErrorState error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}>
            <View className="border-border rounded-2xl border p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-h2 text-foreground tracking-[3px]">MENTOOS</Text>
                  <Text className="text-caption text-muted-foreground mt-1">{SELLER.name}</Text>
                  <Text className="text-caption text-muted-foreground">{SELLER.address}</Text>
                  <Text className="text-caption text-muted-foreground">GSTIN {SELLER.gstin}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-caption text-muted-foreground font-semibold tracking-widest">
                    TAX INVOICE
                  </Text>
                  <Text className="text-label text-foreground mt-1 font-semibold">
                    {order.invoiceNumber ?? order.orderNumber}
                  </Text>
                  <Text className="text-caption text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              </View>

              <View className="border-border mt-4 border-t pt-3">
                <Text className="text-caption text-muted-foreground font-semibold tracking-widest">
                  BILL TO
                </Text>
                <Text className="text-label text-foreground mt-1">
                  {order.shippingAddress?.street ?? '—'}
                </Text>
                <Text className="text-caption text-muted-foreground">
                  {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.zip]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            </View>

            {/* Items */}
            <View className="border-border overflow-hidden rounded-2xl border">
              <View className="bg-secondary flex-row px-3 py-2">
                <Text className="text-caption text-secondary-foreground flex-1 font-semibold">Item</Text>
                <Text className="text-caption text-secondary-foreground w-10 text-center font-semibold">Qty</Text>
                <Text className="text-caption text-secondary-foreground w-20 text-right font-semibold">Amount</Text>
              </View>
              {order.items.map((item, index) => {
                const product = typeof item.productId === 'object' ? item.productId : undefined;
                return (
                  <View key={index} className="border-border flex-row items-start border-t px-3 py-2.5">
                    <View className="flex-1">
                      <Text className="text-label text-foreground" numberOfLines={2}>
                        {product?.name ?? item.name ?? 'Product'}
                      </Text>
                      {item.variations?.length ? (
                        <Text className="text-caption text-muted-foreground">
                          {item.variations.map((variation) => variation.value).join(' / ')}
                        </Text>
                      ) : null}
                    </View>
                    <Text className="text-label text-muted-foreground w-10 text-center">{item.quantity}</Text>
                    <Text className="text-label text-foreground w-20 text-right font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Totals */}
            <View className="border-border gap-1.5 rounded-2xl border p-4">
              <Row label="Subtotal" value={formatPrice(order.subtotal ?? order.total)} />
              {order.discountAmount ? (
                <Row label={`Discount${order.discountCode ? ` (${order.discountCode})` : ''}`} value={`− ${formatPrice(order.discountAmount)}`} />
              ) : null}
              <Row label="Shipping" value={order.shippingCost ? formatPrice(order.shippingCost) : 'Free'} />
              {order.taxAmount ? <Row label="GST" value={formatPrice(order.taxAmount)} /> : null}
              <View className="border-border mt-1 border-t pt-2">
                <Row label="Total paid" value={formatPrice(order.total)} strong />
              </View>
              <Text className="text-caption text-muted-foreground mt-1 capitalize">
                {order.paymentMethod ?? 'cod'} · {order.paymentStatus ?? 'pending'}
              </Text>
            </View>

            <Text className="text-caption text-muted-foreground text-center">
              This is a computer-generated invoice. Goods once sold are subject to our returns policy.
            </Text>

            {message ? <Text className="text-caption text-destructive">{message}</Text> : null}
          </ScrollView>

          <View className="border-border border-t px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
            <Button className="h-12" disabled={busy} onPress={() => void download()}>
              <Icon as={DownloadIcon} size={16} className="text-primary-foreground" />
              <Text className="text-body font-semibold">{busy ? 'Preparing…' : 'Download PDF'}</Text>
            </Button>
          </View>
        </>
      )}
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Text className={`text-label ${strong ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
        {label}
      </Text>
      <Text className={`${strong ? 'text-body font-semibold' : 'text-label'} text-foreground`}>{value}</Text>
    </View>
  );
}

function invoiceText(order: Order) {
  return `Mentoos invoice ${order.invoiceNumber ?? order.orderNumber}\n${new Date(
    order.createdAt
  ).toDateString()}\nTotal: ${formatPrice(order.total)}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[character];
  });
}

function buildHtml(order: Order) {
  const rows = order.items
    .map((item) => {
      const product = typeof item.productId === 'object' ? item.productId : undefined;
      const variant = item.variations?.map((variation) => variation.value).join(' / ') ?? '';
      return `<tr>
        <td>${escapeHtml(product?.name ?? item.name ?? 'Product')}${
          variant ? `<div class="muted">${escapeHtml(variant)}</div>` : ''
        }</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${escapeHtml(formatPrice(item.price))}</td>
        <td class="right">${escapeHtml(formatPrice(item.price * item.quantity))}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 32px; }
    h1 { font-size: 20px; letter-spacing: 4px; margin: 0 0 4px; }
    .muted { color: #64748b; font-size: 11px; }
    .head { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 8px 6px; }
    td { font-size: 12px; padding: 10px 6px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .right { text-align: right; } .center { text-align: center; }
    .totals { margin-top: 18px; margin-left: auto; width: 260px; }
    .totals div { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; }
    .totals .grand { border-top: 1px solid #e2e8f0; font-weight: 700; font-size: 14px; margin-top: 6px; padding-top: 8px; }
    .foot { margin-top: 28px; font-size: 10px; color: #64748b; }
  </style></head><body>
    <div class="head">
      <div>
        <h1>MENTOOS</h1>
        <div class="muted">${escapeHtml(SELLER.name)}</div>
        <div class="muted">${escapeHtml(SELLER.address)}</div>
        <div class="muted">GSTIN ${escapeHtml(SELLER.gstin)}</div>
      </div>
      <div style="text-align:right">
        <div class="muted">TAX INVOICE</div>
        <div><strong>${escapeHtml(order.invoiceNumber ?? order.orderNumber)}</strong></div>
        <div class="muted">${escapeHtml(new Date(order.createdAt).toDateString())}</div>
        <div class="muted">${escapeHtml(order.paymentMethod ?? 'cod')} · ${escapeHtml(order.paymentStatus ?? 'pending')}</div>
      </div>
    </div>

    <div style="margin-top:16px">
      <div class="muted">BILL TO</div>
      <div>${escapeHtml(order.shippingAddress?.street ?? '')}</div>
      <div class="muted">${escapeHtml(
        [order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.zip]
          .filter(Boolean)
          .join(', ')
      )}</div>
    </div>

    <table>
      <thead><tr><th>Item</th><th class="center">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal</span><span>${escapeHtml(formatPrice(order.subtotal ?? order.total))}</span></div>
      ${
        order.discountAmount
          ? `<div><span>Discount</span><span>-${escapeHtml(formatPrice(order.discountAmount))}</span></div>`
          : ''
      }
      <div><span>Shipping</span><span>${escapeHtml(
        order.shippingCost ? formatPrice(order.shippingCost) : 'Free'
      )}</span></div>
      ${order.taxAmount ? `<div><span>GST</span><span>${escapeHtml(formatPrice(order.taxAmount))}</span></div>` : ''}
      <div class="grand"><span>Total</span><span>${escapeHtml(formatPrice(order.total))}</span></div>
    </div>

    <div class="foot">Computer-generated invoice. Good sold are subject to our 30-day returns policy.</div>
  </body></html>`;
}
