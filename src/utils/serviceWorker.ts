// Service Worker Registration Utility
// Handles service worker installation, updates, and communication

interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', this.registration);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  private handleServiceWorkerMessage(message: ServiceWorkerMessage) {
    switch (message.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', message.payload);
        break;
      case 'SYNC_COMPLETED':
        console.log('Background sync completed');
        break;
      case 'SYNC_FAILED':
        console.error('Background sync failed:', message.payload);
        break;
      default:
        console.log('Unknown service worker message:', message);
    }
  }

  private notifyUpdateAvailable() {
    // You can implement a custom update notification here
    // For now, we'll just log it
    console.log('Service Worker update available');
    
    // Example: Show a notification to the user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FinanceApp Update Available', {
        body: 'A new version is available. Click to update.',
        icon: '/favicon.ico',
      });
    }
  }

  async update(): Promise<void> {
    if (this.registration && this.updateAvailable) {
      await this.registration.update();
    }
  }

  async skipWaiting(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      return await this.registration.unregister();
    }
    return false;
  }

  async getCacheNames(): Promise<string[]> {
    if (!('caches' in window)) {
      return [];
    }
    return await caches.keys();
  }

  async clearAllCaches(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }
    
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }

  async clearCache(cacheName: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }
    return await caches.delete(cacheName);
  }

  async getCacheSize(cacheName: string): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }
    
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    return keys.length;
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  async sendMessageToServiceWorker(message: ServiceWorkerMessage): Promise<void> {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage(message);
    }
  }

  async triggerBackgroundSync(tag: string): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in window)) {
      return;
    }

    try {
      await navigator.serviceWorker.ready;
      await (navigator.serviceWorker as any).sync.register(tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  addOnlineListener(callback: () => void): void {
    window.addEventListener('online', callback);
  }

  addOfflineListener(callback: () => void): void {
    window.addEventListener('offline', callback);
  }

  removeOnlineListener(callback: () => void): void {
    window.removeEventListener('online', callback);
  }

  removeOfflineListener(callback: () => void): void {
    window.removeEventListener('offline', callback);
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

/**
 * Register service worker with development mode handling
 * Prevents cache issues during development by disabling SW in dev mode
 */
export const registerServiceWorker = async () => {
  // Disable service worker in development mode to prevent cache issues
  if (process.env.NODE_ENV === 'development') {
    console.log('Service worker disabled in development mode to prevent cache issues');
    
    // Unregister any existing service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Unregistered existing service worker');
      }
    }
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered successfully:', registration);
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
};
export const updateServiceWorker = () => serviceWorkerManager.update();
export const skipWaiting = () => serviceWorkerManager.skipWaiting();
export const unregisterServiceWorker = () => serviceWorkerManager.unregister();
export const clearAllCaches = () => serviceWorkerManager.clearAllCaches();
export const getCacheNames = () => serviceWorkerManager.getCacheNames();
export const clearCache = (cacheName: string) => serviceWorkerManager.clearCache(cacheName);
export const getCacheSize = (cacheName: string) => serviceWorkerManager.getCacheSize(cacheName);
export const requestNotificationPermission = () => serviceWorkerManager.requestNotificationPermission();
export const sendMessageToServiceWorker = (message: ServiceWorkerMessage) => serviceWorkerManager.sendMessageToServiceWorker(message);
export const triggerBackgroundSync = (tag: string) => serviceWorkerManager.triggerBackgroundSync(tag);
export const isOnline = () => serviceWorkerManager.isOnline();
export const addOnlineListener = (callback: () => void) => serviceWorkerManager.addOnlineListener(callback);
export const addOfflineListener = (callback: () => void) => serviceWorkerManager.addOfflineListener(callback);
export const removeOnlineListener = (callback: () => void) => serviceWorkerManager.removeOnlineListener(callback);
export const removeOfflineListener = (callback: () => void) => serviceWorkerManager.removeOfflineListener(callback);

// Export the manager instance for advanced usage
export default serviceWorkerManager; 