import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { signalRService } from '../services/signalRService';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Confirmation'>;

export default function ConfirmationScreen({ navigation, route }: Props) {
  const { timestamp, userId } = route.params;
  const [assignedGuard, setAssignedGuard] = useState<string | null>(null);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Iniciar conexión SignalR
    signalRService.startConnection();

    // Escuchar cuando un guardia asume la alerta
    signalRService.onAlertAssumed((alertId, guardName) => {
      // En una app real filtraríamos por alertId
      setAssignedGuard(guardName);
    });

    signalRService.onAlertClosed(() => {
      navigation.navigate('Panic');
    });

    return () => {
      // No detenemos la conexión aquí por si el usuario vuelve
    };
  }, []);

  const formatted = new Date(timestamp).toLocaleTimeString('es-EC', {

    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.checkWrapper, { transform: [{ scale }], opacity }]}>
        <Text style={styles.checkIcon}>✓</Text>
      </Animated.View>

      <Text style={styles.title}>{assignedGuard ? 'Guardia en camino' : 'Alerta enviada'}</Text>
      
      {assignedGuard ? (
        <View style={styles.guardInfo}>
          <ActivityIndicator color="#22c55e" style={{ marginBottom: 10 }} />
          <Text style={styles.guardName}>{assignedGuard} está atendiendo tu llamado</Text>
          <Text style={styles.subtitle}>Mantén la calma y dirígete a un lugar seguro si es posible</Text>
        </View>
      ) : (
        <Text style={styles.subtitle}>Los guardias de tu zona han sido notificados</Text>
      )}

      <Text style={styles.timestamp}>Activada a las {formatted}</Text>

      <Pressable
        style={styles.cancelButton}
        onPress={() => navigation.navigate('Panic')}
        testID="btn-cancel"
      >
        <Text style={styles.cancelText}>{assignedGuard ? 'Finalizar emergencia' : 'Cancelar alerta'}</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  checkWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#14532d',
    borderWidth: 2,
    borderColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    color: '#22c55e',
    fontSize: 44,
    fontWeight: '700',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#22c55e',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  timestamp: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  cancelText: {
    color: '#64748b',
    fontSize: 14,
  },
  guardInfo: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  guardName: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
});

