import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PanicButton from '../components/PanicButton';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Panic'>;

export default function PanicScreen({ navigation }: Props) {
  const { user } = useAuth();

  const handleConfirm = () => {
    navigation.navigate('Confirmation', {
      timestamp: new Date().toISOString(),
      userId: user?.id ?? '',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name ?? 'Usuario'}</Text>
        <Text style={styles.faculty}>{user?.faculty ?? 'Universidad Técnica de Ambato'}</Text>
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
  header: {
    gap: 4,
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
