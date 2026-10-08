import type { PantryProduct, CartItem, Order, OrderItem } from '../types';
import { orderService } from './orders';

export type AnalyticsConsentState = 'granted' | 'denied' | 'unset';

export interface GA4EcommerceItem {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: string;
  item_variant?: string;
  price: number;
  quantity: number;
  discount?: number;
  coupon?: string;
}

export interface AnalyticsRecordedEvent {
  eventName: string;
  params: Record<string, any>;
  timestamp: string;
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const ANALYTICS_CONSENT_STORAGE_KEY = 'nyutaelite_analytics_consent';
export const PURCHASED_TXNS_STORAGE_KEY = 'nyutaelite_ga4_purchased_txns';
export const REFUNDED_TXNS_STORAGE_KEY = 'nyutaelite_ga4_refunded_txns';
export const CANONICAL_ORIGIN = 'https://nutyaelite.com';
const BRAND_NAME = 'NYUTA ELITE MAKHANA';
const DEFAULT_CURRENCY = 'INR';

// Forbidden keys that must NEVER be transmitted to GA4 or printed in debug logs
const FORBIDDEN_PARAM_KEYS = new Set([
  'email',
  'useremail',
  'customeremail',
  'phone',
  'phonenumber',
  'contact',
  'mobile',
  'password',
  'passwordhash',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'authorization',
  'address',
  'shippingaddress',
  'billingaddress',
  'addressline1',
  'addressline2',
  'street',
  'housenumber',
  'landmark',
  'postalcode',
  'pincode',
  'zip',
  'fullname',
  'customername',
  'userid',
  'customerid',
  'razorpay_signature',
  'razorpaysignature',
  'razorpaykeysecret',
  'razorpay_key_secret',
  'razorpaywebhooksecret',
  'card',
  'cardnumber',
  'cvv',
  'upi',
  'upiid',
  'bank',
  'bankaccount',
  'apikey',
  'secret',
  'database_url',
]);

// Patterns in string values that indicate PII or credentials
const EMAIL_VALUE_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_VALUE_REGEX = /(?:\+91[\s-]?)?[6-9]\d{9}\b/;
const JWT_VALUE_REGEX = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const SECRET_VALUE_REGEX = /(?:rzp_live_|rzp_test_|sk_live_|postgresql:\/\/|BEGIN PRIVATE KEY)/i;

// Internal state (supports both browser and Node test environments)
let runtimeMeasurementIdOverride: string | undefined = undefined;
let runtimeDebugOverride: boolean | undefined = undefined;
let runtimeCurrentPathOverride: string | undefined = undefined;
let runtimeAdminRoleOverride: boolean | undefined = undefined;
let gtagInitializedForId: string | null = null;
let lastTrackedPagePath: string | null = null;
let lastTrackedViewItemSku: string | null = null;
let lastTrackedItemListSignature: string | null = null;
let lastTrackedCartSignature: string | null = null;
let lastTrackedBeginCheckoutSignature: string | null = null;

const inMemoryPurchasedTxns = new Set<string>();
const inMemoryRefundedTxns = new Set<string>();
const inMemoryStorage = new Map<string, string>();
const recordedEventsBuffer: AnalyticsRecordedEvent[] = [];

type ConsentListener = (state: AnalyticsConsentState) => void;
const consentListeners = new Set<ConsentListener>();

function safeGetEnv(key: string): string {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && typeof metaEnv[key] === 'string') {
      return metaEnv[key].trim();
    }
  } catch {
    // ignore
  }
  try {
    const nodeEnv = (globalThis as any)?.process?.env;
    if (nodeEnv && typeof nodeEnv[key] === 'string') {
      return String(nodeEnv[key]).trim();
    }
  } catch {
    // ignore
  }
  return '';
}

function safeStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // fallback to in-memory
  }
  return inMemoryStorage.get(key) ?? null;
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // fallback to in-memory
  }
  inMemoryStorage.set(key, value);
}

function roundCurrency(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100) / 100;
}

/**
 * Retrieve the configured GA4 Measurement ID (e.g. G-XXXXXXXXXX).
 */
export function getMeasurementId(): string {
  if (runtimeMeasurementIdOverride !== undefined) {
    return runtimeMeasurementIdOverride.trim();
  }
  return safeGetEnv('VITE_GA_MEASUREMENT_ID');
}

export function isValidMeasurementId(...args: Array<string | null | undefined>): boolean {
  const id = args.length > 0 ? args[0] : getMeasurementId();
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  // Ignore placeholder values like G-XXXXXXXXXX
  if (/^G-X+$/i.test(trimmed)) return false;
  return /^G-[A-Z0-9]{4,20}$/i.test(trimmed);
}

/**
 * Check whether analytics debug logging is enabled.
 */
export function isAnalyticsDebugEnabled(): boolean {
  if (runtimeDebugOverride !== undefined) {
    return runtimeDebugOverride;
  }
  const raw = safeGetEnv('VITE_ANALYTICS_DEBUG').toLowerCase();
  return raw === 'true' || raw === '1';
}

/**
 * Check if a given URL pathname belongs to the Admin Portal (/admin/*) or internal API (/api/*).
 * Admin routes must NEVER be tracked in customer marketing analytics.
 */
