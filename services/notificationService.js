import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.onNotificationListeners = [];
    this.onTokenRefreshListeners = [];
    this.navigationHandler = null;
  }

  // Set navigation handler (call this from React component)
  setNavigationHandler(handler) {
    this.navigationHandler = handler;
  }

  // Request permission for push notifications
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Push notification permission granted');
        return true;
      } else {
        console.log('❌ Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  // Get FCM token
  async getFCMToken() {
    try {
      const fcmToken = await messaging().getToken();
      console.log('📱 FCM Token:', fcmToken);

      // Store token locally
      await AsyncStorage.setItem('fcmToken', fcmToken);

      return fcmToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Register device token to backend
  async registerDeviceToken(userId, token) {
    try {
      // TODO: Send token to your backend API
      // await apiService.registerDeviceToken(userId, token, Platform.OS);

      console.log('📤 Device token registered:', { userId, token, platform: Platform.OS });
      return true;
    } catch (error) {
      console.error('Error registering device token:', error);
      return false;
    }
  }

  // Setup notification listeners
  setupNotificationListeners() {
    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('📨 Foreground message received:', remoteMessage);

      this.onNotificationListeners.forEach(callback => {
        callback(remoteMessage);
      });
    });

    // Handle background messages (when app is in background)
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📨 Background message received:', remoteMessage);
      return Promise.resolve();
    });

    // Handle token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (fcmToken) => {
      console.log('🔄 FCM Token refreshed:', fcmToken);

      // Store new token
      await AsyncStorage.setItem('fcmToken', fcmToken);

      // Notify listeners
      this.onTokenRefreshListeners.forEach(callback => {
        callback(fcmToken);
      });

      // Re-register with backend if user is logged in
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        await this.registerDeviceToken(user.id, fcmToken);
      }
    });

    return {
      unsubscribeForeground,
      unsubscribeTokenRefresh
    };
  }

  // Handle notification opened from background/quit state
  async handleInitialNotification() {
    const initialNotification = await messaging().getInitialNotification();

    if (initialNotification) {
      console.log('🚀 App opened from notification:', initialNotification);

      // Handle navigation based on notification data
      this.handleNotificationNavigation(initialNotification);
    }
  }

  // Handle notification tap
  setupNotificationOpenedListener() {
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 Notification opened from background:', remoteMessage);

      this.handleNotificationNavigation(remoteMessage);
    });

    return unsubscribe;
  }

  // Handle navigation based on notification data
  handleNotificationNavigation(remoteMessage) {
    if (this.navigationHandler) {
      this.navigationHandler(remoteMessage);
    } else {
      console.warn('Navigation handler not set. Call setNavigationHandler() first.');
    }
  }

  // Add notification listener
  addNotificationListener(callback) {
    this.onNotificationListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.onNotificationListeners.indexOf(callback);
      if (index > -1) {
        this.onNotificationListeners.splice(index, 1);
      }
    };
  }

  // Add token refresh listener
  addTokenRefreshListener(callback) {
    this.onTokenRefreshListeners.push(callback);

    return () => {
      const index = this.onTokenRefreshListeners.indexOf(callback);
      if (index > -1) {
        this.onTokenRefreshListeners.splice(index, 1);
      }
    };
  }

  // Initialize notifications (call this in App.js or root component)
  async initialize() {
    try {
      // Request permission
      const permissionGranted = await this.requestPermission();

      if (permissionGranted) {
        // Get FCM token
        const token = await this.getFCMToken();

        // Setup listeners
        const listeners = this.setupNotificationListeners();
        const notificationOpenedListener = this.setupNotificationOpenedListener();

        // Handle initial notification (app opened from notification)
        await this.handleInitialNotification();

        return {
          token,
          listeners: {
            ...listeners,
            notificationOpened: notificationOpenedListener
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  // Cleanup (call this when app unmounts)
  cleanup(listeners) {
    if (listeners) {
      if (listeners.unsubscribeForeground) {
        listeners.unsubscribeForeground();
      }
      if (listeners.unsubscribeTokenRefresh) {
        listeners.unsubscribeTokenRefresh();
      }
      if (listeners.notificationOpened) {
        listeners.notificationOpened();
      }
    }

    this.onNotificationListeners = [];
    this.onTokenRefreshListeners = [];
  }

  // Send test notification (for development)
  async sendTestNotification(title, body, data = {}) {
    // This would typically be done from your backend
    // For testing, you can use Firebase Console or REST API

    console.log('🧪 Test notification:', { title, body, data });
  }
}

const notificationService = new NotificationService();

export { notificationService };
export default notificationService;
