# Firebase Push Notifications Setup

Panduan lengkap untuk mengimplementasikan push notifications menggunakan Firebase Cloud Messaging (FCM) di aplikasi Expo React Native.

## 📋 Prerequisites

1. **Firebase Project**: Pastikan Anda memiliki Firebase project yang sudah dikonfigurasi
2. **Development Build**: Push notifications hanya berfungsi di development build atau EAS Build, bukan Expo Go
3. **Physical Device**: Testing harus dilakukan di device fisik, bukan emulator

## 🔧 Konfigurasi yang Sudah Dilakukan

### 1. Dependencies Terinstall
```json
{
  "@react-native-firebase/app": "^18.7.3",
  "@react-native-firebase/messaging": "^18.7.3",
  "@react-native-async-storage/async-storage": "^1.21.0"
}
```

### 2. File Konfigurasi
- ✅ `android/app/google-services.json` - Konfigurasi Firebase Android
- ✅ `GoogleService-Info.plist` - Konfigurasi Firebase iOS
- ✅ `app.json` - Plugin Firebase dan konfigurasi native

### 3. Services & Hooks
- ✅ `services/notificationService.js` - Service utama untuk handle notifications
- ✅ `hooks/use-notification-navigation.ts` - Hook untuk navigation berdasarkan notification
- ✅ `app/_layout.tsx` - Integrasi notification di root layout

## 🚀 Cara Testing

### 1. Build Development App
```bash
# Untuk Android
npx expo run:android

# Untuk iOS
npx expo run:ios
```

### 2. Build dengan EAS
```bash
# Development build
eas build --platform android --profile development
eas build --platform ios --profile development

# Install build
eas build:run --platform android
eas build:run --platform ios
```

### 3. Test Notifications

#### Menggunakan Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com)
2. Pilih project `satukurirwebpush`
3. Go to Cloud Messaging
4. Create new notification
5. Target: `Token` dan paste FCM token dari device
6. Custom data:
   ```json
   {
     "type": "new_order",
     "order_id": "12345",
     "title": "Order Baru!",
     "body": "Ada order baru untuk Anda"
   }
   ```

#### Menggunakan cURL (untuk testing)
```bash
curl -X POST \
  https://fcm.googleapis.com/fcm/send \
  -H 'Authorization: key=YOUR_SERVER_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "YOUR_FCM_TOKEN",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test push notification"
    },
    "data": {
      "type": "test",
      "custom_data": "value"
    }
  }'
```

## 📱 Notification Types

Aplikasi mendukung berbagai jenis notification:

| Type | Navigation | Description |
|------|------------|-------------|
| `new_order` | `/live-order/detail?id={order_id}` | Order baru tersedia |
| `order_assigned` | `/live-order/detail?id={order_id}` | Order diassign ke driver |
| `order_completed` | `/transaksi-manual/detail?id={transaction_id}` | Order selesai |
| `payment_received` | `/saldo` | Pembayaran diterima |
| `contact_request` | `/kontak/detail?id={contact_id}` | Permintaan kontak baru |
| `system_notification` | `/` | Notifikasi sistem |

## 🔧 Troubleshooting

### Permission Denied
```javascript
// Check permission status
import messaging from '@react-native-firebase/messaging';

const authStatus = await messaging().requestPermission();
console.log('Authorization status:', authStatus);
```

### FCM Token Issues
```javascript
// Get token manually
const token = await notificationService.getFCMToken();
console.log('FCM Token:', token);
```

### Background Messages Not Working
- Pastikan app tidak dalam "Force Quit" state
- Background message handler harus di-setup di root level
- Test dengan app dalam background (tidak terminated)

### iOS Specific Issues
- Pastikan `GoogleService-Info.plist` di root project
- Check iOS capabilities di Xcode (Push Notifications enabled)
- Untuk development, gunakan development APNs certificate

## 📊 Monitoring & Analytics

### Firebase Console
- **Cloud Messaging**: Lihat delivery rate dan engagement
- **Crashlytics**: Monitor crashes related to notifications
- **Analytics**: Track notification opens dan user engagement

### Custom Logging
Service sudah include logging untuk:
- Permission requests
- Token generation/refresh
- Message received (foreground/background)
- Navigation actions

## 🔒 Security Considerations

1. **Token Storage**: FCM tokens disimpan di AsyncStorage (encrypted)
2. **Backend Registration**: Tokens dikirim ke backend untuk targeting
3. **Permission Handling**: Graceful fallback jika permission denied
4. **Data Validation**: Validate notification data sebelum navigation

## 🚀 Production Deployment

### EAS Build Configuration
Tambahkan ke `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "bundleIdentifier": "com.kitabuatin.mitraklikquick"
      }
    }
  }
}
```

### Backend Integration
Implementasi API endpoint untuk:
- Register device token
- Send targeted notifications
- Handle token refresh
- Clean up invalid tokens

## 📚 Additional Resources

- [React Native Firebase Docs](https://rnfirebase.io/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications vs FCM](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

## 🆘 Support

Jika mengalami masalah:
1. Check device logs dengan `npx expo run:android --device`
2. Verify Firebase configuration files
3. Test dengan Firebase Console dulu
4. Check network connectivity
5. Ensure app permissions granted
