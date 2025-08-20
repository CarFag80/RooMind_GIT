import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Bell, BellOff, Clock, Moon, Smartphone, Check, X } from 'lucide-react-native';
import { notificationService, NotificationSettings as NotificationSettingsType } from '@/services/notificationService';
import InfoModal from './InfoModal';

interface NotificationSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const TIME_CATEGORIES = [
  {
    category: 'Mattina',
    times: [
      { value: '08:00', label: '8:00' },
      { value: '09:00', label: '9:00' },
      { value: '10:00', label: '10:00' },
      { value: '11:00', label: '11:00' },
    ]
  },
  {
    category: 'Pomeriggio',
    times: [
      { value: '12:00', label: '12:00' },
      { value: '14:00', label: '14:00' },
      { value: '16:00', label: '16:00' },
    ]
  },
  {
    category: 'Sera',
    times: [
      { value: '18:00', label: '18:00' },
      { value: '20:00', label: '20:00' },
      { value: '22:00', label: '22:00' },
    ]
  },
  {
    category: '24H',
    times: [
      { value: '00:00', label: '00:00' },
      { value: '06:00', label: '6:00' },
    ]
  }
];

const QUIET_HOURS_OPTIONS = [
  { start: '22:00', end: '08:00', label: '22:00 - 8:00' },
  { start: '23:00', end: '07:00', label: '23:00 - 7:00' },
  { start: '00:00', end: '08:00', label: '00:00 - 8:00' },
  { start: '21:00', end: '09:00', label: '21:00 - 9:00' },
];

