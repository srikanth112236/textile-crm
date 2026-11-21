/**
 * Pending commerce action queue.
 *
 * A guest clicks "Add to cart" / "Buy now" / "Save". We store the intent,
 * open the login modal, then reload the same page after sign-in. The
 * <PendingActionRunner /> (mounted inside Cart/Wishlist providers) replays it
 * once the authenticated session is available. This avoids stale React
 * closures where `isAuthenticated` is still false during the login callback.
 */

export interface PendingCartLine {
  productId: string;
  quantity: number;
  variations?: Array<{ name: string; value: string }>;
}

export type PendingCommerceAction =
  | ({
      type: 'add_to_cart';
    } & PendingCartLine)
  | {
      type: 'wishlist_add';
      productId: string;
    }
  | ({
      type: 'buy_now';
    } & PendingCartLine)
  | {
      type: 'add_many';
      items: PendingCartLine[];
    }
  | {
      type: 'checkout';
    }
  | {
      type: 'review';
      productId?: string;
    };

export type QueuedCommerceAction = PendingCommerceAction & {
  /** Where the visitor should land after sign-in. */
  returnTo?: string;
  /** Guard against a stale action executing much later in the same tab. */
  queuedAt?: number;
};

const STORAGE_KEY = 'mentoos.pendingCommerceAction';
const MAX_AGE_MS = 30 * 60 * 1000;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function queueCommerceAction(action: QueuedCommerceAction): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...action, queuedAt: action.queuedAt ?? Date.now() })
    );
  } catch {
    // Private mode / quota: the login still works, only replay is skipped.
  }
}

export function peekCommerceAction(): QueuedCommerceAction | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QueuedCommerceAction;
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) return null;
    if (parsed.queuedAt && Date.now() - parsed.queuedAt > MAX_AGE_MS) {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Read and remove atomically enough for a single-tab checkout intent. */
export function takeCommerceAction(): QueuedCommerceAction | null {
  const action = peekCommerceAction();
  clearCommerceAction();
  return action;
}

export function clearCommerceAction(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
