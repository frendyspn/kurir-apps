import firebaseService from './firebaseService';

class SocketService {
  private listeners: Map<string, Function[]> = new Map();
  private isConnected: boolean = false;
  private currentUser: any = null;

  async connect(): Promise<any> {
    try {
      console.log('🔥 SocketService: Connecting to Firebase...');
      
      this.isConnected = true;
      console.log('✅ SocketService: Firebase connected!');
      return this;
    } catch (error) {
      console.error('❌ SocketService: Firebase connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // Set current user
  setCurrentUser(user: any) {
    this.currentUser = user;
    firebaseService.setCurrentUser(user.id);
  }

  // Listen for new orders (kurir)
  onNewOrders(callback: (orders: any[]) => void) {
    if (!this.isConnected) {
      console.warn('Firebase not connected');
      return;
    }

    // Store the callback for cleanup
    if (!this.listeners.has('newOrders')) {
      this.listeners.set('newOrders', []);
    }
    this.listeners.get('newOrders')!.push(callback);

    firebaseService.listenForNewOrders(callback);
  }

  // Listen for order status updates
  onOrderUpdate(orderId: string, callback: (order: any) => void) {
    if (!this.isConnected) {
      console.warn('Firebase not connected');
      return;
    }

    firebaseService.listenForOrderUpdates(orderId, callback);
  }

  // Create order
  async createOrder(orderData: any) {
    if (!this.isConnected) {
      throw new Error('Firebase not connected');
    }

    return firebaseService.createOrder(orderData);
  }

  // Accept order
  async acceptOrder(orderId: string, kurirData?: any) {
    if (!this.isConnected) {
      throw new Error('Firebase not connected');
    }

    const data = kurirData || this.currentUser;
    if (!data) {
      throw new Error('User data not available');
    }

    return firebaseService.acceptOrder(orderId, data);
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string, additionalData?: any) {
    if (!this.isConnected) {
      throw new Error('Firebase not connected');
    }

    return firebaseService.updateOrderStatus(orderId, status, additionalData);
  }

  // Get order by ID
  async getOrder(orderId: string) {
    if (!this.isConnected) {
      throw new Error('Firebase not connected');
    }

    return firebaseService.getOrder(orderId);
  }

  // Disconnect
  disconnect() {
    firebaseService.stopAllListeners();
    this.listeners.clear();
    this.isConnected = false;
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Event emitter methods (for compatibility)
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.listeners.has(event)) return;
    
    if (callback) {
      // Remove specific callback
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    } else {
      // Remove all callbacks for this event
      this.listeners.delete(event);
    }
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }
}

export default new SocketService();