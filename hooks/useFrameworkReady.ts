import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.frameworkReady) {
      // Ensure window object exists and call frameworkReady safely
      try {
        window.frameworkReady();
      } catch (error) {
        console.warn('Framework ready callback failed:', error);
      }
    }
  }, []);
}