export function isAdminOrPrivateAnalyticsPath(pathname?: string): boolean {
  const path =
    pathname ??
    runtimeCurrentPathOverride ??
    (typeof window !== 'undefined' && window.location ? window.location.pathname : '/');
  const normalized = String(path || '/').trim().toLowerCase();
  return (
    normalized === '/admin' ||
    normalized.startsWith('/admin/') ||
    normalized === '/api' ||
    normalized.startsWith('/api/')
  );
}

/**
 * Check whether the active session belongs to an ADMIN user in localStorage.
 */
function isCurrentUserAdmin(): boolean {
  if (runtimeAdminRoleOverride !== undefined) {
    return runtimeAdminRoleOverride;
  }
  try {
    const rawUser = safeStorageGet('nyutaelite_user');
    if (!rawUser) return false;
    const parsed = JSON.parse(rawUser);
    return parsed?.role === 'ADMIN';
  } catch {
    return false;
  }
}

/**
 * Read current analytics consent status ('granted' | 'denied' | 'unset').
 * Analytics remains disabled until consent is explicitly 'granted'.
 */
export function getAnalyticsConsent(): AnalyticsConsentState {
  const stored = safeStorageGet(ANALYTICS_CONSENT_STORAGE_KEY);
  if (stored === 'granted' || stored === 'denied') {
    return stored;
  }
  return 'unset';
}

export function setAnalyticsConsent(state: AnalyticsConsentState): void {
  try {
    safeStorageSet(ANALYTICS_CONSENT_STORAGE_KEY, state);
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: state === 'granted' ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
    if (state === 'granted') {
      initGA4();
    }
    consentListeners.forEach((cb) => {
      try {
        cb(state);
      } catch {
        // ignore listener errors
      }
    });
  } catch {
    // never crash storefront
  }
}

export function grantAnalyticsConsent(): void {
  setAnalyticsConsent('granted');
}

export function denyAnalyticsConsent(): void {
  setAnalyticsConsent('denied');
}

export function resetAnalyticsConsent(): void {
  setAnalyticsConsent('unset');
}

export function subscribeAnalyticsConsent(listener: ConsentListener): () => void {
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
  };
}

/**
 * Recursively sanitize event parameters to guarantee zero PII, addresses, phone numbers,
 * emails, tokens, or payment secrets ever reach GA4 or debug output.
 */
export function sanitizeAnalyticsParams(input: Record<string, any>): Record<string, any> {
  if (!input || typeof input !== 'object') return {};

  const cleanObject = (obj: Record<string, any>, depth = 0): Record<string, any> => {
    if (depth > 4) return {};
    const out: Record<string, any> = {};
    for (const [rawKey, rawVal] of Object.entries(obj)) {
      if (rawVal === undefined || rawVal === null) continue;
      const normalizedKey = rawKey.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (FORBIDDEN_PARAM_KEYS.has(normalizedKey)) {
        continue;
      }

      if (typeof rawVal === 'string') {
        const trimmed = rawVal.trim();
        if (
          EMAIL_VALUE_REGEX.test(trimmed) ||
          PHONE_VALUE_REGEX.test(trimmed) ||
          JWT_VALUE_REGEX.test(trimmed) ||
          SECRET_VALUE_REGEX.test(trimmed)
        ) {
          continue;
        }
        out[rawKey] = trimmed.slice(0, 200);
      } else if (typeof rawVal === 'number') {
        if (Number.isFinite(rawVal)) {
          out[rawKey] = rawVal;
        }
      } else if (typeof rawVal === 'boolean') {
        out[rawKey] = rawVal;
      } else if (Array.isArray(rawVal)) {
        out[rawKey] = rawVal
          .slice(0, 50)
          .map((entry) =>
            entry && typeof entry === 'object' && !Array.isArray(entry)
              ? cleanObject(entry, depth + 1)
              : typeof entry === 'string' || typeof entry === 'number'
              ? entry
              : null
          )
          .filter(Boolean);
      } else if (typeof rawVal === 'object') {
        out[rawKey] = cleanObject(rawVal, depth + 1);
      }
    }
    return out;
  };

  return cleanObject(input, 0);
}

/**
 * Convert a PantryProduct, CartItem, or OrderItem into a standardized GA4 ecommerce item.
 */
export function toGA4Item(
  source:
    | PantryProduct
    | CartItem
    | OrderItem
    | { product: PantryProduct; quantity?: number }
    | {
        id?: string;
        item_id?: string;
        productId?: string;
        sku?: string;
        name?: string;
        item_name?: string;
        productName?: string;
        quality?: string;
        category?: string;
        weightGrams?: number;
        netWeight?: string;
        price?: number;
        unitPrice?: number;
        mrp?: number;
        quantity?: number;
        coupon?: string;
      },
  overrideQuantity?: number,
  couponCode?: string
): GA4EcommerceItem {
  const raw = source as any;
  const s = raw && raw.product && typeof raw.product === 'object' ? raw.product : raw;
  const rawSku = s.sku || s.item_id || s.id || s.productId || 'makhana-pack';
  const itemName = String(s.name || s.item_name || s.productName || 'NYUTA ELITE Makhana').trim();
  const category = String(
    s.quality ||
      s.category ||
      (itemName.toLowerCase().includes('premium') ? 'Premium' : 'Normal')
  ).trim();
  const weightGrams = Number(s.weightGrams || 0);
  const variant =
    s.netWeight || (weightGrams > 0 ? `${weightGrams}g` : undefined);
  const price = roundCurrency(s.price ?? s.unitPrice ?? 0);
  const mrp = roundCurrency(s.mrp ?? price);
  const perUnitDiscount = mrp > price ? roundCurrency(mrp - price) : undefined;
  const quantity = Math.max(
    1,
    Math.round(Number(overrideQuantity ?? raw?.quantity ?? s.quantity ?? 1))
  );

  const item: GA4EcommerceItem = {
    item_id: String(rawSku).trim(),
    item_name: itemName,
    item_brand: BRAND_NAME,
    item_category: category,
    price,
    quantity,
  };

  if (variant) {
    item.item_variant = variant;
  }
  if (perUnitDiscount && perUnitDiscount > 0) {
    item.discount = perUnitDiscount;
  }
  if (couponCode) {
    item.coupon = String(couponCode).trim().toUpperCase();
  }

  return item;
}

