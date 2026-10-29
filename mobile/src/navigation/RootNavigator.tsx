import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, TrendingUp, ScanLine, MessageSquare, Droplets, History, Settings, CloudRain } from 'lucide-react-native';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { WeatherScreen } from '../screens/WeatherScreen';
import { YieldPredictionScreen } from '../screens/YieldPredictionScreen';
import { DiseaseDetectionScreen } from '../screens/DiseaseDetectionScreen';
import { AssistantChatScreen } from '../screens/AssistantChatScreen';
import { RecommendationsScreen } from '../screens/RecommendationsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { COLORS } from '../constants/theme';

import { useLanguage } from '../i18n/LanguageContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabNavigator() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('tabDashboard', 'Dashboard'),
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="WeatherTab"
        component={WeatherScreen}
        options={{
          tabBarLabel: t('tabWeather', 'Weather'),
          tabBarIcon: ({ color, size }) => <CloudRain size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="YieldTab"
        component={YieldPredictionScreen}
        options={{
          tabBarLabel: t('tabYield', 'Yield'),
          tabBarIcon: ({ color, size }) => <TrendingUp size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="DiseaseTab"
        component={DiseaseDetectionScreen}
        options={{
          tabBarLabel: t('tabDisease', 'Disease'),
          tabBarIcon: ({ color, size }) => <ScanLine size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="AssistantTab"
        component={AssistantChatScreen}
        options={{
          tabBarLabel: t('tabChat', 'AI Chat'),
          tabBarIcon: ({ color, size }) => <MessageSquare size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="RecommendationsTab"
        component={RecommendationsScreen}
        options={{
          tabBarLabel: t('tabSchedules', 'Schedules'),
          tabBarIcon: ({ color, size }) => <Droplets size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="Yield" component={YieldPredictionScreen} />
      <Stack.Screen name="Disease" component={DiseaseDetectionScreen} />
      <Stack.Screen name="Assistant" component={AssistantChatScreen} />
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
