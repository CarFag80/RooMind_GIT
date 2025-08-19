import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  useFrameworkReady();
  
  useEffect(() => {
    // Prevent splash screen from auto-hiding
    SplashScreen.preventAutoHideAsync().catch(() => {
      // Ignore errors on web
    });
    
    // Hide splash screen after loading
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors
      });
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

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-room" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}