/**
 * Initialize Google Analytics 4 asynchronously and safely.
 * No-ops safely if Measurement ID is missing, user has not granted consent, or current path is /admin/*.
 */
export function initGA4(pathname?: string): boolean {
  try {
    if (isAdminOrPrivateAnalyticsPath(pathname)) {
      return false;
    }

    if (getAnalyticsConsent() !== 'granted') {
      return false;
    }

    const measurementId = getMeasurementId();
    if (!isValidMeasurementId(measurementId)) {
      if (isAnalyticsDebugEnabled()) {
        console.info('[GA4 Debug] Measurement ID missing or placeholder; running in safe no-op mode.');
      }
      return false;
    }

    if (typeof window === 'undefined') {
      gtagInitializedForId = measurementId;
      return true;
    }

    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
    }

    if (gtagInitializedForId !== measurementId) {
      // Set default consent mode before config
      window.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });

      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        send_page_view: false, // Controlled explicitly by SPA route tracker to prevent duplicate page_view
        anonymize_ip: true,
        debug_mode: isAnalyticsDebugEnabled(),
      });

      // Inject async gtag.js script tag if not already present in DOM
      if (typeof document !== 'undefined' && document.head) {
        const existingScript = document.getElementById('nyuta-ga4-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'nyuta-ga4-script';
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
          script.onerror = () => {
            if (isAnalyticsDebugEnabled()) {
              console.warn('[GA4 Debug] gtag.js failed to load; storefront continues unaffected.');
            }
          };
          document.head.appendChild(script);
        }
      }

      gtagInitializedForId = measurementId;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Core safe event dispatcher.
 * Never throws, never blocks UI/checkout, respects consent and admin exclusion.
 */
export function trackEvent(
  eventName: string,
  rawParams: Record<string, any> = {},
  options: { allowOnAdminForConfirmedRefund?: boolean; currentPath?: string } = {}
): boolean {
  try {
    const activePath = options.currentPath ?? runtimeCurrentPathOverride;

    // Exclude /admin/* paths and admin user sessions (except authoritative backend refund measurement if explicitly enabled)
    if (!options.allowOnAdminForConfirmedRefund) {
      if (isAdminOrPrivateAnalyticsPath(activePath) || isCurrentUserAdmin()) {
        return false;
      }
    }

    // Require explicit user consent
    if (getAnalyticsConsent() !== 'granted') {
      return false;
    }

    const sanitizedParams = sanitizeAnalyticsParams(rawParams);
    if (isAnalyticsDebugEnabled()) {
      sanitizedParams.debug_mode = true;
    }

    const record: AnalyticsRecordedEvent = {
      eventName,
      params: sanitizedParams,
      timestamp: new Date().toISOString(),
    };
    recordedEventsBuffer.push(record);
    if (recordedEventsBuffer.length > 200) {
      recordedEventsBuffer.shift();
    }

    if (isAnalyticsDebugEnabled()) {
      console.info(`[GA4 Debug] Event: ${eventName}`, sanitizedParams);
    }

    const measurementId = getMeasurementId();
    if (!isValidMeasurementId(measurementId)) {
      return true;
    }

    initGA4(activePath);

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, sanitizedParams);
    }

    return true;
  } catch {
    // Analytics must NEVER break the storefront
    return false;
  }
}

/**
 * 1. SPA Route Page View Tracking (`page_view`)
 * Avoids duplicate emissions for the same route path + search query.
 */
export function trackPageView(params: {
  path: string;
  search?: string;
  title?: string;
  locationHref?: string;
}): boolean {
  try {
    const rawPath = params.path || '/';
    if (isAdminOrPrivateAnalyticsPath(rawPath) || isCurrentUserAdmin()) {
      return false;
    }

    const searchPart = params.search ? (params.search.startsWith('?') ? params.search : `?${params.search}`) : '';
    const fullPath = `${rawPath}${searchPart}`;

    if (lastTrackedPagePath === fullPath) {
      return false;
    }

    const pageTitle =
      params.title ||
      (typeof document !== 'undefined' && document.title ? document.title : BRAND_NAME);
    const pageLocation =
      params.locationHref ||
      `${CANONICAL_ORIGIN}${fullPath.startsWith('/') ? fullPath : `/${fullPath}`}`;

    const sent = trackEvent(
      'page_view',
      {
        page_path: fullPath,
        page_title: pageTitle,
        page_location: pageLocation,
      },
      { currentPath: rawPath }
    );

    if (sent) {
      lastTrackedPagePath = fullPath;
    }
    return sent;
  } catch {
    return false;
  }
}

/**
 * 2. Track Product Collection / List Impressions (`view_item_list`)
 */
