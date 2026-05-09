import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PanicButton from '../components/PanicButton';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Panic'>;

export default function PanicScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
    };

    if (Platform.OS === 'web') {
      if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        await doLogout();
      }
    } else {
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro de que deseas salir?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", style: "destructive", onPress: doLogout }
        ]
      );
    }
  };

  const handleConfirm = async () => {
    try {
      const alertData = {
        usuarioId: parseInt(user?.id ?? "0"),
        lat: -1.2665,
        lng: -78.6245
      };

      const BASE_URL = 'http://192.168.1.61:5233/api';

      await fetch(`${BASE_URL}/Alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertData)
      });

      navigation.navigate('Confirmation', {
        timestamp: new Date().toISOString(),
        userId: user?.id ?? '',
      });
    } catch (error) {
      console.error("Error sending panic alert:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {user?.name ?? 'Usuario'}</Text>
          <Text style={styles.faculty}>{user?.faculty ?? 'Universidad Técnica de Ambato'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={28} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <PanicButton onConfirm={handleConfirm} />
        <Text style={styles.instruction}>
          Mantén presionado 3 segundos{'\n'}para activar la alerta de emergencia
        </Text>
      </View>

      <Text style={styles.footer}>S.S.I.U. — UTA · Zona segura activa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  header: {
    gap: 4,
    flex: 1,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
  },
  greeting: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '600',
  },
  faculty: {
    color: '#475569',
    fontSize: 13,
  },
  center: {
    alignItems: 'center',
    gap: 36,
  },
  instruction: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    color: '#1e3a5f',
    fontSize: 11,
    textAlign: 'center',
  },
});
