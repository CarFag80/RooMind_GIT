import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  useFrameworkReady();
  
  useEffect(() => {
    // Keep splash screen visible while loading
    SplashScreen.preventAutoHideAsync();
    
    // Hide splash screen after a short delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
    
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        // PWA Meta tags for better mobile experience
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
          meta.content = 'default';
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