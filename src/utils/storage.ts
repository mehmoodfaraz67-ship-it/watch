import { DEFAULT_STORE_SETTINGS, INITIAL_WATCHES } from '../data/initialWatches';
import { CartItem, OrderRecord, StoreSettings, WatchProduct } from '../types';

const KEYS = {
  WATCHES: 'vespera_watches_v1',
  CART: 'vespera_cart_v1',
  WISHLIST: 'vespera_wishlist_v1',
  SETTINGS: 'vespera_settings_v1',
  ORDERS: 'vespera_orders_v1',
  NEWSLETTER: 'vespera_newsletter_v1',
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadWatches(): WatchProduct[] {
  const stored = safeRead<WatchProduct[] | null>(KEYS.WATCHES, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return stored;
  }
  safeWrite(KEYS.WATCHES, INITIAL_WATCHES);
  return INITIAL_WATCHES;
}

export function saveWatches(watches: WatchProduct[]): void {
  safeWrite(KEYS.WATCHES, watches);
}

export function resetDefaultWatches(): WatchProduct[] {
  safeWrite(KEYS.WATCHES, INITIAL_WATCHES);
  return INITIAL_WATCHES;
}

export function loadCart(): CartItem[] {
  const stored = safeRead<CartItem[]>(KEYS.CART, []);
  return Array.isArray(stored)
    ? stored.filter((i) => i && typeof i.watchId === 'string' && i.quantity > 0)
    : [];
}

export function saveCart(cart: CartItem[]): void {
  safeWrite(KEYS.CART, cart);
}

export function loadWishlist(): string[] {
  const stored = safeRead<string[]>(KEYS.WISHLIST, []);
  return Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [];
}

export function saveWishlist(wishlist: string[]): void {
  safeWrite(KEYS.WISHLIST, wishlist);
}

export function loadSettings(): StoreSettings {
  const stored = safeRead<Partial<StoreSettings> | null>(KEYS.SETTINGS, null);
  const merged = { ...DEFAULT_STORE_SETTINGS, ...(stored || {}) };
  // Migrate prior default branding automatically while preserving custom user settings
  if (merged.businessName === 'Vespera Horology') {
    merged.businessName = DEFAULT_STORE_SETTINGS.businessName;
  }
  if (merged.supportEmail === 'concierge@vesperahorology.com') {
    merged.supportEmail = DEFAULT_STORE_SETTINGS.supportEmail;
  }
  return merged;
}

export function saveSettings(settings: StoreSettings): void {
  safeWrite(KEYS.SETTINGS, settings);
}

export function loadOrders(): OrderRecord[] {
  const stored = safeRead<OrderRecord[]>(KEYS.ORDERS, []);
  return Array.isArray(stored) ? stored : [];
}

export function saveOrder(order: OrderRecord): OrderRecord[] {
  const existing = loadOrders();
  const next = [order, ...existing].slice(0, 20);
  safeWrite(KEYS.ORDERS, next);
  return next;
}

export function saveNewsletterSubscriber(email: string): boolean {
  const existing = safeRead<string[]>(KEYS.NEWSLETTER, []);
  const normalized = email.trim().toLowerCase();
  if (existing.includes(normalized)) {
    return false;
  }
  safeWrite(KEYS.NEWSLETTER, [normalized, ...existing]);
  return true;
}
