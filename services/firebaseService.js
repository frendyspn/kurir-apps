import { off, onValue, push, ref, set, update } from 'firebase/database';
import { database, getMessagingInstance } from '../firebase';

// ... existing firebase config ...

class FirebaseService {
  constructor() {
    this.listeners = new Map();
    this.currentUserOrders = new Map(); // Track orders accepted by current user
  }

  // Setup push notifications
  async setupPushNotifications() {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.warn('Messaging not available (Expo Go limitation)');
        return null;
      }

      // Request permission
      const authStatus = await messaging.requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // Get FCM token
        const fcmToken = await messaging.getToken();
        console.log('FCM Token:', fcmToken);
        return fcmToken;
      }
    } catch (error) {
      console.warn('Error setting up push notifications:', error);
      // Don't throw error for push notifications
    }
  }

  // Listen for new orders (kurir)
  listenForNewOrders(callback) {
    console.log('🔥 FirebaseService: Setting up new orders listener...');
    
    const ordersRef = ref(database, 'orders');
    
    const listener = onValue(ordersRef, (snapshot) => {
      console.log('🔥 FirebaseService: Orders snapshot received, exists:', snapshot.exists());
      
      const orders = [];
      snapshot.forEach((childSnapshot) => {
        const order = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
          time_remaining: this.calculateTimeRemaining(childSnapshot.val().created_at)
        };
        orders.push(order);
      });
      
      console.log('🔥 FirebaseService: Raw orders from Firebase:', orders.length);
      
      // Filter orders yang masih SEARCH dan belum expired
      const availableOrders = orders.filter(order => 
        order.status === 'SEARCH' && 
        order.time_remaining > 0 &&
        !this.currentUserOrders.has(order.id) // Exclude orders accepted by current user
      );
      
      console.log('🔥 FirebaseService: Filtered available orders:', availableOrders.length);
      console.log('🔥 FirebaseService: Available orders data:', availableOrders);
      
      callback(availableOrders);
    });

    this.listeners.set('newOrders', listener);
    console.log('🔥 FirebaseService: Listener registered successfully');
    return listener;
  }

  // Listen for order updates (for accepted orders)
  listenForOrderUpdates(orderId, callback) {
    const orderRef = ref(database, `orders/${orderId}`);
    
    const listener = onValue(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const order = {
          id: snapshot.key,
          ...snapshot.val(),
          time_remaining: this.calculateTimeRemaining(snapshot.val().created_at)
        };
        callback(order);
      }
    });

    this.listeners.set(`order_${orderId}`, listener);
    return listener;
  }

  // Calculate remaining time (5 minutes from creation)
  calculateTimeRemaining(createdAt) {
    if (!createdAt) return 0;
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const remainingSeconds = Math.max(0, 300 - Math.floor(diffMs / 1000)); // 5 minutes = 300 seconds
    
    return remainingSeconds;
  }

  // Create new order (agen)
  async createOrder(orderData) {
    try {
      const ordersRef = ref(database, 'orders');
      const newOrderRef = push(ordersRef);
      
      const order = {
        ...orderData,
        id: newOrderRef.key,
        status: 'SEARCH',
        created_at: new Date().toISOString(),
        time_remaining: 300, // 5 minutes
      };

      await set(newOrderRef, order);
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Accept order (kurir)
  async acceptOrder(orderId, kurirData) {
    try {
      // Check if order is still available
      const orderRef = ref(database, `orders/${orderId}`);
      const snapshot = await new Promise((resolve) => {
        onValue(orderRef, (snap) => resolve(snap), { onlyOnce: true });
      });

      if (!snapshot.exists()) {
        throw new Error('Order tidak ditemukan');
      }

      const order = snapshot.val();
      if (order.status !== 'SEARCH') {
        throw new Error('Order sudah diambil kurir lain');
      }

      // Update order status
      await update(orderRef, {
        status: 'PROCESS',
        id_kurir: kurirData.id,
        kurir_name: kurirData.name,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Track this order as accepted by current user
      this.currentUserOrders.set(orderId, true);

      return { ...order, id: orderId, status: 'PROCESS' };
    } catch (error) {
      console.error('Error accepting order:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, additionalData = {}) {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      await update(orderRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrder(orderId) {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      const snapshot = await new Promise((resolve) => {
        onValue(orderRef, (snap) => resolve(snap), { onlyOnce: true });
      });

      if (snapshot.exists()) {
        return {
          id: snapshot.key,
          ...snapshot.val()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  // Stop listening
  stopListening(listenerKey) {
    if (this.listeners.has(listenerKey)) {
      off(this.listeners.get(listenerKey));
      this.listeners.delete(listenerKey);
    }
  }

  // Stop all listeners
  stopAllListeners() {
    this.listeners.forEach((listener) => {
      off(listener);
    });
    this.listeners.clear();
    this.currentUserOrders.clear();
  }

  // Set current user for tracking accepted orders
  setCurrentUser(userId) {
    this.currentUserId = userId;
  }

  // Listen for push notifications
  async listenForPushNotifications(callback) {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn('Push notifications not available in Expo Go');
      return () => {}; // Return empty unsubscribe function
    }

    // Foreground messages
    const unsubscribe = messaging.onMessage(async (remoteMessage) => {
      callback(remoteMessage);
    });

    // Background messages (handled by system)
    messaging.setBackgroundMessageHandler(async (remoteMessage) => {
      callback(remoteMessage);
    });

    return unsubscribe;
  }
}

const firebaseService = new FirebaseService();

export { firebaseService };
export default firebaseService;