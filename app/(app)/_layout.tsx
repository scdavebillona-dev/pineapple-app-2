import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Appearance, Platform, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CameraScreen from './camera';
import HomeScreen from './home';
import ProfileScreen from './profile';
import StorageScreen from './storage';

const Tab = createBottomTabNavigator();

export default function AppLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scheme = useColorScheme();
  const [isDark, setIsDark] = useState(scheme === 'dark');

  const toggleTheme = () => {
    const newScheme = isDark ? 'light' : 'dark';
    Appearance.setColorScheme(newScheme);
    setIsDark(!isDark);
  };

  // Let the tab bar grow naturally — only control padding so it clears Android gesture/button nav
  const bottomPad = Platform.OS === 'android'
    ? Math.max(insets.bottom, 28)   // gesture nav ≈ 28dp; 3-button nav insets.bottom may be 0
    : Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: isDark ? colors.border : '#F3F4F6',
          borderTopWidth: 1,
          paddingBottom: bottomPad,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? colors.border : '#F3F4F6',
        },
        headerTintColor: colors.text,
        headerTitle: () => (
          <Text style={{ fontFamily: 'Montserrat_700Bold', fontWeight: '700', fontSize: 19, color: colors.primary, letterSpacing: 0.3 }}>PineAI</Text>
        ),
        headerTitleAlign: 'center',
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = 'home';

          if (route.name === 'home') {
            iconName = 'dashboard';
          } else if (route.name === 'camera') {
            iconName = 'photo-camera';
          } else if (route.name === 'storage') {
            iconName = 'search';
          } else if (route.name === 'profile') {
            iconName = 'person';
          }

          return (
            <View
              style={{
                backgroundColor: focused ? colors.primaryMuted : 'transparent',
                borderRadius: 14,
                width: 50,
                height: 34,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name={iconName} size={24} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/camera')}
              style={{ marginLeft: 16, padding: 8 }}
            >
              <MaterialIcons name="document-scanner" size={22} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={toggleTheme}
              style={{ marginRight: 16, padding: 8 }}
            >
              <MaterialIcons
                name={isDark ? 'wb-sunny' : 'nightlight-round'}
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="camera"
        component={CameraScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Camera',
        }}
      />
      <Tab.Screen
        name="storage"
        component={StorageScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Storage',
        }}
      />
      <Tab.Screen
        name="profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Account',
        }}
      />
    </Tab.Navigator>
  );
}
