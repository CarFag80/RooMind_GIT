import React, { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Info, Trash2, Download, Upload, Database, CircleHelp as HelpCircle, Shield, RotateCcw, Bell } from 'lucide-react-native';
import { RoomStorage } from '@/services/storage';
import { Room } from '@/types/room';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InfoModal from '@/components/InfoModal';
import NotificationSettings from '@/components/NotificationSettings';

// Memoized modal content to avoid recreation
const MODAL_CONTENTS = {
  privacy: {
    title: 'Privacy',
    message: 'Tutti i tuoi dati sono salvati localmente sul dispositivo. Nessuna informazione viene inviata a server esterni.',
    icon: <Shield size={24} color="#1565C0" />
  },
  storage: {
    title: 'Storage Locale',
    message: 'L\'app utilizza AsyncStorage per salvare i dati localmente. I dati persistono anche dopo la chiusura dell\'app.',
    icon: <Database size={24} color="#E65100" />
  },
  help: {
    title: 'Come usare l\'app',
    message: '🏠 HOME\n• Visualizza tutte le camere salvate\n• Statistiche: camere totali e alberghi\n• Modifica camere con l\'icona matita\n• Valutazioni per soggiorni passati\n\n🔍 CERCA\n• Ricerca per nome, numero, albergo\n• Filtra per tipologia camera\n• Risultati in tempo reale\n\n➕ AGGIUNGI\n• Crea nuove camere facilmente\n• Campi obbligatori: numero, piano, albergo\n• Date soggiorno opzionali\n• Prezzo per notte con valute multiple\n• 4 tipologie: Singola, Doppia, Tripla, Suite\n\n⚙️ IMPOSTAZIONI\n• Esporta dati in formato JSON\n• Svuota cache per eliminare tutto\n• Privacy: dati salvati solo localmente\n\n💡 SUGGERIMENTI\n• Usa il calendario per date precise\n• Aggiungi note per dettagli importanti\n• Le valutazioni appaiono dopo il checkout',
    message: '🏠 HOME\n• Visualizza tutte le camere salvate\n• Statistiche: camere totali e alberghi\n• Modifica camere con l\'icona matita\n• Valutazioni per soggiorni passati\n\n🔍 CERCA\n• Ricerca per nome, numero, albergo\n• Filtra per tipologia camera\n• Risultati in tempo reale\n\n➕ AGGIUNGI\n• Crea nuove camere facilmente\n• Campi obbligatori: numero, piano, albergo\n• Date soggiorno opzionali\n• Prezzo per notte con valute multiple\n• 4 tipologie: Singola, Doppia, Tripla, Suite\n\n⚙️ IMPOSTAZIONI\n• Esporta dati in formato JSON\n• Importa dati da file JSON di backup\n• Svuota cache per eliminare tutto\n• Privacy: dati salvati solo localmente\n\n📥 IMPORTA DATI\n• Disponibile solo su versione web\n• Carica file JSON esportati dall\'app\n• Rileva automaticamente duplicati\n• Aggiunge solo camere nuove\n• Mantiene dati esistenti al sicuro\n\n💡 SUGGERIMENTI\n• Usa il calendario per date precise\n• Aggiungi note per dettagli importanti\n• Le valutazioni appaiono dopo il checkout\n• Esporta regolarmente per backup sicuri',
    icon: <HelpCircle size={24} color="#7B1FA2" />
  },
  info: {
    title: 'RooMind v1.6',
    message: 'App per la gestione delle camere d\'albergo\n\nSviluppata con React Native & Expo\nDesign Material Design 3',
    icon: <Info size={24} color="#6750A4" />
  },
  success: {
    title: 'Operazione Completata!',
    message: 'Tutti i dati sono stati eliminati con successo.',
    icon: <RotateCcw size={24} color="#4CAF50" />
  },
  error: {
    title: 'Errore',
    message: 'Si è verificato un errore durante l\'operazione. Riprova.',
    icon: <RotateCcw size={24} color="#F44336" />
  },
  exportSuccess: {
    title: 'Esportazione Completata!',
    message: 'Il file è stato scaricato con successo. Controlla la cartella Download.',
    icon: <Download size={24} color="#4CAF50" />
  },
  exportMobile: {
    title: 'Esportazione Completata',
    message: 'I dati sono stati esportati nella console del browser (F12 > Console).',
    icon: <Download size={24} color="#2196F3" />
  },
  exportError: {
    title: 'Errore Esportazione',
    message: 'Si è verificato un errore durante l\'esportazione. Riprova.',
    icon: <Download size={24} color="#F44336" />
  }
} as const;

