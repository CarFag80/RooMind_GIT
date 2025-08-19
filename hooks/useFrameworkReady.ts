import { useEffect } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Ensure window object exists and call frameworkReady safely
      try {
        if (window.frameworkReady) {
          window.frameworkReady();
        }
      } catch (error) {
        console.warn('Framework ready callback failed:', error);
      }
    }
  }, []);
}