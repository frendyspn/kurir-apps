import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase config dari Console
const firebaseConfig = {
  apiKey: "AIzaSyB-qw55eFd76kkKxsVXKSTBzf-8aTZGzo8",
  authDomain: "satukurirwebpush.firebaseapp.com",
  databaseURL: "https://satukurirwebpush-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "satukurirwebpush",
  storageBucket: "satukurirwebpush.firebasestorage.app",
  messagingSenderId: "642680161917",
  appId: "1:642680161917:android:582c8b31edf7157ece9314"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('🔥 Firebase app initialized successfully');

// Initialize services
export const database = getDatabase(app);
console.log('📊 Firebase database initialized successfully');

// Lazy load messaging to avoid browser compatibility issues in Expo Go
let messagingInstance = null;
// export const getMessagingInstance = async () => {
//   if (messagingInstance) return messagingInstance;

//   try {
//     const { getMessaging } = await import('firebase/messaging');
//     messagingInstance = getMessaging(app);
//     console.log('📱 Firebase messaging initialized successfully');
//     return messagingInstance;
//   } catch (error) {
//     console.warn('⚠️ Firebase messaging not available (expected in Expo Go):', error.message);
//     return null;
//   }
// };

// For backward compatibility, export messaging as null initially
export const messaging = null;

export default app;