import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PanicButton from '../components/PanicButton';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../../App';

import { BASE_URL } from '../config/api';

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
    try {
      // GPS es OBLIGATORIO — no se puede emitir alerta sin ubicación
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        showAppModal(
          'location-outline', '#f59e0b',
          'GPS No Disponible',
          'Tu dispositivo no soporta geolocalización. No se puede emitir la alerta sin conocer tu ubicación.'
        );
        return;
      }

      let pos: GeolocationPosition;
      try {
        pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
          });
        });
      } catch (geoErr: any) {
        // El usuario denegó los permisos o el GPS falló
        showAppModal(
          'location-outline', '#ef4444',
          'Ubicación Requerida',
          'Para emitir una alerta de emergencia necesitamos tu ubicación exacta para que los guardias puedan encontrarte. Por favor, activa los permisos de ubicación en tu navegador e inténtalo de nuevo.',
          [{
            text: 'Reintentar',
            color: '#3b82f6',
            onPress: () => {
              setModalInfo(prev => ({ ...prev, visible: false }));
              handleConfirm(); // Reintentar
            },
          }]
        );
        return;
      }

      const currentLat = pos.coords.latitude;
      const currentLng = pos.coords.longitude;

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
