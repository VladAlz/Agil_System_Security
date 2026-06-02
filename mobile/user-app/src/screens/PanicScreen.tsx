import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PanicButton from '../components/PanicButton';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../../App';

import { BASE_URL } from '../config/api';
import { notifyLocal } from '../services/notificationService';
import * as Location from 'expo-location';

type Props = NativeStackScreenProps<RootStackParamList, 'Panic'>;

// ── Modal personalizado para mensajes ───────────────────────────
function AppModal({ visible, icon, iconColor, title, message, buttons, onClose }: {
  visible: boolean;
  icon: string;
  iconColor: string;
  title: string;
  message: string;
  buttons: { text: string; color: string; onPress: () => void }[];
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={[modalStyles.iconCircle, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon as any} size={32} color={iconColor} />
          </View>
          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>
          <View style={modalStyles.buttonRow}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[modalStyles.button, { backgroundColor: btn.color }]}
                onPress={btn.onPress}
              >
                <Text style={modalStyles.buttonText}>{btn.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PanicScreen({ navigation }: Props) {
  const { user, token, logout } = useAuth();
  const [modalInfo, setModalInfo] = useState<{
    visible: boolean; icon: string; iconColor: string;
    title: string; message: string;
    buttons: { text: string; color: string; onPress: () => void }[];
  }>({ visible: false, icon: 'alert-circle', iconColor: '#ef4444', title: '', message: '', buttons: [] });

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Evita que se emitan alertas duplicadas si se dispara varias veces seguidas
  const sendingRef = useRef(false);

  // Pide el permiso de ubicación apenas se entra (justo después del login),
  // no durante la presión del botón de pánico.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Location.requestForegroundPermissionsAsync().catch(() => {});
    }
  }, []);

  const showAppModal = (icon: string, iconColor: string, title: string, message: string, buttons?: { text: string; color: string; onPress: () => void }[]) => {
    setModalInfo({
      visible: true, icon, iconColor, title, message,
      buttons: buttons || [{ text: 'Entendido', color: '#3b82f6', onPress: () => setModalInfo(prev => ({ ...prev, visible: false })) }],
    });
  };

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const handleConfirm = async () => {
    if (sendingRef.current) return;   // ya hay un envío en curso → no duplicar
    sendingRef.current = true;
    try {
      // GPS es OBLIGATORIO — no se puede emitir alerta sin ubicación.
      // Web → navigator.geolocation · Nativo (APK) → expo-location.
      let currentLat: number;
      let currentLng: number;
      try {
        if (Platform.OS === 'web') {
          if (typeof navigator === 'undefined' || !navigator.geolocation) {
            showAppModal(
              'location-outline', '#f59e0b',
              'GPS No Disponible',
              'Tu navegador no soporta geolocalización. No se puede emitir la alerta sin conocer tu ubicación.'
            );
            return;
          }
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          currentLat = pos.coords.latitude;
          currentLng = pos.coords.longitude;
        } else {
          // App nativa: pedir permiso y leer GPS con expo-location
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            showAppModal(
              'location-outline', '#ef4444',
              'Permiso de Ubicación',
              'Para emitir la alerta necesitamos tu ubicación exacta. Activa el permiso de ubicación e inténtalo de nuevo.',
              [{
                text: 'Reintentar',
                color: '#3b82f6',
                onPress: () => { setModalInfo(prev => ({ ...prev, visible: false })); handleConfirm(); },
              }]
            );
            return;
          }
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          currentLat = loc.coords.latitude;
          currentLng = loc.coords.longitude;
        }
      } catch (geoErr: any) {
        showAppModal(
          'location-outline', '#ef4444',
          'Ubicación Requerida',
          'No pudimos obtener tu ubicación. Asegúrate de tener el GPS activado e inténtalo de nuevo.',
          [{
            text: 'Reintentar',
            color: '#3b82f6',
            onPress: () => { setModalInfo(prev => ({ ...prev, visible: false })); handleConfirm(); },
          }]
        );
        return;
      }

      const alertData = {
        usuarioId: parseInt(user?.id ?? "0"),
        lat: currentLat,
        lng: currentLng
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

      // HU-13: notificación local en el dispositivo confirmando el despacho
      notifyLocal('🚨 Alerta enviada', 'Tu alerta de pánico fue despachada. Los guardias fueron notificados.');

      navigation.navigate('Confirmation', {
        timestamp: new Date().toISOString(),
        userId: user?.id ?? '',
      });
    } catch (error: any) {
      console.error("Error sending panic alert:", error);
      showAppModal(
        'warning-outline', '#ef4444',
        'Error al Enviar Alerta',
        `No se pudo enviar la alerta. Verifica tu conexión o vuelve a iniciar sesión.\n\nDetalle: ${error.message}`
      );
    } finally {
      sendingRef.current = false;
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

      {/* Modal de mensajes personalizados */}
      <AppModal
        visible={modalInfo.visible}
        icon={modalInfo.icon}
        iconColor={modalInfo.iconColor}
        title={modalInfo.title}
        message={modalInfo.message}
        buttons={modalInfo.buttons}
        onClose={() => setModalInfo(prev => ({ ...prev, visible: false }))}
      />

      {/* Modal de logout personalizado */}
      <AppModal
        visible={showLogoutModal}
        icon="log-out-outline"
        iconColor="#f59e0b"
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas salir de tu cuenta?"
        buttons={[
          { text: 'Cancelar', color: '#475569', onPress: () => setShowLogoutModal(false) },
          { text: 'Salir', color: '#ef4444', onPress: confirmLogout },
        ]}
        onClose={() => setShowLogoutModal(false)}
      />
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});

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
