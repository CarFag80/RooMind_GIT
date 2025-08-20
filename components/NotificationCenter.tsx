import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Bell, BellOff, X, Check, Calendar, Star, Chrome as Home, Settings as SettingsIcon } from 'lucide-react-native';
import { notificationService, NotificationItem, NotificationSettings } from '@/services/notificationService';
import { router } from 'expo-router';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const history = notificationService.getHistory();
      const currentSettings = notificationService.getSettings();
      
      // Sort notifications: unread first, then by date (newest first)
      const sortedNotifications = history.notifications
        .filter(n => n.isSent)
        .sort((a, b) => {
          if (a.isRead !== b.isRead) {
            return a.isRead ? 1 : -1; // Unread first
          }
          return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first
        });

      setNotifications(sortedNotifications);
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load notification data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const handleNotificationPress = useCallback(async (notification: NotificationItem) => {
    // Mark as read
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'check-in':
      case 'check-out':
        router.push({
          pathname: '/edit-room',
          params: { roomId: notification.roomId }
        });
        break;
      case 'rating':
        router.push({
          pathname: '/edit-room',
          params: { roomId: notification.roomId }
        });
        break;
    }

    onClose();
  }, [handleMarkAsRead, onClose]);

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'check-in':
        return <Home size={20} color="#4CAF50" />;
      case 'check-out':
        return <Calendar size={20} color="#FF9800" />;
      case 'rating':
        return <Star size={20} color="#FFD700" />;
      default:
        return <Bell size={20} color="#6750A4" />;
    }
  }, []);

  const formatNotificationDate = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Ora';
    } else if (diffHours < 24) {
      return `${diffHours}h fa`;
    } else if (diffDays < 7) {
      return `${diffDays}g fa`;
    } else {
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short'
      });
    }
  }, []);

  const openNotificationSettings = useCallback(() => {
    onClose();
    router.push('/(tabs)/settings');
  }, [onClose]);

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Notifiche</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={20} color="#625B71" />
              </TouchableOpacity>
            </View>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Caricamento...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bell size={24} color="#6750A4" />
              <Text style={styles.title}>Notifiche</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.settingsButton} 
                onPress={openNotificationSettings}>
                <SettingsIcon size={18} color="#6750A4" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={20} color="#625B71" />
              </TouchableOpacity>
            </View>
          </View>

          {!settings?.enabled && (
            <View style={styles.disabledBanner}>
              <BellOff size={16} color="#F57C00" />
              <Text style={styles.disabledText}>
                Le notifiche sono disabilitate
              </Text>
            </View>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color="#CAC4D0" />
                <Text style={styles.emptyTitle}>Nessuna notifica</Text>
                <Text style={styles.emptySubtitle}>
                  Le notifiche per check-in, check-out e valutazioni appariranno qui
                </Text>
              </View>
            ) : (
              <View style={styles.notificationsList}>
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.isRead && styles.notificationItemUnread
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}>
                    
                    <View style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
                    </View>

                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={[
                          styles.notificationTitle,
                          !notification.isRead && styles.notificationTitleUnread
                        ]}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatNotificationDate(notification.createdAt)}
                        </Text>
                      </View>
                      
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>

                      {!notification.isRead && (
                        <TouchableOpacity
                          style={styles.markReadButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}>
                          <Check size={14} color="#6750A4" />
                          <Text style={styles.markReadText}>Segna come letta</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {!notification.isRead && (
                      <View style={styles.unreadIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {notifications.filter(n => !n.isRead).length} non lette • {notifications.length} totali
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxWidth: 400,
    width: '100%',
    maxHeight: '85%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0EC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1F',
    marginLeft: 12,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0EC',
    gap: 8,
  },
  disabledText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#625B71',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#49454F',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#79747E',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E7E0EC',
    position: 'relative',
  },
  notificationItemUnread: {
    backgroundColor: '#F7F2FA',
    borderColor: '#E8DEF8',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1B1F',
    flex: 1,
    marginRight: 8,
  },
  notificationTitleUnread: {
    fontWeight: '700',
    color: '#6750A4',
  },
  notificationTime: {
    fontSize: 12,
    color: '#79747E',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#49454F',
    lineHeight: 20,
    marginBottom: 8,
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E8DEF8',
    gap: 4,
  },
  markReadText: {
    fontSize: 12,
    color: '#6750A4',
    fontWeight: '500',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6750A4',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E7E0EC',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#79747E',
  },
});