export function trackViewItemList(params: {
  listId: string;
  listName: string;
  products: PantryProduct[];
}): boolean {
  try {
    if (!Array.isArray(params.products) || params.products.length === 0) return false;
    const items = params.products.map((p) => toGA4Item(p, 1));
    const signature = `${params.listId}:${items.map((i) => i.item_id).join(',')}`;
    if (lastTrackedItemListSignature === signature) {
      return false;
    }
    const sent = trackEvent('view_item_list', {
      item_list_id: params.listId,
      item_list_name: params.listName,
      items,
    });
    if (sent) {
      lastTrackedItemListSignature = signature;
    }
    return sent;
  } catch {
    return false;
  }
}

/**
 * 3. Track Product Selection from a List (`select_item`)
 */
export function trackSelectItem(params: {
  listId: string;
  listName: string;
  product: PantryProduct;
}): boolean {
  try {
    if (!params.product) return false;
    const item = toGA4Item(params.product, 1);
    return trackEvent('select_item', {
      item_list_id: params.listId,
      item_list_name: params.listName,
      items: [item],
    });
  } catch {
    return false;
  }
}

/**
 * 4. Track Product Detail View (`view_item`)
 */
export function trackViewItem(product: PantryProduct, quantity = 1): boolean {
  try {
    if (!product) return false;
    const item = toGA4Item(product, quantity);
    const signature = `${item.item_id}:${item.price}`;
    if (lastTrackedViewItemSku === signature) {
      return false;
    }
    const sent = trackEvent('view_item', {
      currency: DEFAULT_CURRENCY,
      value: roundCurrency(item.price * item.quantity),
      items: [item],
    });
    if (sent) {
      lastTrackedViewItemSku = signature;
    }
    return sent;
  } catch {
    return false;
  }
}

/**
 * 5. Track Successful Cart Addition (`add_to_cart`)
 * Must be called ONLY after the cart state/API operation succeeds.
 */
export function trackAddToCart(
  productOrItem: PantryProduct | CartItem,
  quantityAdded = 1
): boolean {
  try {
    if (!productOrItem || quantityAdded <= 0) return false;
    const item = toGA4Item(productOrItem, quantityAdded);
    return trackEvent('add_to_cart', {
      currency: DEFAULT_CURRENCY,
      value: roundCurrency(item.price * item.quantity),
      items: [item],
    });
  } catch {
    return false;
  }
}

/**
 * 6. Track Successful Item Removal from Cart (`remove_from_cart`)
 */
export function trackRemoveFromCart(
  productOrItem: PantryProduct | CartItem,
  quantityRemoved = 1
): boolean {
  try {
    if (!productOrItem || quantityRemoved <= 0) return false;
    const item = toGA4Item(productOrItem, quantityRemoved);
    return trackEvent('remove_from_cart', {
      currency: DEFAULT_CURRENCY,
      value: roundCurrency(item.price * item.quantity),
      items: [item],
    });
  } catch {
    return false;
  }
}

/**
 * 7. Track Cart View (`view_cart`)
 * Controlled signature prevents duplicate firing on React re-renders.
 */
export function trackViewCart(cartItems: CartItem[], source: 'page' | 'drawer' = 'page'): boolean {
  try {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return false;
    const items = cartItems.map((c) => toGA4Item(c, c.quantity));
    const totalValue = roundCurrency(
      items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    );
    const signature = `${source}:${items.map((i) => `${i.item_id}x${i.quantity}`).join('|')}`;
    if (lastTrackedCartSignature === signature) {
      return false;
    }
    const sent = trackEvent('view_cart', {
      currency: DEFAULT_CURRENCY,
      value: totalValue,
      items,
    });
    if (sent) {
      lastTrackedCartSignature = signature;
    }
    return sent;
  } catch {
    return false;
  }
}

/**
 * 8. Track Checkout Initiation (`begin_checkout`)
 */
export function trackBeginCheckout(params: {
  items?: any[];
  cartItems?: any[];
  value: number;
  couponCode?: string | null;
}): boolean {
  try {
    const rawItems = params.items ?? params.cartItems ?? [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) return false;
    const coupon = params.couponCode ? String(params.couponCode).trim().toUpperCase() : undefined;
    const gaItems = rawItems.map((c) => toGA4Item(c, c.quantity, coupon));
    const value = roundCurrency(params.value);
    const signature = `${gaItems.map((i) => `${i.item_id}x${i.quantity}`).join('|')}:${coupon || ''}`;
    if (lastTrackedBeginCheckoutSignature === signature) {
      return false;
    }
    const sent = trackEvent('begin_checkout', {
      currency: DEFAULT_CURRENCY,
      value,
      ...(coupon ? { coupon } : {}),
      items: gaItems,
    });
    if (sent) {
      lastTrackedBeginCheckoutSignature = signature;
    }
    return sent;
  } catch {
    return false;
  }
}

/**
 * 9. Track Shipping Info Step (`add_shipping_info`)
 * Triggered only after shipping details are validated and accepted.
 * Never transmits street address, house number, phone, or email.
 */
export function trackAddShippingInfo(params: {
  items?: any[];
  cartItems?: any[];
  value: number;
  shippingTier?: string;
  couponCode?: string | null;
}): boolean {
  try {
    const rawItems = params.items ?? params.cartItems ?? [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) return false;
    const coupon = params.couponCode ? String(params.couponCode).trim().toUpperCase() : undefined;
    const gaItems = rawItems.map((i) => toGA4Item(i as any, (i as any).quantity, coupon));
    return trackEvent('add_shipping_info', {
      currency: DEFAULT_CURRENCY,
      value: roundCurrency(params.value),
      shipping_tier: params.shippingTier || 'Express Pan-India',
      ...(coupon ? { coupon } : {}),
      items: gaItems,
    });
  } catch {
    return false;
  }
}