export default function SettingsScreen() {
  const [roomCount, setRoomCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ 
    title: '', 
    message: '', 
    icon: null as React.ReactNode,
    scrollable: false,
    onClose: () => setModalVisible(false)
  });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const rooms = await RoomStorage.getRooms();
      setRoomCount(rooms?.length || 0);
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche:', error);
      setRoomCount(0);
    }
  }, []);

  // Reload stats when modal closes and data might have changed
  useEffect(() => {
    if (!modalVisible) {
      loadStats();
    }
  }, [modalVisible, loadStats]);

  const importData = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setModalContent({
        title: 'Funzione Non Disponibile',
        message: 'L\'importazione dati è disponibile solo nella versione web dell\'app.',
        icon: <Upload size={24} color="#FF9800" />,
        onClose: () => setModalVisible(false)
      });
      setModalVisible(true);
      return;
    }

    try {
      // Create file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
          const text = await file.text();
          const importedData = JSON.parse(text);
          
          // Validate imported data structure
          if (!importedData.rooms || !Array.isArray(importedData.rooms)) {
            throw new Error('Formato file non valido');
          }
          
          // Get existing rooms
          const existingRooms = await RoomStorage.getRooms();
          const existingKeys = new Set(
            existingRooms.map(room => 
              `${room.hotelName?.toLowerCase() || ''}-${room.roomNumber || ''}-${room.floor || ''}`
            )
          );
          
          let addedCount = 0;
          let skippedCount = 0;
          
          // Process imported rooms
          for (const roomData of importedData.rooms) {
            // Validate required fields
            if (!roomData.roomNumber || !roomData.floor || !roomData.hotelName) {
              skippedCount++;
              continue;
            }
            
            // Check for duplicates
            const roomKey = `${(roomData.hotelName || '').toLowerCase()}-${roomData.roomNumber || ''}-${roomData.floor || ''}`;
            if (existingKeys.has(roomKey)) {
              skippedCount++;
              continue;
            }
            
            // Convert date strings to Date objects if needed
            const processedRoom = {
              ...roomData,
              id: roomData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              checkInDate: roomData.checkInDate ? new Date(roomData.checkInDate) : undefined,
              checkOutDate: roomData.checkOutDate ? new Date(roomData.checkOutDate) : undefined,
              createdAt: roomData.createdAt ? new Date(roomData.createdAt) : new Date(),
            };
            
            // Add room to storage
            await RoomStorage.addRoom(processedRoom);
            existingKeys.add(roomKey);
            addedCount++;
          }
          
          // Update room count
          await loadStats();
          
          // Show success message
          setModalContent({
            title: 'Importazione Completata!',
            message: `Importazione completata con successo!\n\n• ${addedCount} camere aggiunte\n• ${skippedCount} camere saltate (duplicati o non valide)`,
            icon: <Upload size={24} color="#4CAF50" />,
            onClose: () => setModalVisible(false)
          });
          setModalVisible(true);
          
        } catch (error) {
          console.error('Errore nell\'importazione:', error);
          setModalContent({
            title: 'Errore Importazione',
            message: 'Si è verificato un errore durante l\'importazione del file. Verifica che sia un file JSON valido esportato dall\'app.',
            icon: <Upload size={24} color="#F44336" />,
            onClose: () => setModalVisible(false)
          });
          setModalVisible(true);
        }
        
        // Clean up
        document.body.removeChild(input);
      };
      
      // Trigger file selection
      document.body.appendChild(input);
      input.click();
      
    } catch (error) {
      console.error('Errore nell\'apertura del file picker:', error);
      setModalContent({
        title: 'Errore',
        message: 'Si è verificato un errore nell\'apertura del selettore file.',
        icon: <Upload size={24} color="#F44336" />,
        onClose: () => setModalVisible(false)
      });
      setModalVisible(true);
    }
  }, [loadStats]);

  const clearAllData = useCallback(async () => {
    // Force reload of room count before checking
    await loadStats();
    
    if (roomCount === 0) {
      setModalContent({
        title: 'Nessun Dato da Eliminare',
        message: 'Non ci sono camere salvate da eliminare.',
        icon: <RotateCcw size={24} color="#FF9800" />,
      });
      setModalVisible(true);
      return;
    }

    setModalContent({
      title: 'Conferma Eliminazione',
      message: `Eliminare definitivamente tutte le ${roomCount} camere salvate?\n\nPer completare l'operazione sarà necessario ricaricare la pagina.`,
      icon: <RotateCcw size={24} color="#F44336" />,
    });
    setModalVisible(true);
  }, [roomCount]);

  const confirmClearData = useCallback(async () => {
    setModalVisible(false);
    setLoading(true);
    
    try {
      console.log('🗑️ Inizio eliminazione dati...');
      await RoomStorage.clearAll();
      console.log('✅ Dati eliminati con successo');
      
      // Update local state immediately
      setRoomCount(0);
      
      // Show success modal
      setTimeout(() => {
        setModalContent({
          title: 'Cache Svuotata!',
          message: 'Tutti i dati sono stati eliminati con successo. La pagina verrà ricaricata per completare l\'operazione.',
          icon: <RotateCcw size={24} color="#4CAF50" />,
          onClose: () => {
            setModalVisible(false);
            // Force page reload to clear all caches
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }
        });
        setModalVisible(true);
      }, 300);
      
    } catch (error) {
      console.error('💥 Errore nell\'eliminazione:', error);
      setModalContent({
        title: 'Errore Eliminazione',
        message: 'Si è verificato un errore durante l\'eliminazione. Riprova.',
        icon: <RotateCcw size={24} color="#F44336" />,
        onClose: () => setModalVisible(false)
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportData = useCallback(async () => {
    try {
      const rooms = await RoomStorage.getRooms();
      const exportData = {
        rooms: rooms,
        exportDate: new Date().toISOString(),
        totalRooms: rooms.length,
        appVersion: '1.0.0'
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `roomind-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // Create and download file on web
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Check if document is available (web environment)
        if (typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        
        showInfo('exportSuccess');
      } else {
        // For mobile platforms, copy to clipboard as fallback
        // In a real mobile app, you'd use expo-sharing or expo-file-system
        console.log('=== DATI ESPORTATI ===');
        console.log(jsonString);
        console.log('=== FINE ESPORTAZIONE ===');
        
        showInfo('exportMobile');
      }
    } catch (error) {
      console.error('Errore nell\'esportazione:', error);
      showInfo('exportError');
    }
  }, []);

  const showInfo = useCallback((contentKey: keyof typeof MODAL_CONTENTS) => {
    const content = MODAL_CONTENTS[contentKey];
    setModalContent({
      ...content,
      scrollable: contentKey === 'help', // Solo la guida è scrollabile
    });
    setModalVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6750A4', '#7F67BE']}
        style={styles.header}>
        <Text style={styles.headerTitle}>Impostazioni</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) }
        ]}>
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statNumber}>{roomCount}</Text>
            <Text style={styles.statLabel}>Camere salvate</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statNumber}>Locale</Text>
            <Text style={styles.statLabel}>Memoria</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestione Dati</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={importData}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
                <Upload size={20} color="#1565C0" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Importa dati</Text>
                <Text style={styles.menuItemSubtitle}>
                  {Platform.OS === 'web' ? 'Carica file JSON di backup' : 'Disponibile solo su web'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={exportData}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8F5E8' }]}>
                <Download size={20} color="#1B5E20" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Esporta dati</Text>
                <Text style={styles.menuItemSubtitle}>
                  {Platform.OS === 'web' ? 'Scarica file JSON con i tuoi dati' : 'Salva una copia dei tuoi dati'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, loading && styles.menuItemDisabled]}
            onPress={clearAllData}
            disabled={loading}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
                {Platform.OS === 'web' ? (
                  <RotateCcw size={20} color="#C62828" />
                ) : (
                  <Trash2 size={20} color="#C62828" />
                )}
              </View>
              <View>
                <Text style={styles.menuItemTitle}>
                  {loading ? 'Operazione in corso...' : (Platform.OS === 'web' ? 'Svuota Cache' : 'Elimina tutti i dati')}
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  {roomCount > 0 ? (
                    Platform.OS === 'web' 
                      ? `Cancella ${roomCount} camere e ricarica`
                      : `Rimuovi tutte le ${roomCount} camere salvate`
                  ) : 'Nessuna camera da eliminare'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informazioni</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowNotificationSettings(true)}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                <Bell size={20} color="#F57C00" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Notifiche</Text>
                <Text style={styles.menuItemSubtitle}>Gestisci promemoria e impostazioni</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => showInfo('privacy')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
                <Shield size={20} color="#1565C0" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Privacy</Text>
                <Text style={styles.menuItemSubtitle}>Informazioni sulla privacy</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => showInfo('storage')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                <Database size={20} color="#E65100" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Storage Locale</Text>
                <Text style={styles.menuItemSubtitle}>Come vengono salvati i dati</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => showInfo('help')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
                <HelpCircle size={20} color="#7B1FA2" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Come usare l'app</Text>
                <Text style={styles.menuItemSubtitle}>Guida rapida</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => showInfo('info')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8DEF8' }]}>
                <Info size={20} color="#6750A4" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Informazioni app</Text>
                <Text style={styles.menuItemSubtitle}>Versione e dettagli</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>RooMind v1.6</Text>
          <Text style={styles.footerSubtext}>Le tue camere, sempre con te</Text>
        </View>
      </ScrollView>

      <InfoModal
        visible={modalVisible}
        onClose={modalContent.title === 'Conferma Eliminazione' ? confirmClearData : () => setModalVisible(false)}
        title={modalContent.title}
        message={modalContent.message}
        icon={modalContent.icon}
        scrollable={modalContent.scrollable}
      />
      
      {showNotificationSettings && (
        <View style={styles.modalOverlay}>
          <NotificationSettings
            visible={showNotificationSettings}
            onClose={() => setShowNotificationSettings(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF7FF',
  },
  header: {
    paddingTop: 30,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    minHeight: 80,
    width: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 32,
    gap: 16,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#625B71',
    textAlign: 'center',
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    cursor: 'pointer',
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1B1F',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#49454F',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 16,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6750A4',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#79747E',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
});