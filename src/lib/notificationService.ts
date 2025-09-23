import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        return true;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return false;
      }
    }
    return false;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async showNotification(data: PushNotificationData) {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission denied');
      return;
    }

    // Try to use service worker for better notification management
    if (this.registration) {
      try {
        await this.registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/favicon.ico',
          badge: data.badge || '/favicon.ico',
          tag: data.tag || 'farmers-bracket',
          data: data.data,
          requireInteraction: true
        });
      } catch (error) {
        console.error('Failed to show notification via service worker:', error);
        this.fallbackNotification(data);
      }
    } else {
      this.fallbackNotification(data);
    }
  }

  private fallbackNotification(data: PushNotificationData) {
    new Notification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      tag: data.tag || 'farmers-bracket',
      data: data.data
    });
  }

  async subscribeToRealTimeUpdates(userId: string) {
    // Subscribe to order updates
    const orderChannel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleOrderUpdate(payload);
        }
      )
      .subscribe();

    // Subscribe to chat messages
    const chatChannel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          this.handleChatMessage(payload);
        }
      )
      .subscribe();

    return { orderChannel, chatChannel };
  }

  private async handleOrderUpdate(payload: any) {
    const order = payload.new || payload.old;
    
    if (payload.eventType === 'INSERT') {
      await this.showNotification({
        title: 'New Order Placed!',
        body: `Your order #${order.id.slice(-6)} has been placed successfully.`,
        tag: `order-${order.id}`,
        data: { type: 'order', orderId: order.id }
      });
    } else if (payload.eventType === 'UPDATE') {
      const statusMessages: Record<string, string> = {
        'processing': 'Your order is being processed',
        'shipped': 'Your order has been shipped',
        'delivered': 'Your order has been delivered',
        'cancelled': 'Your order has been cancelled'
      };

      const message = statusMessages[order.status] || 'Your order status has been updated';
      
      await this.showNotification({
        title: 'Order Update',
        body: `Order #${order.id.slice(-6)}: ${message}`,
        tag: `order-${order.id}`,
        data: { type: 'order', orderId: order.id }
      });
    }
  }

  private async handleChatMessage(payload: any) {
    const message = payload.new;
    
    await this.showNotification({
      title: 'New Message',
      body: message.message.slice(0, 50) + (message.message.length > 50 ? '...' : ''),
      tag: 'new-message',
      data: { type: 'message', senderId: message.sender_id }
    });
  }

  async unsubscribe() {
    // Unsubscribe from all channels
    supabase.removeAllChannels();
  }
}

export const notificationService = new NotificationService();