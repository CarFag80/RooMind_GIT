import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { notificationService } from '@/services/notificationService';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [appIsReady, setAppIsReady] = useState(false);
  
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Initialize notification service globally
        await notificationService.initialize();
        console.log('🔔 Notification service initialized globally');
        
        // Register service worker for background notifications
        if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            // Check if we're in StackBlitz environment
            if (window.location.hostname.includes('stackblitz') || 
                window.location.hostname.includes('webcontainer') ||
                window.location.hostname.includes('bolt.new')) {
              console.log('🚫 Service Worker skipped: StackBlitz environment detected');
              return;
            }
            
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('🔧 Service Worker registered:', registration);
            
            // Setup message listener for service worker communication
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data.type === 'GET_NOTIFICATION_DATA') {
                const settings = notificationService.getSettings();
                const history = notificationService.getHistory();
                event.ports[0].postMessage({ settings, history });
              } else if (event.data.type === 'UPDATE_NOTIFICATION_DATA') {
                // Handle notification updates from service worker
                console.log('📱 Notification data updated by service worker');
              }
            });
            
            // Request persistent notification permission
            if ('Notification' in window && Notification.permission === 'granted') {
              // Register for background sync if supported
              if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                registration.sync.register('background-notification-check');
                console.log('🔄 Background sync registered');
              }
              
              // Register for periodic sync if supported (experimental)
              if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
                const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                if (status.state === 'granted') {
                  await registration.periodicSync.register('notification-check', {
                    minInterval: 5 * 60 * 1000 // 5 minutes
                  });
                  console.log('⏰ Periodic sync registered');
                }
              }
            }
          } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
          }
        }
      } catch (e) {
        console.warn('App preparation error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Cleanup notification service on unmount
  useEffect(() => {
    return () => {
      notificationService.destroy();
    };
  }, []);

  useEffect(() => {
    // PWA setup only on web
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        // Add PWA manifest link
        if (!document.querySelector('link[rel="manifest"]')) {
          const link = document.createElement('link');
          link.rel = 'manifest';
          link.href = '/manifest.json';
          document.head.appendChild(link);
        }
        
        // Add theme color meta tag
        if (!document.querySelector('meta[name="theme-color"]')) {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = '#6750A4';
          document.head.appendChild(meta);
        }
        
        // Add Apple-specific meta tags for iOS PWA
        const appleMetas = [
          { name: 'apple-mobile-web-app-capable', content: 'yes' },
          { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
          { name: 'apple-mobile-web-app-title', content: 'RooMind' }
        ];
        
        appleMetas.forEach(({ name, content }) => {
          if (!document.querySelector(`meta[name="${name}"]`)) {
            const meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
          }
        });
      } catch (error) {
        console.warn('PWA meta tags setup failed:', error);
      }
    }
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="edit-room" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}