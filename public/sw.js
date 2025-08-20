// Service Worker per notifiche in background
const CACHE_NAME = 'roomind-v1.7.0';
const NOTIFICATION_TAG = 'roomind-notification';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-notification-check') {
    console.log('🔄 Background sync: checking notifications');
    event.waitUntil(checkAndSendNotifications());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'notification-check') {
    console.log('⏰ Periodic sync: checking notifications');
    event.waitUntil(checkAndSendNotifications());
  }
});

// Push event (for future server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nuovo promemoria RooMind',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: NOTIFICATION_TAG,
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Apri App',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Chiudi'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('🏨 RooMind', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes('roomind') || client.url.includes('localhost')) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        return self.clients.openWindow('/');
      })
  );
});

// Check and send notifications function
async function checkAndSendNotifications() {
  try {
    console.log('🔍 Checking for pending notifications...');
    
    // Get notification data from IndexedDB or localStorage
    const notificationData = await getStoredNotifications();
    
    if (!notificationData || !notificationData.settings?.enabled) {
      console.log('📴 Notifications disabled');
      return;
    }

    const now = new Date();
    const pendingNotifications = notificationData.history?.notifications?.filter(
      notification => 
        !notification.isSent && 
        new Date(notification.scheduledDate) <= now &&
        !isInQuietHours(now, notificationData.settings)
    ) || [];

    console.log(`📊 Found ${pendingNotifications.length} pending notifications`);

    for (const notification of pendingNotifications) {
      await sendBackgroundNotification(notification);
      
      // Mark as sent in storage
      notification.isSent = true;
      await updateStoredNotifications(notificationData);
    }

    if (pendingNotifications.length > 0) {
      console.log(`✅ Sent ${pendingNotifications.length} background notifications`);
    }

  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  }
}

// Send background notification
async function sendBackgroundNotification(notification) {
  const options = {
    body: notification.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: `${notification.type}-${notification.roomId}`,
    requireInteraction: true,
    data: {
      roomId: notification.roomId,
      type: notification.type,
      notificationId: notification.id
    },
    actions: [
      {
        action: 'open',
        title: 'Apri Camera',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Chiudi'
      }
    ]
  };

  await self.registration.showNotification(notification.title, options);
  console.log(`🔔 Background notification sent: ${notification.title}`);
}

// Check if current time is in quiet hours
function isInQuietHours(date, settings) {
  if (!settings?.quietHours?.enabled || settings?.preferredTime === 'anytime') {
    return false;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTime = hours * 60 + minutes;

  const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
  const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
}

// Get stored notifications from localStorage
async function getStoredNotifications() {
  try {
    // Try to get data from localStorage via message to main thread
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      // Send message to get data from main thread
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        clients[0].postMessage({
          type: 'GET_NOTIFICATION_DATA'
        }, [messageChannel.port2]);
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000);
      });
    }
    
    return null;
  } catch (error) {
    console.error('Error getting stored notifications:', error);
    return null;
  }
}

// Update stored notifications
async function updateStoredNotifications(data) {
  try {
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'UPDATE_NOTIFICATION_DATA',
        data: data
      });
    }
  } catch (error) {
    console.error('Error updating stored notifications:', error);
  }
}

// Periodic check every 5 minutes when app is in background
setInterval(() => {
  checkAndSendNotifications();
}, 5 * 60 * 1000);

console.log('🚀 RooMind Service Worker loaded and ready');