import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'mitra-klikquick://',
    'https://satu-kurir.vercel.app',
    'https://kurir-apps.vercel.app',
    'https://mitra.klikquick.id/app'
  ],
  config: {
    screens: {
      // Main screens
      index: '',
      '(tabs)': {
        screens: {
          index: 'home',
          history: 'history',
          kontak: 'contacts',
          saldo: 'balance',
          transaksi: 'transactions',
        },
      },

      // Auth screens
      'auth/login': 'login',
      'auth/logout': 'logout',
      'auth/otp': 'otp',
      'auth/register': 'register',

      // Transaction screens
      'transaksi-manual': {
        screens: {
          index: 'manual-transactions',
          tambah: 'add-manual-transaction',
          detail: ':id',
        },
      },

      // Live order screens
      'live-order': {
        screens: {
          index: 'live-orders',
          tambah: 'add-live-order',
          detail: ':id',
        },
      },

      // Contact screens
      'kontak': {
        screens: {
          index: 'contacts',
          detail: ':id',
          edit: 'edit/:id',
          tambah: 'add-contact',
        },
      },

      // Account/Profile screens
      'akun': {
        screens: {
          index: 'account',
          'edit-profile-modal': 'edit-profile',
          'edit-profile-photo-modal': 'edit-profile-photo',
          'edit-kendaraan-modal': 'edit-vehicle',
          'profile-modal': 'profile',
          'kendaraan-modal': 'vehicle',
        },
      },

      // Balance screens
      'saldo': {
        screens: {
          index: 'balance',
          'top-up': 'top-up',
          'confirm-top-up': ':id',
          withdraw: 'withdraw',
          transfer: 'transfer',
        },
      },

      // Order screens
      'order': {
        screens: {
          index: 'orders',
          detail: ':id',
          tambah: 'add-order',
        },
      },

      // Profile screens
      'profile': {
        screens: {
          index: 'profile',
          profile: 'user-profile',
        },
      },

      // Modal screens
      modal: 'modal',
    },
  },
};

export default linking;
