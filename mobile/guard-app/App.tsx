import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';

export type GuardStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  AlertDetail: { alertId: string };
};

const Stack = createNativeStackNavigator<GuardStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
      </Stack.Navigator>

      <StatusBar style="light" />
    </NavigationContainer>
  );
}