import { Tabs } from 'expo-router';
import { Chrome as Home, Plus, Search, Settings } from 'lucide-react-native';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Calcolo responsive basato su dimensioni reali dello schermo
  const getResponsiveConfig = () => {
    const { width, height } = screenData;
    const safeBottom = insets.bottom || 0;
    
    // Calcolo base altezza tab bar
    const baseHeight = Platform.OS === 'ios' ? 50 : 60;
    const totalHeight = baseHeight + safeBottom + 16; // 16px padding extra
    
    // Configurazioni responsive basate su breakpoint reali
    if (width <= 320) {
      // iPhone SE (1st gen), dispositivi molto piccoli
      return {
        height: totalHeight,
        iconSize: 18,
        fontSize: 10,
        paddingVertical: 4,
        paddingHorizontal: 2,
        labelMarginTop: 2,
      };
    } else if (width <= 375) {
      // iPhone 12 mini, iPhone SE (2nd/3rd gen)
      return {
        height: totalHeight,
        iconSize: 28,
        fontSize: 11,
        paddingVertical: 6,
        paddingHorizontal: 4,
        labelMarginTop: 3,
      };
    } else if (width <= 390) {
      // iPhone 12, iPhone 13
      return {
        height: totalHeight,
        iconSize: 32,
        fontSize: 12,
        paddingVertical: 8,
        paddingHorizontal: 6,
        labelMarginTop: 4,
      };
    } else if (width <= 430) {
      // iPhone 12 Pro Max, iPhone 13 Pro Max, iPhone 14 Plus, iPhone 15 Plus
      return {
        height: totalHeight,
        iconSize: 34,
        fontSize: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        labelMarginTop: 4,
      };
    } else if (width <= 500) {
      // Telefoni Android grandi, iPhone 16 Pro Max
      return {
        height: totalHeight,
        iconSize: 36,
        fontSize: 13,
        paddingVertical: 12,
        paddingHorizontal: 10,
        labelMarginTop: 5,
      };
    } else {
      // Tablet e dispositivi molto grandi
      return {
        height: totalHeight + 20,
        iconSize: 40,
        fontSize: 14,
        paddingVertical: 16,
        paddingHorizontal: 16,
        labelMarginTop: 6,
      };
    }
  };

  const config = getResponsiveConfig();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#6750A4',
        tabBarInactiveTintColor: '#79747E',
        tabBarStyle: {
          backgroundColor: '#FEF7FF',
          borderTopColor: '#E7E0EC',
          borderTopWidth: 1,
          height: config.height,
          paddingTop: config.paddingVertical,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: config.paddingHorizontal,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          // Forza la distribuzione uniforme
          justifyContent: 'space-around',
          alignItems: 'center',
          flexDirection: 'row',
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
          minHeight: 56,
          minHeight: 60, // Minimo per accessibilità touch
          maxWidth: (screenData.width - (config.paddingHorizontal * 2)) / 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
          marginTop: 0,
        },
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Home size={config.iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color }) => (
            <Search size={config.iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ color }) => (
            <Plus size={config.iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => (
            <Settings size={config.iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}