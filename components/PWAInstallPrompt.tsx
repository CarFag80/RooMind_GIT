import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Download, X, Smartphone, Check } from 'lucide-react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export default function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const STORAGE_KEY = 'roomind_pwa_dont_show_again';

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') return;

    // Check if user has chosen "don't show again"
    const savedPreference = localStorage.getItem(STORAGE_KEY);
    if (savedPreference === 'true') {
      return; // Don't show prompt if user chose not to see it again
    }

    // Check if running in standalone mode (already installed)
    const isStandaloneMode = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                            (window.navigator as any).standalone ||
                            document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Don't show prompt if already installed
    if (isStandaloneMode) return;

    // Handle beforeinstallprompt event (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay to not be intrusive
      setTimeout(() => {
        setShowPrompt(true);
      }, 1000); // Ridotto il delay per test
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show manual install prompt
    if (iOS && !isStandaloneMode) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000); // Ridotto il delay per test
    }
    
    // For testing: force show prompt on web after delay
    if (!iOS && !isStandaloneMode) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android Chrome install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        onInstall?.();
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
    
    // Save preference if "don't show again" is checked
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  const toggleDontShowAgain = () => {
    setDontShowAgain(!dontShowAgain);
  };

  // Don't show on non-web platforms or if already installed
  if (Platform.OS !== 'web' || isStandalone || !showPrompt) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.prompt}>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <X size={20} color="#625B71" />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Smartphone size={32} color="#6750A4" />
          </View>
          
          <Text style={styles.title}>Installa RooMind</Text>
          <Text style={styles.description}>
            {isIOS 
              ? 'Aggiungi RooMind alla schermata Home per un accesso rapido. Tocca il pulsante Condividi e seleziona "Aggiungi alla schermata Home".'
              : 'Installa RooMind sul tuo dispositivo per un accesso rapido e un\'esperienza migliore.'
            }
          </Text>
          
          {!isIOS && deferredPrompt && (
            <TouchableOpacity style={styles.installButton} onPress={handleInstallClick}>
              <Download size={20} color="#FFFFFF" />
              <Text style={styles.installButtonText}>Installa App</Text>
            </TouchableOpacity>
          )}
          
          {isIOS && (
            <View style={styles.iosInstructions}>
              <Text style={styles.iosStep}>1. Tocca il pulsante Condividi ⬆️</Text>
              <Text style={styles.iosStep}>2. Scorri e tocca "Aggiungi alla schermata Home"</Text>
              <Text style={styles.iosStep}>3. Tocca "Aggiungi" per confermare</Text>
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={toggleDontShowAgain}
            activeOpacity={0.7}>
            <View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
              {dontShowAgain && <Check size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Non mostrare più</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    zIndex: 1000,
  },
  prompt: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E8DEF8',
    position: 'relative',
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    paddingRight: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8DEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1B1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#49454F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6750A4',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  installButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iosInstructions: {
    alignItems: 'flex-start',
    width: '100%',
  },
  iosStep: {
    fontSize: 14,
    color: '#6750A4',
    marginBottom: 8,
    fontWeight: '500',
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8DEF8',
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6750A4',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#6750A4',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#49454F',
    fontWeight: '500',
  },
});