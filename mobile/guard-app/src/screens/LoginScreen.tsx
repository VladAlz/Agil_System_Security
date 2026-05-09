import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>S.S.I.U.</Text>

        <Text style={styles.subtitle}>
          Acceso Guardia{'\n'}Universidad Técnica de Ambato
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 28,
    gap: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  error: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    backgroundColor: '#64748b',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});