import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, ActivityIndicator, View, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import CormorantGaramond_400Regular from '@expo-google-fonts/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf';
import CormorantGaramond_600SemiBold from '@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf';
import CormorantGaramond_700Bold from '@expo-google-fonts/cormorant-garamond/700Bold/CormorantGaramond_700Bold.ttf';

import { AppProvider, useApp } from './src/context/AppContext';
import { isOnboardingComplete } from './src/utils/storage';
import ClosetScreen from './src/screens/ClosetScreen';
import OutfitsScreen from './src/screens/OutfitsScreen';
import SuggestionsScreen from './src/screens/SuggestionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingModal from './src/screens/OnboardingModal';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Closet: '▣',
  Outfits: '◈',
  Suggestions: '◎',
  Settings: '☰',
};

function TabIcon({ name, focused }) {
  return (
    <Text style={{ fontSize: 17, opacity: focused ? 1 : 0.45, color: focused ? '#2D6A4F' : '#999' }}>
      {TAB_ICONS[name]}
    </Text>
  );
}

function AppTabs() {
  const { loading } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      isOnboardingComplete().then((done) => {
        setShowOnboarding(!done);
        setOnboardingChecked(true);
      });
    }
  }, [loading]);

  if (loading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9F7' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <>
    <OnboardingModal visible={showOnboarding} onComplete={() => setShowOnboarding(false)} />
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#2D6A4F',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EBEBEB',
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 84 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        headerStyle: {
          backgroundColor: '#FAF9F7',
          borderBottomWidth: 1,
          borderBottomColor: '#EBEBEB',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#1C1C1C',
        headerTitleStyle: {
          fontFamily: 'CormorantGaramond_700Bold',
          fontSize: 22,
          letterSpacing: 0.5,
        },
      })}
    >
      <Tab.Screen name="Closet" component={ClosetScreen} options={{ title: 'My Closet' }} />
      <Tab.Screen name="Outfits" component={OutfitsScreen} options={{ title: 'Outfits' }} />
      <Tab.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: 'AI Stylist' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Preferences' }} />
    </Tab.Navigator>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9F7' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppTabs />
      </NavigationContainer>
    </AppProvider>
  );
}
