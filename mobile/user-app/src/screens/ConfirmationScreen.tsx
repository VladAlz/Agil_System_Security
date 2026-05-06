import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Confirmation'>;

export default function ConfirmationScreen({ navigation, route }: Props) {
  const { timestamp } = route.params;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
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

      <Text style={styles.title}>Alerta enviada</Text>
      <Text style={styles.subtitle}>Los guardias de tu zona han sido notificados</Text>
      <Text style={styles.timestamp}>Activada a las {formatted}</Text>

      <Pressable
        style={styles.cancelButton}
        onPress={() => navigation.navigate('Panic')}
        testID="btn-cancel"
      >
        <Text style={styles.cancelText}>Cancelar alerta</Text>
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
});