/**
 * 10. Track Payment Info Step (`add_payment_info`)
 * Triggered when payment gateway order is initialized.
 * Never transmits card numbers, UPI IDs, tokens, or Razorpay secrets.
 */
export function trackAddPaymentInfo(params: {
  items?: any[];
  cartItems?: any[];
  value: number;
  paymentType?: string;
  couponCode?: string | null;
}): boolean {
  try {
    const rawItems = params.items ?? params.cartItems ?? [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) return false;
    const coupon = params.couponCode ? String(params.couponCode).trim().toUpperCase() : undefined;
    const gaItems = rawItems.map((i) => toGA4Item(i as any, (i as any).quantity, coupon));
    return trackEvent('add_payment_info', {
      currency: DEFAULT_CURRENCY,
      value: roundCurrency(params.value),
      payment_type: params.paymentType || 'Razorpay',
      ...(coupon ? { coupon } : {}),
      items: gaItems,
    });
  } catch {
    return false;
  }
}

function getPersistedTxnSet(storageKey: string, memorySet: Set<string>): Set<string> {
  try {
    const raw = safeStorageGet(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const id of parsed) {
          if (typeof id === 'string' && id) {
            memorySet.add(id.toUpperCase());
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return memorySet;
}

function savePersistedTxnSet(storageKey: string, memorySet: Set<string>): void {
  try {
    const arr = Array.from(memorySet).slice(-500);
    safeStorageSet(storageKey, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export function hasTrackedPurchase(transactionId: string): boolean {
  const normalized = String(transactionId || '').trim().toUpperCase();
  if (!normalized) return false;
  const purchasedSet = getPersistedTxnSet(PURCHASED_TXNS_STORAGE_KEY, inMemoryPurchasedTxns);
  return purchasedSet.has(normalized);
}

/**
 * 11. Track Authoritative Purchase (`purchase`) — CRITICAL
 * - Fires ONLY when backend order paymentStatus === 'CAPTURED'.
 * - Uses authoritative backend order.totalAmount, taxAmount, shippingAmount, couponCode.
 * - Strictly idempotent per transaction_id (orderNumber / id): refreshing confirmation or viewing orders never duplicates.
 */
export function trackPurchase(
  orderOrPayload:
    | (Order & {
        taxAmount?: number;
      })
    | {
        transactionId: string;
        paymentStatus: string;
        value: number;
        shipping?: number;
        tax?: number;
        discountAmount?: number;
        couponCode?: string | null;
        items?: any[];
        cartItems?: any[];
      },
  fallbackCartItems?: CartItem[]
): boolean {
  try {
    if (!orderOrPayload) return false;
    const p = orderOrPayload as any;

    // Require authoritative backend payment capture
    if (p.paymentStatus !== 'CAPTURED') {
      return false;
    }

    const rawTxId = String(p.transactionId || p.orderNumber || p.id || '').trim();
    if (!rawTxId) {
      return false;
    }
    const normalizedTxKey = rawTxId.toUpperCase();

    const purchasedSet = getPersistedTxnSet(PURCHASED_TXNS_STORAGE_KEY, inMemoryPurchasedTxns);
    if (purchasedSet.has(normalizedTxKey)) {
      if (isAnalyticsDebugEnabled()) {
        console.info(`[GA4 Debug] Duplicate purchase prevented for transaction_id=${rawTxId}`);
      }
      return false;
    }

    const coupon = p.couponCode ? String(p.couponCode).trim().toUpperCase() : undefined;
    const sourceItems =
      Array.isArray(p.items) && p.items.length > 0
        ? p.items
        : Array.isArray(p.cartItems) && p.cartItems.length > 0
        ? p.cartItems
        : Array.isArray(fallbackCartItems)
        ? fallbackCartItems
        : [];

    const gaItems = sourceItems.map((i: any) => toGA4Item(i, i.quantity, coupon));
    const authoritativeValue = roundCurrency(p.value ?? p.totalAmount ?? 0);
    const authoritativeTax = roundCurrency(p.tax ?? p.taxAmount ?? 0);
    const authoritativeShipping = roundCurrency(p.shipping ?? p.shippingAmount ?? 0);
    const authoritativeDiscount = roundCurrency(p.discountAmount ?? 0);

    const sent = trackEvent('purchase', {
      transaction_id: rawTxId,
      currency: DEFAULT_CURRENCY,
      value: authoritativeValue,
      tax: authoritativeTax,
      shipping: authoritativeShipping,
      ...(authoritativeDiscount > 0 ? { discount: authoritativeDiscount } : {}),
      ...(coupon ? { coupon } : {}),
      items: gaItems,
    });

    if (sent) {
      purchasedSet.add(normalizedTxKey);
      savePersistedTxnSet(PURCHASED_TXNS_STORAGE_KEY, purchasedSet);
    }

    return sent;
  } catch {
    return false;
  }
}

export function hasTrackedRefund(transactionId: string): boolean {
  const normalized = String(transactionId || '').trim().toUpperCase();
  if (!normalized) return false;
  const refundedSet = getPersistedTxnSet(REFUNDED_TXNS_STORAGE_KEY, inMemoryRefundedTxns);
  for (const key of refundedSet) {
    if (key === normalized || key.startsWith(`${normalized}:`)) {
      return true;
    }
  }
  return false;
}

/**
 * 12. Track Authoritative Refund (`refund`)
 * - Fires ONLY after backend confirms refund success.
 * - Strictly idempotent per (transaction_id, refundValue) or refundPaymentId.
 */
export function trackRefund(params: {
  transactionId: string;
  value: number;
  refundId?: string | null;
  couponCode?: string | null;
  items?: Array<any>;
}): boolean {
  try {
    const transactionId = String(params.transactionId || '').trim();
    const refundValue = roundCurrency(params.value);
    if (!transactionId || refundValue <= 0) {
      return false;
    }

    const normalizedTx = transactionId.toUpperCase();
    const dedupKey = params.refundId
      ? `${normalizedTx}:${String(params.refundId).trim().toUpperCase()}`
      : `${normalizedTx}:${refundValue}`;

    const refundedSet = getPersistedTxnSet(REFUNDED_TXNS_STORAGE_KEY, inMemoryRefundedTxns);
    if (refundedSet.has(dedupKey)) {
      return false;
    }

    const coupon = params.couponCode ? String(params.couponCode).trim().toUpperCase() : undefined;
    const gaItems = Array.isArray(params.items)
      ? params.items.map((i) => toGA4Item(i as any, (i as any).quantity, coupon))
      : undefined;

    const sent = trackEvent(
      'refund',
      {
        transaction_id: transactionId,
        currency: DEFAULT_CURRENCY,
        value: refundValue,
        ...(coupon ? { coupon } : {}),
        ...(gaItems && gaItems.length > 0 ? { items: gaItems } : {}),
      },
      { allowOnAdminForConfirmedRefund: true }
    );

    if (sent) {
      refundedSet.add(dedupKey);
      savePersistedTxnSet(REFUNDED_TXNS_STORAGE_KEY, refundedSet);
    }

    return sent;
  } catch {
    return false;
  }
}

export type PurchaseClaimResolver = (orderIdOrNumber: string) => Promise<{
  eligible: boolean;
  alreadyRecorded: boolean;
  idempotencyKey: string | null;
  reason?: string;
  payload?: {
    transactionId: string;
    orderId: string;
    currency: string;
    value: number;
    tax: number;
    shipping: number;
    discount: number;
    couponCode: string | null;
    items: any[];
  };
}>;

export type RefundClaimResolver = (
  orderIdOrNumber: string,
  refundId?: string | null
) => Promise<{
  eligible: boolean;
  alreadyRecorded: boolean;
  idempotencyKey: string | null;
  refundId: string | null;
  reason?: string;
  payload?: {
    transactionId: string;
    orderId: string;
    refundId: string;
    currency: string;
    value: number;
    couponCode: string | null;
    items: any[];
  };
}>;

let customPurchaseClaimResolver: PurchaseClaimResolver | null = null;
let customRefundClaimResolver: RefundClaimResolver | null = null;

async function defaultPurchaseClaimResolver(orderIdOrNumber: string) {
  return orderService.claimPurchaseAnalytics(orderIdOrNumber);
}

async function defaultRefundClaimResolver(orderIdOrNumber: string, refundId?: string | null) {
  return orderService.claimRefundAnalytics(orderIdOrNumber, refundId);
}

/**
 * 11b. Globally Idempotent Authoritative Purchase Tracking (`trackAuthoritativePurchase`)
 * - Queries the backend PostgreSQL `AnalyticsEvent` ledger before emitting `purchase` to GA4.
 * - Guarantees a single `purchase` event globally across multiple browsers, devices, cleared localStorage, and separate sessions.
 * - Failure-isolated: never throws or blocks checkout/order completion if backend or GA4 is unavailable.
 */
export async function trackAuthoritativePurchase(
  orderOrPayload:
    | (Order & { taxAmount?: number })
    | {
        id?: string;
        orderId?: string;
        orderNumber?: string;
        transactionId?: string;
        paymentStatus?: string;
        status?: string;
        totalAmount?: number;
        value?: number;
        shippingAmount?: number;
        shipping?: number;
        taxAmount?: number;
        tax?: number;
        discountAmount?: number;
        couponCode?: string | null;
        items?: any[];
        cartItems?: any[];
      },
  fallbackCartItems?: CartItem[]
): Promise<boolean> {
  try {
    if (!orderOrPayload) return false;
    const p = orderOrPayload as any;

    if (p.paymentStatus && p.paymentStatus !== 'CAPTURED') {
      return false;
    }
    if (p.status === 'CANCELLED') {
      return false;
    }

    const orderIdentifier = String(
      p.id || p.orderId || p.orderNumber || p.transactionId || ''
    ).trim();
    if (!orderIdentifier) {
      return false;
    }

    const resolver = customPurchaseClaimResolver ?? defaultPurchaseClaimResolver;
    const claim = await resolver(orderIdentifier);

    if (!claim || !claim.eligible || claim.alreadyRecorded) {
      const txId = String(
        claim?.payload?.transactionId || p.orderNumber || p.transactionId || orderIdentifier
      )
        .trim()
        .toUpperCase();
      if (txId && claim?.alreadyRecorded) {
        const purchasedSet = getPersistedTxnSet(PURCHASED_TXNS_STORAGE_KEY, inMemoryPurchasedTxns);
        purchasedSet.add(txId);
        savePersistedTxnSet(PURCHASED_TXNS_STORAGE_KEY, purchasedSet);
      }
      return false;
    }

    const authoritativePayload = claim.payload;
    if (authoritativePayload) {
      return trackPurchase(
        {
          transactionId: authoritativePayload.transactionId,
          paymentStatus: 'CAPTURED',
          value: authoritativePayload.value,
          tax: authoritativePayload.tax,
          shipping: authoritativePayload.shipping,
          discountAmount: authoritativePayload.discount,
          couponCode: authoritativePayload.couponCode,
          items:
            Array.isArray(authoritativePayload.items) && authoritativePayload.items.length > 0
              ? authoritativePayload.items
              : p.items || p.cartItems,
        },
        fallbackCartItems
      );
    }

    return trackPurchase(p, fallbackCartItems);
  } catch {
    // Analytics must NEVER break or block order/payment flows
    return false;
  }
}

/**
 * 12b. Globally Idempotent Authoritative Refund Tracking (`trackAuthoritativeRefund`)
 * - Queries the backend PostgreSQL `AnalyticsEvent` ledger before emitting `refund` to GA4.
 * - Guarantees each unique (orderId + refundId) fires at most once across devices, browsers, and cleared localStorage.
 * - Allows separate legitimate refunds on the same order (with distinct refundId) to fire once each.
 */
export async function trackAuthoritativeRefund(params: {
  orderId?: string;
  transactionId: string;
  refundId?: string | null;
  value?: number;
  couponCode?: string | null;
  items?: Array<any>;
}): Promise<boolean> {
  try {
    if (!params) return false;
    const orderIdentifier = String(params.orderId || params.transactionId || '').trim();
    if (!orderIdentifier) return false;

    const resolver = customRefundClaimResolver ?? defaultRefundClaimResolver;
    const claim = await resolver(orderIdentifier, params.refundId ?? null);

    if (!claim || !claim.eligible || claim.alreadyRecorded) {
      if (claim?.alreadyRecorded && claim.refundId) {
        const txKey = String(params.transactionId || orderIdentifier).trim().toUpperCase();
        const dedupKey = `${txKey}:${String(claim.refundId).trim().toUpperCase()}`;
        const refundedSet = getPersistedTxnSet(REFUNDED_TXNS_STORAGE_KEY, inMemoryRefundedTxns);
        refundedSet.add(dedupKey);
        savePersistedTxnSet(REFUNDED_TXNS_STORAGE_KEY, refundedSet);
      }
      return false;
    }

    const authoritativePayload = claim.payload;
    return trackRefund({
      transactionId: authoritativePayload?.transactionId || params.transactionId,
      refundId: claim.refundId || authoritativePayload?.refundId || params.refundId || null,
      value: authoritativePayload?.value ?? params.value ?? 0,
      couponCode: authoritativePayload?.couponCode ?? params.couponCode ?? null,
      items:
        authoritativePayload?.items && authoritativePayload.items.length > 0
          ? authoritativePayload.items
          : params.items,
    });
  } catch {
    return false;
  }
}

/**
 * Clear only browser-local idempotency state (simulates clearing localStorage or switching devices/browsers).
 */
export function clearLocalAnalyticsIdempotencyCache(): void {
  inMemoryPurchasedTxns.clear();
  inMemoryRefundedTxns.clear();
  inMemoryStorage.delete(PURCHASED_TXNS_STORAGE_KEY);
  inMemoryStorage.delete(REFUNDED_TXNS_STORAGE_KEY);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PURCHASED_TXNS_STORAGE_KEY);
      window.localStorage.removeItem(REFUNDED_TXNS_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Sanitize a raw search query string. Returns null if invalid or if it contains PII.
 */
export function sanitizeSearchTerm(rawQuery: string): string | null {
  if (typeof rawQuery !== 'string') return null;
  const trimmed = rawQuery.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2) return null;
  if (
    EMAIL_VALUE_REGEX.test(trimmed) ||
    PHONE_VALUE_REGEX.test(trimmed) ||
    JWT_VALUE_REGEX.test(trimmed) ||
    SECRET_VALUE_REGEX.test(trimmed)
  ) {
    return null;
  }
  return trimmed.slice(0, 64);
}

/**
 * 13. Track Storefront Search (`search`)
 * Sanitizes and truncates search term; blocks accidental PII (emails, phone numbers, tokens).
 */
export function trackSearch(rawQuery: string): boolean {
  try {
    const safeTerm = sanitizeSearchTerm(rawQuery);
    if (!safeTerm) return false;
    return trackEvent('search', {
      search_term: safeTerm,
    });
  } catch {
    return false;
  }
}

/**
 * 14. Track Anonymous/Pseudonymous Auth Events (`login`, `sign_up`)
 * Never includes email, phone, userId, or tokens.
 */
export function trackLogin(method = 'email'): boolean {
  return trackEvent('login', { method });
}

export function trackSignUp(method = 'email'): boolean {
  return trackEvent('sign_up', { method });
}

/**
 * 15. Retention & Customer Experience Events (Phase 16)
 */
export function trackViewWishlist(items: any[]): boolean {
  try {
    const ga4Items = (items || []).map((it) => toGA4Item(it));
    return trackEvent('view_wishlist', {
      currency: DEFAULT_CURRENCY,
      items: ga4Items,
    });
  } catch {
    return false;
  }
}

export function trackAddToWishlist(product: any, quantity = 1): boolean {
  try {
    if (!product) return false;
    const item = toGA4Item(product, quantity);
    return trackEvent('add_to_wishlist', {
      currency: DEFAULT_CURRENCY,
      value: roundCurrency(item.price * item.quantity),
      items: [item],
    });
  } catch {
    return false;
  }
}

export function trackRemoveFromWishlist(product: any, quantity = 1): boolean {
  try {
    if (!product) return false;
    const item = toGA4Item(product, quantity);
    return trackEvent('remove_from_wishlist', {
      currency: DEFAULT_CURRENCY,
      value: roundCurrency(item.price * item.quantity),
      items: [item],
    });
  } catch {
    return false;
  }
}

export function trackWishlistToCart(product: any, quantity = 1): boolean {
  try {
    if (!product) return false;
    const item = toGA4Item(product, quantity);
    return trackEvent('wishlist_to_cart', {
      currency: DEFAULT_CURRENCY,
      value: roundCurrency(item.price * item.quantity),
      items: [item],
    });
  } catch {
    return false;
  }
}

export function trackBeginReorder(orderId: string, itemsCount: number, value: number): boolean {
  try {
    return trackEvent('begin_reorder', {
      order_id: String(orderId || ''),
      items_count: itemsCount,
      value: roundCurrency(value),
      currency: DEFAULT_CURRENCY,
    });
  } catch {
    return false;
  }
}

export function trackSubmitReview(productId: string, rating: number, hasReviewText = false): boolean {
  try {
    return trackEvent('submit_review', {
      product_id: String(productId || ''),
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      has_review_text: Boolean(hasReviewText),
    });
  } catch {
    return false;
  }
}

export function trackBackInStockSignup(productId: string, productName?: string): boolean {
  try {
    return trackEvent('back_in_stock_signup', {
      product_id: String(productId || ''),
      product_name: String(productName || '').trim(),
    });
  } catch {
    return false;
  }
}

export function trackLoyaltyView(pointsBalance: number): boolean {
  try {
    return trackEvent('loyalty_view', {
      points_balance: Math.max(0, Math.round(pointsBalance)),
    });
  } catch {
    return false;
  }
}

export function trackReferralShare(referralCode: string, shareChannel = 'copy'): boolean {
  try {
    return trackEvent('referral_share', {
      referral_code: String(referralCode || '').trim(),
      share_channel: String(shareChannel || 'copy').trim(),
    });
  } catch {
    return false;
  }
}

/**
 * Phase 19 (Step 35): GA4 Experiment Impression & Conversion Context
 * Strictly sends experiment_id and variant_id (never email, phone, address, JWT, or payment PII).
 * Respects analytics consent gating and admin route exclusion via trackEvent().
 */
export function trackExperimentImpression(
  experimentId: string,
  variantId: string,
  extraSafeParams?: Record<string, any>
): boolean {
  try {
    const expKey = String(experimentId || '').trim();
    const varKey = String(variantId || '').trim();
    if (!expKey || !varKey) return false;
    return trackEvent('experiment_impression', {
      ...(extraSafeParams || {}),
      experiment_id: expKey,
      variant_id: varKey,
    });
  } catch {
    return false;
  }
}

export function trackExperimentConversionGA4(
  experimentId: string,
  variantId: string,
  metricName: string,
  extraSafeParams?: Record<string, any>
): boolean {
  try {
    const expKey = String(experimentId || '').trim();
    const varKey = String(variantId || '').trim();
    const metric = String(metricName || '').trim();
    if (!expKey || !varKey || !metric) return false;
    return trackEvent('experiment_conversion', {
      ...(extraSafeParams || {}),
      experiment_id: expKey,
      variant_id: varKey,
      metric_name: metric,
    });
  } catch {
    return false;
  }
}

/**
 * Test & Diagnostic Helpers (used by automated test suite and Debug mode)
 */
export function getRecordedAnalyticsEvents(): AnalyticsRecordedEvent[] {
  return [...recordedEventsBuffer];
}

export function clearRecordedAnalyticsEvents(): void {
  recordedEventsBuffer.length = 0;
  lastTrackedPagePath = null;
  lastTrackedViewItemSku = null;
  lastTrackedItemListSignature = null;
  lastTrackedCartSignature = null;
  lastTrackedBeginCheckoutSignature = null;
}

export function configureAnalyticsRuntimeForTest(options: {
  measurementId?: string;
  debug?: boolean;
  debugMode?: boolean;
  currentPath?: string;
  isAdminUser?: boolean;
  resetIdempotency?: boolean;
  purchaseClaimResolver?: PurchaseClaimResolver | null;
  refundClaimResolver?: RefundClaimResolver | null;
}): void {
  if ('measurementId' in options) {
    runtimeMeasurementIdOverride = options.measurementId;
  }
  if ('debug' in options || 'debugMode' in options) {
    runtimeDebugOverride = options.debug ?? options.debugMode;
  }
  if ('currentPath' in options) {
    runtimeCurrentPathOverride = options.currentPath;
  }
  if ('isAdminUser' in options) {
    runtimeAdminRoleOverride = options.isAdminUser;
  }
  if ('purchaseClaimResolver' in options) {
    customPurchaseClaimResolver = options.purchaseClaimResolver ?? null;
  }
  if ('refundClaimResolver' in options) {
    customRefundClaimResolver = options.refundClaimResolver ?? null;
  }
  if (options.resetIdempotency) {
    clearLocalAnalyticsIdempotencyCache();
  }
}
