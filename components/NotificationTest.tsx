import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Bell, Check, X, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function NotificationTest() {
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setTestResults(prev => [...prev, logMessage]);
  };

  const checkNotificationSupport = () => {
    if (Platform.OS !== 'web') {
      addLog('❌ Platform: Non-web (notifiche non supportate)');
      return;
    }

    if (typeof window === 'undefined') {
      addLog('❌ Window: Non disponibile');
      return;
    }

    if (!('Notification' in window)) {
      addLog('❌ Notification API: Non supportato dal browser');
      return;
    }

    addLog('✅ Notification API: Supportato');
    setIsSupported(true);
    
    const permission = Notification.permission;
    setPermissionStatus(permission);
    addLog(`🔐 Permesso attuale: ${permission}`);
  };

  const requestPermission = async () => {
    if (!isSupported) {
      addLog('❌ Impossibile richiedere permesso: API non supportata');
      return;
    }

    try {
      addLog('🔐 Richiedendo permesso notifiche...');
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      addLog(`🔐 Risultato permesso: ${permission}`);
      
      if (permission === 'granted') {
        addLog('✅ Permesso concesso! Pronto per test notifica');
      } else if (permission === 'denied') {
        addLog('❌ Permesso negato dall\'utente');
      } else {
        addLog('⚠️ Permesso non concesso (default)');
      }
    } catch (error) {
      addLog(`❌ Errore richiesta permesso: ${error}`);
    }
  };

  const sendTestNotification = () => {
    if (!isSupported) {
      addLog('❌ Test fallito: API non supportata');
      return;
    }

    if (permissionStatus !== 'granted') {
      addLog('❌ Test fallito: Permesso non concesso');
      return;
    }

    try {
      addLog('🚀 Creando notifica di test...');
      
      const notification = new Notification('🧪 RooMind - Test Funzionamento', {
        body: 'Se vedi questa notifica, il sistema funziona correttamente!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'test-notification',
        requireInteraction: true,
        timestamp: Date.now(),
        data: {
          test: true,
          timestamp: new Date().toISOString()
        }
      });

      addLog('✅ Notifica creata con successo');

      notification.onclick = () => {
        addLog('🔔 Notifica cliccata dall\'utente');
        notification.close();
      };

      notification.onshow = () => {
        addLog('👁️ Notifica mostrata sullo schermo');
      };

      notification.onerror = (error) => {
        addLog(`❌ Errore notifica: ${error}`);
      };

      notification.onclose = () => {
        addLog('🔒 Notifica chiusa');
      };

      // Auto-close after 10 seconds for testing
      setTimeout(() => {
        if (notification) {
          notification.close();
          addLog('⏰ Notifica chiusa automaticamente dopo 10 secondi');
        }
      }, 10000);

    } catch (error) {
      addLog(`❌ Errore creazione notifica: ${error}`);
    }
  };

  const clearLogs = () => {
    setTestResults([]);
    addLog('🧹 Log puliti - Test riavviato');
  };

  const getPermissionColor = () => {
    switch (permissionStatus) {
      case 'granted': return '#4CAF50';
      case 'denied': return '#F44336';
      case 'default': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getPermissionIcon = () => {
    switch (permissionStatus) {
      case 'granted': return <Check size={20} color="#4CAF50" />;
      case 'denied': return <X size={20} color="#F44336" />;
      case 'default': return <AlertCircle size={20} color="#FF9800" />;
      default: return <Bell size={20} color="#9E9E9E" />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bell size={24} color="#6750A4" />
        <Text style={styles.title}>Test Notifiche</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Supporto Browser:</Text>
          <Text style={[styles.statusValue, { color: isSupported ? '#4CAF50' : '#F44336' }]}>
            {isSupported ? 'Supportato' : 'Non Supportato'}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Permesso:</Text>
          <View style={styles.permissionStatus}>
            {getPermissionIcon()}
            <Text style={[styles.statusValue, { color: getPermissionColor() }]}>
              {permissionStatus}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={requestPermission}
          disabled={!isSupported || permissionStatus === 'granted'}>
          <Text style={styles.buttonText}>
            {permissionStatus === 'granted' ? 'Permesso Concesso' : 'Richiedi Permesso'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={sendTestNotification}
          disabled={!isSupported || permissionStatus !== 'granted'}>
          <Text style={styles.buttonText}>Invia Test Notifica</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}>
          <Text style={styles.buttonText}>Pulisci Log</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Log Test ({testResults.length})</Text>
        <View style={styles.logsList}>
          {testResults.slice(-10).map((log, index) => (
            <Text key={index} style={styles.logItem}>
              {log}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1F',
    marginLeft: 12,
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#625B71',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6750A4',
  },
  testButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logsContainer: {
    maxHeight: 200,
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 8,
  },
  logsList: {
    backgroundColor: '#F7F2FA',
    borderRadius: 8,
    padding: 12,
    maxHeight: 150,
  },
  logItem: {
    fontSize: 12,
    color: '#49454F',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
  },
});