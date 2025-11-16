#!/bin/bash

# Script to generate google-services.json from environment variables
# This script runs during EAS Build to create the Firebase config file

echo "🔧 Generating google-services.json from environment variables..."

# Debug: Print all environment variables starting with GOOGLE_SERVICES
echo "🔍 Checking for Firebase environment variables..."
env | grep GOOGLE_SERVICES || echo "❌ No GOOGLE_SERVICES environment variables found"

# Check if required environment variables are set
MISSING_VARS=()

if [ -z "$GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER" ]; then
  MISSING_VARS+=("GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER")
fi

if [ -z "$GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID" ]; then
  MISSING_VARS+=("GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID")
fi

if [ -z "$GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID" ]; then
  MISSING_VARS+=("GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID")
fi

if [ -z "$GOOGLE_SERVICES_API_KEY_CURRENT_KEY" ]; then
  MISSING_VARS+=("GOOGLE_SERVICES_API_KEY_CURRENT_KEY")
fi

# If any variables are missing, show error and exit
if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo "❌ Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "📝 To set up EAS secrets, run these commands:"
  echo "   eas secret:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER --value 'your_project_number'"
  echo "   eas secret:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID --value 'your_project_id'"
  echo "   eas secret:create --name GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID --value 'your_mobile_sdk_app_id'"
  echo "   eas secret:create --name GOOGLE_SERVICES_API_KEY_CURRENT_KEY --value 'your_api_key'"
  echo ""
  echo "🔍 Or check existing secrets with: eas secret:list"
  exit 1
fi

# Create android/app directory if it doesn't exist
mkdir -p android/app

# Generate google-services.json
cat > android/app/google-services.json << EOF
{
  "project_info": {
    "project_number": "$GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER",
    "firebase_url": "https://$GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
    "project_id": "$GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID",
    "storage_bucket": "$GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "$GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID",
        "android_client_info": {
          "package_name": "com.kitabuatin.mitraklikquick"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "$GOOGLE_SERVICES_API_KEY_CURRENT_KEY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
EOF

echo "✅ google-services.json generated successfully"

# Verify the JSON is valid
if command -v python3 &> /dev/null; then
  if python3 -m json.tool android/app/google-services.json > /dev/null 2>&1; then
    echo "✅ google-services.json is valid JSON"
  else
    echo "❌ google-services.json contains invalid JSON"
    exit 1
  fi
fi
