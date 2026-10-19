'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { TOKEN_REFRESHED_EVENT, SESSION_EXPIRED_EVENT } from '@/lib/utils/auth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
  orderNumber?: string;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Backend emits (server/src/config/socket.ts + controllers):
// paymentConfirmed, paymentReceived, orderShipped, trackingUpdated,
// orderStatusUpdate, orderRefunded, returnRequested, returnUpdated,
// backInStock, priceDrop
const EVENT_MAP: Record<string, (d: any) => { title: string; message: string; type: string }> = {
  paymentConfirmed: (d) => ({ type: 'payment', title: 'Payment Confirmed', message: d.message || `Payment confirmed for order ${d.orderNumber || d.orderId || ''}`.trim() }),
  paymentReceived: (d) => ({ type: 'payment', title: 'Payment Received', message: d.message || `Payment received: ₹${d.amount ?? ''}` }),
  orderShipped: (d) => ({ type: 'orderUpdate', title: 'Order Shipped', message: d.message || `Order ${d.orderNumber || ''} shipped via ${d.courier || 'courier'}${d.awb ? ` • AWB ${d.awb}` : ''}` }),
  trackingUpdated: (d) => ({ type: 'orderUpdate', title: 'Tracking Update', message: d.message || `Order ${d.orderNumber || ''}: ${d.status || d.shipmentStatus || 'status updated'}` }),
  orderStatusUpdate: (d) => ({ type: 'orderUpdate', title: 'Order Status', message: d.message || `Order ${d.orderNumber || d.orderId || ''}: ${d.oldStatus || ''} → ${d.newStatus || d.status || ''}` }),
  orderRefunded: (d) => ({ type: 'refund', title: 'Refund Processed', message: d.message || `Refund ₹${d.amount ?? ''} for order ${d.orderNumber || ''}` }),
  returnRequested: (d) => ({ type: 'refund', title: 'Return Requested', message: d.message || `Return ${d.rmaId || ''} requested` }),
  returnUpdated: (d) => ({ type: 'refund', title: 'Return Update', message: d.message || `Return ${d.rmaId || ''}: ${d.status || ''}` }),
  backInStock: (d) => ({ type: 'stock', title: 'Back In Stock', message: d.message || `${d.productName || 'Product'} is back in stock` }),
  priceDrop: (d) => ({ type: 'promotion', title: 'Price Drop', message: d.message || `${d.productName || 'Product'} price dropped to ₹${d.price ?? ''}` }),
  orderUpdate: (d) => ({ type: 'orderUpdate', title: 'Order Update', message: d.message || `Order #${d.orderId} status: ${d.status}` }),
  promotion: (d) => ({ type: 'promotion', title: d.title || 'Offer', message: d.message + (d.discountCode ? ` Use code: ${d.discountCode}` : '') }),
  lowStockAlert: (d) => ({ type: 'lowStockAlert', title: 'Low Stock Alert', message: `${d.productName} is running low (${d.currentStock} units)` }),
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Bumps every time the access token rotates so the socket re-authenticates
  // instead of silently dying 15 minutes after login.
  const [authEpoch, setAuthEpoch] = useState(0);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const full: Notification = { ...n, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date(), read: false };
    setNotifications((prev) => [full, ...prev].slice(0, 20));
    setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== full.id)), 12000);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onRefreshed = () => setAuthEpoch((e) => e + 1);
    const onExpired = () => {
      setSocket((prev) => {
        try { prev?.close(); } catch { /* ignore */ }
        return null;
      });
      setIsConnected(false);
    };
    window.addEventListener(TOKEN_REFRESHED_EVENT, onRefreshed);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      window.removeEventListener(TOKEN_REFRESHED_EVENT, onRefreshed);
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const accessToken =
      localStorage.getItem('accessToken') || (session as any)?.accessToken;
    if (!accessToken) return;
    let sock: Socket | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { io } = await import('socket.io-client');
        if (cancelled) return;
        sock = io(API_URL, {
          auth: { token: accessToken },
          extraHeaders: { Authorization: `Bearer ${accessToken}` },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: 10,
        });
        sock.on('connect', () => setIsConnected(true));
        sock.on('disconnect', () => setIsConnected(false));
        sock.on('connect_error', () => setIsConnected(false));
        Object.keys(EVENT_MAP).forEach((ev) => {
          sock!.on(ev, (data: any) => {
            try {
              const mapped = EVENT_MAP[ev](data || {});
              addNotification({
                type: mapped.type,
                title: mapped.title,
                message: mapped.message,
                orderId: data?.orderId,
                orderNumber: data?.orderNumber,
              });
            } catch { /* ignore */ }
          });
        });
        setSocket(sock);
      } catch { /* offline */ }
    })();
    return () => {
      cancelled = true;
      sock?.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [session, authEpoch, addNotification]);

  const clearNotifications = useCallback(() => setNotifications([]), []);
  const dismissNotification = useCallback((id: string) => setNotifications((p) => p.filter((n) => n.id !== id)), []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, notifications, clearNotifications, dismissNotification }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
