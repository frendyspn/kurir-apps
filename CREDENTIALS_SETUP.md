# 🔐 Setup Credentials untuk Laptop Baru

Panduan lengkap untuk memasang semua kredensial yang diperlukan setelah clone project baru.

---

## 1️⃣ Firebase Service Account (untuk generate-token.js)

### Langkah-langkah:

1. **Buka Firebase Console:**
   - Masuk ke [console.firebase.google.com](https://console.firebase.google.com)
   - Pilih project: **satukurirwebpush**

2. **Download Service Account Key:**
   - Klik **⚙️ Project Settings** (kanan atas)
   - Pilih tab **Service Accounts**
   - Klik **Generate New Private Key**
   - File `xxx-firebase-adminsdk-xxx.json` akan didownload

3. **Simpan di project root:**
   ```powershell
   # Windows PowerShell
   Copy-Item "C:\Users\YourUsername\Downloads\satukurirwebpush-firebase-adminsdk-xxx.json" `
             -Destination "C:\xampp\htdocs\mobile\kurir-apps\service-account.json"
   ```
   
   atau copy manual:
   - Buka file downloaded
   - Copy ke `C:\xampp\htdocs\mobile\kurir-apps\service-account.json`

4. **Verifikasi:**
   ```powershell
   # Pastikan file ada dan readable
   Get-Content "C:\xampp\htdocs\mobile\kurir-apps\service-account.json" | Select-Object -First 5
   ```

   ✅ Seharusnya ada fields: `type`, `project_id`, `private_key_id`, `private_key`, `client_email`

---

## 2️⃣ EAS Secrets (untuk EAS Build)

### Prasyarat:
- Sudah install [EAS CLI](https://docs.expo.dev/eas-cli/): 
  ```powershell
  npm install --global eas-cli
  ```
- Sudah login ke EAS: 
  ```powershell
  eas login
  ```

### Langkah-langkah:

1. **Dari Firebase Console, catat nilai ini:**
   - Masuk ke **Project Settings** > **General**
   - Catat:
     - **Project Number** (besar di atas)
     - **Project ID** (contoh: `satukurirwebpush`)
     - **Web API Key** (di bawah atau dari Cloud API)

2. **Dari android app di Firebase, catat:**
   - Buka **Project Settings** > **Your apps** > Android app
   - Catat **Mobile SDK App ID** (format: `1:642680161917:android:xxx`)
   - Catat **Current API Key** (dari `google-services.json` yang ada)

3. **Buat EAS Secrets (jalankan di terminal project):**
   ```bash
   # 1. Project Number
   eas env:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER --value "642680161917"
   
   # 2. Project ID
   eas env:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID --value "satukurirwebpush"
   
   # 3. Mobile SDK App ID
   eas env:create --name GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID --value "1:642680161917:android:582c8b31edf7157ece9314"
   
   # 4. API Key
   eas env:create --name GOOGLE_SERVICES_API_KEY_CURRENT_KEY --value "AIzaSyB-qw55eFd76kkKxsVXKSTBzf-8aTZGzo8"
   ```

4. **Verifikasi secrets sudah tersimpan:**
   ```bash
   eas env:list
   ```

   ✅ Seharusnya muncul 4 secrets di atas

---

## 3️⃣ Google Services JSON untuk Android Local Build (Opsional)

### Jika ingin build Android lokal tanpa EAS:

1. **Copy file yang sudah ada:**
   ```powershell
   New-Item -ItemType Directory -Path "android\app" -Force
   Copy-Item "assets\google-services.json" -Destination "android\app\google-services.json"
   ```

2. **Verifikasi:**
   ```powershell
   Test-Path "android\app\google-services.json"
   ```

---

## 4️⃣ Install Dependencies

Pastikan semua package sudah terinstall:

```powershell
npm install
```

---

## ✅ Checklist Verifikasi

- [ ] `service-account.json` ada di root project (untuk `generate-token.js`)
- [ ] `assets/google-services.json` sudah ada (ada di repo)
- [ ] `GoogleService-Info.plist` sudah ada (untuk iOS, ada di repo)
- [ ] 4 EAS secrets sudah dibuat (`eas env:list` menampilkan mereka)
- [ ] `npm install` selesai tanpa error

---

## 🤔 Troubleshooting

### Error: "service-account.json not found"
→ Pastikan file ada di root project (bukan di subfolder)

### Error: "EAS secrets not found" saat build
→ Jalankan:
```bash
eas env:list
```
Jika kosong, jalankan langkah 2️⃣ di atas

### Error: "google-services.json not found" saat build Android
→ Untuk local build, copy dari `assets/` ke `android/app/`
→ Untuk EAS build, secrets harus sudah dibuat (langkah 2️⃣)

### Masih ada error?
→ Baca [EAS_SETUP_GUIDE.md](EAS_SETUP_GUIDE.md) dan [FIREBASE_NOTIFICATIONS_README.md](FIREBASE_NOTIFICATIONS_README.md)

---

## 📌 Catatan Penting

- **⚠️ JANGAN COMMIT `service-account.json`** — sudah di `.gitignore`
- `.env` files juga di-ignore — untuk local secrets, gunakan cara lain
- Credentials sudah di-embed dalam Firebase config (aman untuk public repo)
- EAS secrets tersimpan aman di Expo servers, bukan di repo

---

**Last updated:** 2026-04-07
