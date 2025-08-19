import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { X, Info } from 'lucide-react-native';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: React.ReactNode;
  scrollable?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function InfoModal({ 
  visible, 
  onClose, 
  title, 
  message, 
  icon,
  scrollable = false
}: InfoModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    if (visible) {
      animateIn();
    } else {
      animateOut();
    }
  }, [visible, animateIn, animateOut]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleOverlayPress = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderContent = useCallback(() => {
    if (scrollable) {
      return (
        <ScrollView 
          style={styles.scrollableContent}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          contentContainerStyle={styles.scrollContentContainer}>
          <Text style={styles.scrollableMessage}>{message}</Text>
        </ScrollView>
      );
    }
    
    return (
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
      </View>
    );
  }, [scrollable, message]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            }
          ]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                scrollable ? styles.modalContainerScrollable : styles.modalContainer,
                {
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim }
                  ],
                }
              ]}>
              {/* Header con icona e titolo */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    {icon || <Info size={24} color="#6750A4" />}
                  </View>
                  <Text style={styles.title}>{title}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}>
                  <X size={20} color="#625B71" />
                </TouchableOpacity>
              </View>

              {/* Contenuto */}
              {renderContent()}

              {/* Footer con pulsante */}
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.okButton}
                  onPress={handleClose}
                  activeOpacity={0.8}>
                  <Text style={styles.okButtonText}>Ho capito</Text>
                </TouchableOpacity>
              </View>

              {/* Decorazione gradiente */}
              <View style={styles.gradientDecoration} />
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxWidth: Math.min(screenWidth - 48, 400),
    width: '100%',
    maxHeight: screenHeight * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  modalContainerScrollable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxWidth: Math.min(screenWidth - 48, 450),
    width: '100%',
    maxHeight: screenHeight * 0.85,
    minHeight: screenHeight * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(231, 224, 236, 0.5)',
    flexShrink: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1B1F',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(98, 91, 113, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flex: 1,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#49454F',
    textAlign: 'left',
  },
  scrollableContent: {
    flex: 1,
    paddingHorizontal: 24,
    maxHeight: screenHeight * 0.5,
  },
  scrollContentContainer: {
    paddingVertical: 20,
    paddingBottom: 24,
  },
  scrollableMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#49454F',
    textAlign: 'left',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(231, 224, 236, 0.3)',
  },
  okButton: {
    backgroundColor: '#6750A4',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#6750A4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  okButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gradientDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#6750A4',
    opacity: 0.8,
  },
});