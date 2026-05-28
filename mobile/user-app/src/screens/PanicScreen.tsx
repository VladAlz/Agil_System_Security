import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PanicButton from '../components/PanicButton';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../../App';

import { BASE_URL } from '../config/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Panic'>;

export default function PanicScreen({ navigation }: Props) {
  const { user, token, logout } = useAuth();

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

      const alertResponse = await fetch(`${BASE_URL}/Alerts`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(alertData)
      });

      if (!alertResponse.ok) {
        const errText = await alertResponse.text();
        throw new Error(`Error del servidor: ${alertResponse.status} ${errText}`);
      }

      navigation.navigate('Confirmation', {
        timestamp: new Date().toISOString(),
        userId: user?.id ?? '',
      });
    } catch (error: any) {
      console.error("Error sending panic alert:", error);
      if (Platform.OS === 'web') {
        window.alert(`No se pudo enviar la alerta. Error: ${error.message}`);
      } else {
        Alert.alert('Error', `No se pudo enviar la alerta. Verifica tu conexión o vuelve a iniciar sesión con una cuenta válida.`);
      }
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

      {/* Botón Grupo de Confianza — HU-10 */}
      <TouchableOpacity
        style={styles.trustGroupBtn}
        onPress={() => navigation.navigate('TrustGroup')}
      >
        <Ionicons name="people-outline" size={20} color="#60a5fa" />
        <Text style={styles.trustGroupText}>Grupo de Confianza</Text>
        <Ionicons name="chevron-forward" size={16} color="#334155" />
      </TouchableOpacity>

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
  // ── Grupo de Confianza
  trustGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    marginBottom: 12,
  },
  trustGroupText: {
    flex: 1,
    color: '#93c5fd',
    fontSize: 15,
    fontWeight: '600',
  },
});
