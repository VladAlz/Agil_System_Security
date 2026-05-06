import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';

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
    // @ts-expect-error Types mismatch in React 19 with React Navigation
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
