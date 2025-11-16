# EAS Environment Variables Setup Guide

## 🚀 Quick Setup (Recommended)

Run the automated setup script:

```bash
./scripts/setup-eas-secrets.sh
```

This will create all required EAS secrets automatically.

## Manual Setup

If you prefer to set up secrets manually, run these commands:

### Project Info
```bash
eas secret:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER --value '642680161917'
eas secret:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID --value 'satukurirwebpush'
```

### Client Info
```bash
eas secret:create --name GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID --value '1:642680161917:android:582c8b31edf7157ece9314'
```

### API Key
```bash
eas secret:create --name GOOGLE_SERVICES_API_KEY_CURRENT_KEY --value 'AIzaSyB-qw55eFd76kkKxsVXKSTBzf-8aTZGzo8'
```

## Verify Setup
```bash
eas secret:list
```

## Test Build
```bash
eas build --profile preview --platform android
```

## Alternative: Using .env File (Local Development)

For local development, you can create a `.env.eas` file:

```env
GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER=642680161917
GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID=satukurirwebpush
GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID=1:642680161917:android:582c8b31edf7157ece9314
GOOGLE_SERVICES_API_KEY_CURRENT_KEY=AIzaSyB-qw55eFd76kkKxsVXKSTBzf-8aTZGzo8
```

Then run:
```bash
eas build --profile preview --platform android --env .env.eas
```

## Security Notes

- ✅ Firebase config files are NOT committed to git
- ✅ Sensitive keys are stored as EAS secrets
- ✅ google-services.json is generated during build time only
- ✅ No sensitive data in your repository

## Troubleshooting

If build still fails:

1. Check that all secrets are created:
   ```bash
   eas secret:list
   ```

2. Verify secret names match exactly (case-sensitive)

3. Test the script locally:
   ```bash
   # Set environment variables
   export GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER=642680161917
   export GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID=satukurirwebpush
   export GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID=1:642680161917:android:582c8b31edf7157ece9314
   export GOOGLE_SERVICES_API_KEY_CURRENT_KEY=AIzaSyB-qw55eFd76kkKxsVXKSTBzf-8aTZGzo8

   # Run the script
   ./scripts/generate-google-services.sh
   ```
