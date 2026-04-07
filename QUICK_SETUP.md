# ⚡ Quick Setup Checklist

Ikuti checklist ini untuk setup credentials dengan cepat. Waktu estimasi: **5-10 menit**

---

## STEP 1: Service Account (2 menit)

```powershell
# Download dari: https://console.firebase.google.com
# Project: satukurirwebpush → Project Settings → Service Accounts → Generate Key

# Copy ke project root (Windows PowerShell):
Copy-Item "C:\Users\YourUsername\Downloads\satukurirwebpush-firebase-adminsdk-*.json" `
         -Destination "C:\xampp\htdocs\mobile\kurir-apps\service-account.json"

# Verifikasi:
Get-Content "C:\xampp\htdocs\mobile\kurir-apps\service-account.json" | Select-Object -First 10
```

✅ **Status:** ☐ Selesai

---

## STEP 2: EAS Secrets (3 menit)

```bash
# Pastikan sudah login:
eas login

# Dari Firebase, catat nilai-nilai ini:
# - Project Number: 642680161917
# - Project ID: satukurirwebpush  
# - Mobile SDK App ID: 1:642680161917:android:582c8b31edf7157ece9314
# - API Key: AIzaSyB-qw55eFd76kkKxsVXKSTBzf-8aTZGzo8

# Buat 4 secrets:
eas env:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER --value "642680161917"
eas env:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID --value "satukurirwebpush"
eas env:create --name GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID --value "1:642680161917:android:582c8b31edf7157ece9314"
eas env:create --name GOOGLE_SERVICES_API_KEY_CURRENT_KEY --value "AIzaSyB-qw55eFd76kkKxsVXKSTBzf-8aTZGzo8"

# Verifikasi:
eas env:list
```

✅ **Status:** ☐ Selesai (semua 4 secrets muncul)

---

## STEP 3: Android Local Build (1 menit, opsional)

```powershell
# Jika ingin build lokal di Windows:
New-Item -ItemType Directory -Path "android\app" -Force
Copy-Item "assets\google-services.json" -Destination "android\app\google-services.json"
```

✅ **Status:** ☐ Selesai

---

## STEP 4: Install Dependencies (2 menit)

```bash
npm install
```

✅ **Status:** ☐ Selesai

---

## 🎯 Final Verification

```bash
# Test untuk cek semua OK:
npm run lint
```

✅ **Status:** ☐ Selesai — App siap untuk dev/build!

---

## 📚 Bantuan Lengkap

Lihat [CREDENTIALS_SETUP.md](CREDENTIALS_SETUP.md) untuk penjelasan detail dan troubleshooting.
