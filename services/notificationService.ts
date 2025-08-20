import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Room } from '@/types/room';

export interface NotificationSettings {
  enabled: boolean;
  pushEnabled: boolean;
  checkInReminder: boolean;
  checkOutReminder: boolean;
  ratingReminder: boolean;
  preferredTime: string; // HH:MM format
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

export interface NotificationItem {
  id: string;
  roomId: string;
  type: 'check-in' | 'check-out' | 'rating';
  title: string;
  message: string;
  scheduledDate: Date;
  isRead: boolean;
  isSent: boolean;
  createdAt: Date;
}

export interface NotificationHistory {
  notifications: NotificationItem[];
  lastCleanup: Date;
}

const STORAGE_KEYS = {
  SETTINGS: 'roomind_notification_settings',
  HISTORY: 'roomind_notification_history',
  PERMISSION: 'roomind_notification_permission'
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  pushEnabled: false,
  checkInReminder: true,
  checkOutReminder: true,
  ratingReminder: true,
  preferredTime: '09:00',
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  }
};

class NotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private history: NotificationHistory = { notifications: [], lastCleanup: new Date() };
  private checkInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadSettings();
      await this.loadHistory();
      this.startPeriodicCheck();
      this.isInitialized = true;
      console.log('📱 NotificationService initialized');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
    }
  }

  async loadSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
      return this.settings;
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      this.settings = settings;
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      console.log('💾 Notification settings saved');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      throw error;
    }
  }

  async loadHistory(): Promise<NotificationHistory> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.history = {
          notifications: parsed.notifications.map((n: any) => ({
            ...n,
            scheduledDate: new Date(n.scheduledDate),
            createdAt: new Date(n.createdAt)
          })),
          lastCleanup: new Date(parsed.lastCleanup)
        };
      }
      return this.history;
    } catch (error) {
      console.error('Failed to load notification history:', error);
      return { notifications: [], lastCleanup: new Date() };
    }
  }

  async saveHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save notification history:', error);
    }
  }

  async requestPushPermission(): Promise<boolean> {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return false;
    }

    try {
      if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        return false;
      }

      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION, JSON.stringify({
        granted,
        timestamp: new Date().toISOString()
      }));

      return granted;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      return false;
    }
  }

  async scheduleNotificationsForRoom(room: Room): Promise<void> {
    if (!this.settings.enabled) return;

    const notifications: NotificationItem[] = [];
    const now = new Date();

    // Check-in reminder (24 hours before)
    if (this.settings.checkInReminder && room.checkInDate) {
      const checkInDate = new Date(room.checkInDate);
      const reminderDate = new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000);
      
      if (reminderDate > now) {
        notifications.push({
          id: `checkin-${room.id}-${Date.now()}`,
          roomId: room.id,
          type: 'check-in',
          title: 'Check-in Domani',
          message: `Ricorda: check-in domani per la camera ${room.roomNumber} presso ${room.hotelName}`,
          scheduledDate: this.adjustToPreferredTime(reminderDate),
          isRead: false,
          isSent: false,
          createdAt: new Date()
        });
      }
    }

    // Check-out reminder (24 hours before)
    if (this.settings.checkOutReminder && room.checkOutDate) {
      const checkOutDate = new Date(room.checkOutDate);
      const reminderDate = new Date(checkOutDate.getTime() - 24 * 60 * 60 * 1000);
      
      if (reminderDate > now) {
        notifications.push({
          id: `checkout-${room.id}-${Date.now()}`,
          roomId: room.id,
          type: 'check-out',
          title: 'Check-out Domani',
          message: `Ricorda: check-out domani dalla camera ${room.roomNumber} presso ${room.hotelName}`,
          scheduledDate: this.adjustToPreferredTime(reminderDate),
          isRead: false,
          isSent: false,
          createdAt: new Date()
        });
      }
    }

    // Rating reminder (48 hours after check-out)
    if (this.settings.ratingReminder && room.checkOutDate) {
      const checkOutDate = new Date(room.checkOutDate);
      const reminderDate = new Date(checkOutDate.getTime() + 48 * 60 * 60 * 1000);
      
      if (reminderDate > now && !room.rating) {
        notifications.push({
          id: `rating-${room.id}-${Date.now()}`,
          roomId: room.id,
          type: 'rating',
          title: 'Valuta il Soggiorno',
          message: `Come è stato il soggiorno nella camera ${room.roomNumber} presso ${room.hotelName}? Lascia una valutazione!`,
          scheduledDate: this.adjustToPreferredTime(reminderDate),
          isRead: false,
          isSent: false,
          createdAt: new Date()
        });
      }
    }

    // Add to history and save
    this.history.notifications.push(...notifications);
    await this.saveHistory();

    console.log(`📅 Scheduled ${notifications.length} notifications for room ${room.roomNumber}`);
  }

  private adjustToPreferredTime(date: Date): Date {
    const [hours, minutes] = this.settings.preferredTime.split(':').map(Number);
    const adjusted = new Date(date);
    adjusted.setHours(hours, minutes, 0, 0);
    
    // If the preferred time has already passed for that day, schedule for the next day
    if (adjusted <= new Date()) {
      adjusted.setDate(adjusted.getDate() + 1);
    }
    
    return adjusted;
  }

  private isInQuietHours(date: Date): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const currentTime = hours * 60 + minutes;

    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  async checkPendingNotifications(): Promise<NotificationItem[]> {
    const now = new Date();
    const pendingNotifications = this.history.notifications.filter(
      notification => 
        !notification.isSent && 
        notification.scheduledDate <= now &&
        !this.isInQuietHours(now)
    );

    for (const notification of pendingNotifications) {
      await this.sendNotification(notification);
    }

    if (pendingNotifications.length > 0) {
      await this.saveHistory();
    }

    return pendingNotifications;
  }

  private async sendNotification(notification: NotificationItem): Promise<void> {
    try {
      // Send push notification if enabled and permission granted
      if (this.settings.pushEnabled && Platform.OS === 'web' && typeof window !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            tag: notification.id,
            requireInteraction: true,
            data: {
              roomId: notification.roomId,
              type: notification.type
            }
          });
        }
      }

      // Mark as sent
      notification.isSent = true;
      console.log(`📱 Notification sent: ${notification.title}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  startPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkPendingNotifications();
    }, 5 * 60 * 1000);

    // Initial check
    setTimeout(() => {
      this.checkPendingNotifications();
    }, 1000);
  }

  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.history.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      await this.saveHistory();
    }
  }

  async clearOldNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialCount = this.history.notifications.length;
    this.history.notifications = this.history.notifications.filter(
      notification => notification.createdAt > cutoffDate
    );

    this.history.lastCleanup = new Date();
    await this.saveHistory();

    const removedCount = initialCount - this.history.notifications.length;
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old notifications`);
    }
  }

  async removeNotificationsForRoom(roomId: string): Promise<void> {
    const initialCount = this.history.notifications.length;
    this.history.notifications = this.history.notifications.filter(
      notification => notification.roomId !== roomId
    );

    const removedCount = initialCount - this.history.notifications.length;
    if (removedCount > 0) {
      await this.saveHistory();
      console.log(`🗑️ Removed ${removedCount} notifications for room ${roomId}`);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  getHistory(): NotificationHistory {
    return {
      notifications: [...this.history.notifications],
      lastCleanup: new Date(this.history.lastCleanup)
    };
  }

  getUnreadCount(): number {
    return this.history.notifications.filter(n => n.isSent && !n.isRead).length;
  }

  getPendingCount(): number {
    const now = new Date();
    return this.history.notifications.filter(n => !n.isSent && n.scheduledDate > now).length;
  }

  async rescheduleAllNotifications(rooms: Room[]): Promise<void> {
    // Clear existing unsent notifications
    this.history.notifications = this.history.notifications.filter(n => n.isSent);
    
    // Schedule new notifications for all rooms
    for (const room of rooms) {
      await this.scheduleNotificationsForRoom(room);
    }
    
    console.log('🔄 Rescheduled notifications for all rooms');
  }

  destroy(): void {
    this.stopPeriodicCheck();
    this.isInitialized = false;
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Auto-initialize when imported
if (Platform.OS === 'web') {
  notificationService.initialize().catch(console.error);
}

export default notificationService;