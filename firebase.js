import { initializeApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

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

// Initialize messaging
console.log('📱 Firebase messaging initialized successfully');

export { messaging };
export default app;