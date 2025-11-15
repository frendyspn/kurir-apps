# Deep Linking Guide - Mitra KlikQuick

Deep linking memungkinkan pengguna untuk membuka layar tertentu dalam aplikasi melalui URL. Aplikasi Mitra KlikQuick mendukung deep linking melalui custom URL scheme dan universal links.

## Setup yang Telah Dilakukan

### 1. Konfigurasi app.json
```json
{
  "expo": {
    "scheme": "mitra-klikquick",
    "ios": {
      "bundleIdentifier": "com.kitabuatin.mitraklikquick"
    },
    "android": {
      "package": "com.kitabuatin.mitraklikquick"
    }
  }
}
```

### 2. Hook untuk Menangani Deep Links
Hook `useDeepLinkHandler` secara otomatis menangani deep links yang masuk ke aplikasi.

### 3. Utility Functions
File `utils/deep-links.ts` berisi fungsi-fungsi untuk menghasilkan deep links.

## Cara Menggunakan Deep Links

### 1. Generate Deep Link

```typescript
import { DeepLinks, UniversalLinks, openDeepLink } from '@/utils/deep-links';

// Generate deep link untuk detail kontak
const contactLink = DeepLinks.contactDetail('123');
// Result: "mitra-klikquick://contact?id=123"

// Generate universal link untuk sharing
const shareLink = UniversalLinks.contactDetail('123');
// Result: "https://satu-kurir.vercel.app/contact?id=123"

// Buka deep link
await openDeepLink(contactLink);
```

### 2. Deep Links yang Tersedia

#### Authentication
- `DeepLinks.login()` → `mitra-klikquick://login`
- `DeepLinks.register()` → `mitra-klikquick://register`
- `DeepLinks.otp(phone?)` → `mitra-klikquick://otp?phone=08123456789`

#### Main Screens
- `DeepLinks.home()` → `mitra-klikquick://home`
- `DeepLinks.contacts()` → `mitra-klikquick://contacts`
- `DeepLinks.balance()` → `mitra-klikquick://balance`
- `DeepLinks.transactions()` → `mitra-klikquick://transactions`

#### Transactions
- `DeepLinks.manualTransactions()` → `mitra-klikquick://manual-transactions`
- `DeepLinks.addManualTransaction()` → `mitra-klikquick://add-manual-transaction`
- `DeepLinks.manualTransactionDetail(id)` → `mitra-klikquick://manual-transaction?id=123`

#### Live Orders
- `DeepLinks.liveOrders()` → `mitra-klikquick://live-orders`
- `DeepLinks.addLiveOrder()` → `mitra-klikquick://add-live-order`
- `DeepLinks.liveOrderDetail(id)` → `mitra-klikquick://live-order?id=123`

#### Contacts
- `DeepLinks.addContact()` → `mitra-klikquick://add-contact`
- `DeepLinks.contactDetail(id)` → `mitra-klikquick://contact?id=123`
- `DeepLinks.editContact(id)` → `mitra-klikquick://edit-contact?id=123`

#### Balance
- `DeepLinks.topUp()` → `mitra-klikquick://top-up`
- `DeepLinks.confirmTopUp(id)` → `mitra-klikquick://confirm-top-up?id=123`
- `DeepLinks.withdraw()` → `mitra-klikquick://withdraw`
- `DeepLinks.transfer()` → `mitra-klikquick://transfer`

## Testing Deep Links

### iOS Simulator
```bash
# Buka deep link di iOS Simulator
xcrun simctl openurl booted "mitra-klikquick://contacts"
```

### Android Emulator
```bash
# Buka deep link di Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "mitra-klikquick://contacts" com.kitabuatin.mitraklikquick
```

### Physical Device
1. **iOS**: Buka Safari dan ketik URL deep link
2. **Android**: Buka browser dan ketik URL deep link, atau gunakan ADB

## Universal Links (iOS) & App Links (Android)

Untuk universal links, Anda perlu mengkonfigurasi server web Anda untuk melayani file `apple-app-site-association` (iOS) dan `assetlinks.json` (Android).

### Contoh apple-app-site-association
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "com.kitabuatin.mitraklikquick",
        "paths": [
          "/home",
          "/contacts",
          "/balance",
          "/contact/*",
          "/manual-transaction/*"
        ]
      }
    ]
  }
}
```

### Contoh assetlinks.json
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.kitabuatin.mitraklikquick",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

## Contoh Penggunaan dalam Kode

### Membagikan Link Kontak
```typescript
import { UniversalLinks, openDeepLink } from '@/utils/deep-links';

const shareContact = (contactId: string, contactName: string) => {
  const link = UniversalLinks.contactDetail(contactId);

  // Share via WhatsApp, email, etc.
  const message = `Lihat detail kontak ${contactName}: ${link}`;
  // ... share logic
};
```

### Menangani Deep Link Custom
```typescript
import { useDeepLinkHandler } from '@/hooks/use-deep-link';

// Hook ini otomatis menangani deep links
// Tidak perlu konfigurasi tambahan
```

### Menambah Deep Link Baru
1. Tambahkan route di `constants/linking.ts`
2. Tambahkan generator di `utils/deep-links.ts`
3. Update handler di `hooks/use-deep-link.ts` jika diperlukan

## Troubleshooting

### Deep Link Tidak Bekerja
1. Pastikan scheme sudah benar di `app.json`
2. Cek log di console untuk error handling
3. Test dengan URL lengkap: `mitra-klikquick://contacts`

### Universal Links Tidak Bekerja
1. Pastikan file `apple-app-site-association` dan `assetlinks.json` sudah di-upload
2. Verifikasi domain dan path sudah benar
3. Test dengan URL web: `https://satu-kurir.vercel.app/contacts`

### Error "Cannot open URL"
1. Pastikan aplikasi sudah di-install di device
2. Cek apakah scheme sudah terdaftar dengan benar
3. Untuk iOS, pastikan bundle identifier sudah benar
