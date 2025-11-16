#!/bin/bash

# Quick setup script for EAS Firebase secrets
# Run this script to set up all required EAS secrets for Firebase

echo "🚀 Setting up EAS Firebase secrets..."

# Firebase configuration values
PROJECT_NUMBER="642680161917"
PROJECT_ID="satukurirwebpush"
MOBILE_SDK_APP_ID="1:642680161917:android:582c8b31edf7157ece9314"
API_KEY="AIzaSyB-qw55eFd76kkKxsVXKSTBzf-8aTZGzo8"

echo "📝 Creating EAS secrets..."

# Create secrets
echo "Creating GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER..."
eas secret:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER --value "$PROJECT_NUMBER"

echo "Creating GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID..."
eas secret:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID --value "$PROJECT_ID"

echo "Creating GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID..."
eas secret:create --name GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID --value "$MOBILE_SDK_APP_ID"

echo "Creating GOOGLE_SERVICES_API_KEY_CURRENT_KEY..."
eas secret:create --name GOOGLE_SERVICES_API_KEY_CURRENT_KEY --value "$API_KEY"

echo ""
echo "✅ EAS secrets created successfully!"
echo ""
echo "🔍 Verify secrets were created:"
echo "   eas secret:list"
echo ""
echo "🚀 Test the build:"
echo "   eas build --profile preview --platform android"
