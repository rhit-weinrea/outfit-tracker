import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, ActivityIndicator, View } from 'react-native';

import { AppProvider, useApp } from './src/context/AppContext';
import ClosetScreen from './src/screens/ClosetScreen';
import OutfitsScreen from './src/screens/OutfitsScreen';
import SuggestionsScreen from './src/screens/SuggestionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Closet: '👗',
  Outfits: '✨',
  Suggestions: '🤖',
  Settings: '⚙️',
};

function TabIcon({ name, focused }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{TAB_ICONS[name]}</Text>
  );
}

function AppTabs() {
  const { loading } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#2D6A4F',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#2D6A4F' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      })}
    >
      <Tab.Screen
        name="Closet"
        component={ClosetScreen}
        options={{ title: 'My Closet' }}
      />
      <Tab.Screen
        name="Outfits"
        component={OutfitsScreen}
        options={{ title: 'Outfits' }}
      />
      <Tab.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{ title: 'AI Stylist' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Preferences' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppTabs />
      </NavigationContainer>
    </AppProvider>
  );
}
