import * as Linking from 'expo-linking';

/**
 * Deep Link Utilities for Mitra KlikQuick App
 *
 * This file contains utilities for generating and handling deep links
 * in the Mitra KlikQuick application.
 */

// Base URLs for different platforms
const SCHEME_URL = 'mitra-klikquick://';
const WEB_URL = 'https://satu-kurir.vercel.app';

/**
 * Generate a deep link URL for a specific screen
 */
export function generateDeepLink(path: string, params?: Record<string, string>): string {
  const baseUrl = Linking.createURL(path);

  if (params) {
    const searchParams = new URLSearchParams(params);
    return `${SCHEME_URL}${path}?${searchParams.toString()}`;
  }

  return `${SCHEME_URL}${path}`;
}

/**
 * Generate a universal link (web URL) for a specific screen
 */
export function generateUniversalLink(path: string, params?: Record<string, string>): string {
  if (params) {
    const searchParams = new URLSearchParams(params);
    return `${WEB_URL}${path}?${searchParams.toString()}`;
  }

  return `${WEB_URL}${path}`;
}

/**
 * Open a deep link
 */
export async function openDeepLink(url: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn('Cannot open URL:', url);
    }
  } catch (error) {
    console.error('Error opening deep link:', error);
  }
}

/**
 * Predefined deep link generators for common screens
 */
export const DeepLinks = {
  // Auth
  login: () => generateDeepLink('/login'),
  register: () => generateDeepLink('/register'),
  otp: (phone?: string) => generateDeepLink('/otp', phone ? { phone } : undefined),

  // Main screens
  home: () => generateDeepLink('/home'),
  contacts: () => generateDeepLink('/contacts'),
  balance: () => generateDeepLink('/balance'),
  transactions: () => generateDeepLink('/transactions'),

  // Transaction screens
  manualTransactions: () => generateDeepLink('/manual-transactions'),
  addManualTransaction: () => generateDeepLink('/add-manual-transaction'),
  manualTransactionDetail: (id: string) => generateDeepLink('/manual-transaction', { id }),

  // Live order screens
  liveOrders: () => generateDeepLink('/live-orders'),
  addLiveOrder: () => generateDeepLink('/add-live-order'),
  liveOrderDetail: (id: string) => generateDeepLink('/live-order', { id }),

  // Contact screens
  addContact: () => generateDeepLink('/add-contact'),
  contactDetail: (id: string) => generateDeepLink('/contact', { id }),
  editContact: (id: string) => generateDeepLink('/edit-contact', { id }),

  // Balance screens
  topUp: () => generateDeepLink('/top-up'),
  confirmTopUp: (id: string) => generateDeepLink('/confirm-top-up', { id }),
  withdraw: () => generateDeepLink('/withdraw'),
  transfer: () => generateDeepLink('/transfer'),

  // Account screens
  account: () => generateDeepLink('/account'),
  profile: () => generateDeepLink('/profile'),
  editProfile: () => generateDeepLink('/edit-profile'),
  editVehicle: () => generateDeepLink('/edit-vehicle'),
};

/**
 * Universal link generators (for web sharing)
 */
export const UniversalLinks = {
  // Auth
  login: () => generateUniversalLink('/login'),
  register: () => generateUniversalLink('/register'),

  // Main screens
  home: () => generateUniversalLink('/home'),
  contacts: () => generateUniversalLink('/contacts'),
  balance: () => generateUniversalLink('/balance'),

  // Transaction screens
  manualTransactions: () => generateUniversalLink('/manual-transactions'),
  addManualTransaction: () => generateUniversalLink('/add-manual-transaction'),

  // Contact screens
  addContact: () => generateUniversalLink('/add-contact'),
  contactDetail: (id: string) => generateUniversalLink('/contact', { id }),
};

/**
 * Examples of how to use deep links:
 *
 * // Generate a deep link to contact detail
 * const contactLink = DeepLinks.contactDetail('123');
 * // Result: "mitra-klikquick://contact?id=123"
 *
 * // Open a deep link
 * await openDeepLink(contactLink);
 *
 * // Generate universal link for sharing
 * const shareLink = UniversalLinks.contactDetail('123');
 * // Result: "https://satu-kurir.vercel.app/contact?id=123"
 *
 * // Handle deep links in your app using the useDeepLinkHandler hook
 * // The hook automatically handles navigation when deep links are opened
 */
