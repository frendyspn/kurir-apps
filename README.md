# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Firebase Setup for EAS Build

This project uses Firebase for push notifications. To set up Firebase configuration for EAS Build:

1. **Get your Firebase project configuration:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > General > Your apps
   - Find your Android app and note down the values

2. **Set up EAS secrets:**
   ```bash
   # Set the required environment variables for Firebase
   eas secret:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_NUMBER --value 'your_project_number'
   eas secret:create --name GOOGLE_SERVICES_PROJECT_INFO_PROJECT_ID --value 'your_project_id'
   eas secret:create --name GOOGLE_SERVICES_CLIENT_INFO_MOBILE_SDK_APP_ID --value 'your_mobile_sdk_app_id'
   eas secret:create --name GOOGLE_SERVICES_API_KEY_CURRENT_KEY --value 'your_api_key'
   ```

3. **Build the app:**
   ```bash
   eas build --platform android --profile production
   ```

The `scripts/generate-google-services.sh` script will automatically generate the `google-services.json` file during the build process using these environment variables.
