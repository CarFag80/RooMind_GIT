import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [appIsReady, setAppIsReady] = useState(false);
  
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // Artificially delay for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  useEffect(() => {
    // PWA setup only on web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
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
      } catch (error) {
        console.warn('PWA setup failed:', error);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppIsReady(true);
    }, 500);
    
    // PWA setup only on web
    if (typeof window !== 'undefined') {
      try {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          const meta = document.createElement('meta');
          meta.name = 'viewport';
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
          document.head.appendChild(meta);
        }
        
        // Add PWA manifest link
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (!manifestLink) {
          const link = document.createElement('link');
          link.rel = 'manifest';
          link.href = '/manifest.json';
          document.head.appendChild(link);
        }
        
        // Add theme color meta tag
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (!themeColor) {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = '#6750A4';
          document.head.appendChild(meta);
        }
        
        // Add Apple-specific meta tags for iOS PWA
        const appleMobileCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
        if (!appleMobileCapable) {
          const meta = document.createElement('meta');
          meta.name = 'apple-mobile-web-app-capable';
          meta.content = 'yes';
          document.head.appendChild(meta);
        }
        
        const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!appleStatusBar) {
          const meta = document.createElement('meta');
          meta.name = 'apple-mobile-web-app-status-bar-style';
          meta.content = 'black-translucent';
          document.head.appendChild(meta);
        }
        
        const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (!appleTitle) {
          const meta = document.createElement('meta');
          meta.name = 'apple-mobile-web-app-title';
          meta.content = 'RooMind';
          document.head.appendChild(meta);
        }
      } catch (error) {
        console.warn('PWA meta tags setup failed:', error);
      }
    }
    
    return () => clearTimeout(timer);
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