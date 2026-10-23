import { Tabs } from 'expo-router';
import { Chrome as Home, Plus, Search, Settings } from 'lucide-react-native';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const paddingBottom = Math.max(insets.bottom, 8);
  const paddingTop = isWeb ? 8 : width <= 320 ? 4 : width <= 375 ? 6 : width <= 390 ? 8 : width <= 430 ? 10 : width <= 500 ? 12 : 16;
  const paddingHorizontal = width <= 320 ? 2 : width <= 375 ? 4 : width <= 390 ? 6 : width <= 430 ? 8 : width <= 500 ? 10 : 16;
  const iconSize = isWeb ? (width <= 375 ? 24 : 28) : width <= 320 ? 18 : width <= 375 ? 28 : width <= 390 ? 32 : width <= 430 ? 34 : width <= 500 ? 36 : 40;
  const itemHeight = 60;
  const barHeight = itemHeight + paddingTop + paddingBottom + 1;

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
          height: barHeight,
          paddingTop,
          paddingBottom,
          paddingHorizontal,
          position: 'relative',
          flexShrink: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
          minHeight: itemHeight,
        },
        tabBarIconStyle: {
          width: iconSize,
          height: iconSize,
          marginBottom: 0,
          marginTop: 0,
        },
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ color }) => <Home size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarAccessibilityLabel: 'Cerca',
          tabBarIcon: ({ color }) => <Search size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarAccessibilityLabel: 'Aggiungi camera',
          tabBarIcon: ({ color }) => <Plus size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarAccessibilityLabel: 'Impostazioni',
          tabBarIcon: ({ color }) => <Settings size={iconSize} color={color} />,
        }}
      />
    </Tabs>
  );
}