export default function NotificationSettings({ visible, onClose }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    icon: null as React.ReactNode
  });

  const loadSettings = useCallback(async () => {
    try {
      const currentSettings = await notificationService.loadSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible, loadSettings]);

  const saveSettings = useCallback(async (newSettings: NotificationSettingsType) => {
    setSaving(true);
    try {
      await notificationService.saveSettings(newSettings);
      setSettings(newSettings);
      
      setModalContent({
        title: 'Impostazioni Salvate',
        message: 'Le preferenze per le notifiche sono state aggiornate con successo.',
        icon: <Check size={24} color="#4CAF50" />
      });
      setShowModal(true);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      setModalContent({
        title: 'Errore di Salvataggio',
        message: 'Si è verificato un errore durante il salvataggio delle impostazioni.',
        icon: <X size={24} color="#F44336" />
      });
      setShowModal(true);
    } finally {
      setSaving(false);
    }
  }, []);

  const handleToggleNotifications = useCallback(async (enabled: boolean) => {
    if (!settings) return;
    
    const newSettings = { ...settings, enabled };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const handleTogglePushNotifications = useCallback(async (enabled: boolean) => {
    if (!settings) return;

    if (enabled) {
      // Request permission first
      const granted = await notificationService.requestPushPermission();
      if (!granted) {
        setModalContent({
          title: 'Permesso Negato',
          message: 'Per ricevere notifiche push, abilita i permessi nelle impostazioni del browser.',
          icon: <BellOff size={24} color="#FF9800" />
        });
        setShowModal(true);
        return;
      }
    }

    const newSettings = { ...settings, pushEnabled: enabled };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const handleToggleReminderType = useCallback(async (type: keyof NotificationSettingsType, enabled: boolean) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [type]: enabled };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const handleTimeChange = useCallback(async (time: string) => {
    if (!settings) return;
    
    const newSettings = { ...settings, preferredTime: time };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const handleQuietHoursToggle = useCallback(async (enabled: boolean) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      quietHours: { ...settings.quietHours, enabled }
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const handleQuietHoursChange = useCallback(async (start: string, end: string) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      quietHours: { ...settings.quietHours, start, end }
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const getUnreadCount = useCallback(() => {
    return notificationService.getUnreadCount();
  }, []);

  const getPendingCount = useCallback(() => {
    return notificationService.getPendingCount();
  }, []);

  if (loading || !settings) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Impostazioni Notifiche</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#625B71" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bell size={24} color="#6750A4" />
            <Text style={styles.title}>Notifiche</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#625B71" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getUnreadCount()}</Text>
              <Text style={styles.statLabel}>Non lette</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getPendingCount()}</Text>
              <Text style={styles.statLabel}>In programma</Text>
            </View>
          </View>

          {/* Main Toggle */}
          <View style={styles.section}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: settings.enabled ? '#E8F5E8' : '#FFEBEE' }]}>
                  {settings.enabled ? (
                    <Bell size={20} color="#4CAF50" />
                  ) : (
                    <BellOff size={20} color="#F44336" />
                  )}
                </View>
                <View>
                  <Text style={styles.settingTitle}>Abilita Notifiche</Text>
                </View>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#E7E0EC', true: '#E8DEF8' }}
                thumbColor={settings.enabled ? '#6750A4' : '#79747E'}
                disabled={saving}
              />
            </View>
          </View>

          {settings.enabled && (
            <>
              {/* Push Notifications */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifiche Push</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: '#E3F2FD' }]}>
                      <Smartphone size={20} color="#1565C0" />
                    </View>
                    <View>
                      <Text style={styles.settingTitle}>Notifiche Browser</Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.pushEnabled}
                    onValueChange={handleTogglePushNotifications}
                    trackColor={{ false: '#E7E0EC', true: '#E8DEF8' }}
                    thumbColor={settings.pushEnabled ? '#6750A4' : '#79747E'}
                    disabled={saving}
                  />
                </View>
              </View>

              {/* Reminder Types */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tipi di Promemoria</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingTitle}>Check-in (24h prima)</Text>
                  </View>
                  <Switch
                    value={settings.checkInReminder}
                    onValueChange={(value) => handleToggleReminderType('checkInReminder', value)}
                    trackColor={{ false: '#E7E0EC', true: '#E8DEF8' }}
                    thumbColor={settings.checkInReminder ? '#6750A4' : '#79747E'}
                    disabled={saving}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingTitle}>Check-out (24h prima)</Text>
                  </View>
                  <Switch
                    value={settings.checkOutReminder}
                    onValueChange={(value) => handleToggleReminderType('checkOutReminder', value)}
                    trackColor={{ false: '#E7E0EC', true: '#E8DEF8' }}
                    thumbColor={settings.checkOutReminder ? '#6750A4' : '#79747E'}
                    disabled={saving}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingTitle}>Valutazione (48h dopo)</Text>
                  </View>
                  <Switch
                    value={settings.ratingReminder}
                    onValueChange={(value) => handleToggleReminderType('ratingReminder', value)}
                    trackColor={{ false: '#E7E0EC', true: '#E8DEF8' }}
                    thumbColor={settings.ratingReminder ? '#6750A4' : '#79747E'}
                    disabled={saving}
                  />
                </View>
              </View>

              {/* Preferred Time */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Orario Preferito</Text>
                
                <View style={styles.timeCategoriesContainer}>
                  {TIME_CATEGORIES.map((category) => (
                    <View key={category.category} style={styles.timeCategory}>
                      <Text style={styles.timeCategoryTitle}>{category.category}</Text>
                      <View style={styles.timeGrid}>
                        {category.times.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.timeOption,
                              settings.preferredTime === option.value && styles.timeOptionSelected
                            ]}
                            onPress={() => handleTimeChange(option.value)}
                            disabled={saving}>
                            <Clock size={14} color={settings.preferredTime === option.value ? '#FFFFFF' : '#6750A4'} />
                            <Text style={[
                              styles.timeOptionText,
                              settings.preferredTime === option.value && styles.timeOptionTextSelected
                            ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Quiet Hours */}
              <View style={styles.section}>
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: '#F3E5F5' }]}>
                      <Moon size={20} color="#7B1FA2" />
                    </View>
                    <View>
                      <Text style={styles.settingTitle}>Ore Silenziose</Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.quietHours.enabled}
                    onValueChange={handleQuietHoursToggle}
                    trackColor={{ false: '#E7E0EC', true: '#E8DEF8' }}
                    thumbColor={settings.quietHours.enabled ? '#6750A4' : '#79747E'}
                    disabled={saving}
                  />
                </View>

                {settings.quietHours.enabled && (
                  <View style={styles.quietHoursGrid}>
                    {QUIET_HOURS_OPTIONS.map((option) => {
                      const isSelected = settings.quietHours.start === option.start && 
                                       settings.quietHours.end === option.end;
                      
                      return (
                        <TouchableOpacity
                          key={`${option.start}-${option.end}`}
                          style={[
                            styles.quietHoursOption,
                            isSelected && styles.quietHoursOptionSelected
                          ]}
                          onPress={() => handleQuietHoursChange(option.start, option.end)}
                          disabled={saving}>
                          <Text style={[
                            styles.quietHoursOptionText,
                            isSelected && styles.quietHoursOptionTextSelected
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      <InfoModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
        message={modalContent.message}
        icon={modalContent.icon}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxWidth: 450,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0EC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1F',
    marginLeft: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#625B71',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F7F2FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6750A4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#625B71',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#79747E',
    marginBottom: 16,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F2FA',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1B1F',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#79747E',
    lineHeight: 18,
  },
  timeCategoriesContainer: {
    gap: 16,
  },
  timeCategory: {
    marginBottom: 8,
  },
  timeCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6750A4',
    marginBottom: 8,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8DEF8',
    gap: 6,
  },
  timeOptionSelected: {
    backgroundColor: '#6750A4',
    borderColor: '#6750A4',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6750A4',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  quietHoursGrid: {
    marginTop: 12,
    gap: 8,
  },
  quietHoursOption: {
    backgroundColor: '#F7F2FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E8DEF8',
    alignItems: 'center',
  },
  quietHoursOptionSelected: {
    backgroundColor: '#6750A4',
    borderColor: '#6750A4',
  },
  quietHoursOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6750A4',
  },
  quietHoursOptionTextSelected: {
    color: '#FFFFFF',
  },
});