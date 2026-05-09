import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

export type GuardStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  AlertDetail: { alertId: string };
};

const Stack = createNativeStackNavigator<GuardStackParamList>();

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator color="#ef4444" size="large" />
    </View>
  );
}

function AppNavigator() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>

      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}