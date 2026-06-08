import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert as NativeAlert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ApiError } from '../services/apiClient';

import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  MapPin,
  Navigation,
  Shield,
  UserRound,
  XCircle,
} from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { LeafletMap } from '../components/LeafletMap';
import { alertService, AlertDetail } from '../services/alertService';

function formatDate(fecha?: string) {
  if (!fecha) return 'Fecha no disponible';

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return date.toLocaleString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AlertDetailScreen({ route, navigation }: any) {
  const { alertId } = route.params;

  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');

  const loadAlert = async () => {
    try {
      setError(null);
      const data = await alertService.getById(alertId);
      setAlert(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la alerta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlert();
  }, [alertId]);

  const { guard } = useAuth();

  const handleAssumeCase = async () => {
    if (!alert || !guard?.guardId) return;

    setUpdatingStatus(true);

    try {
      const assumedAlert = await alertService.assumeAlert(alert.id, guard.guardId);
      setAlert(assumedAlert);

      NativeAlert.alert(
        'Caso asumido',
        'Has asumido correctamente esta alerta.'
      );
    } catch (err: any) {
      console.error('Error asumiendo alerta:', err);

      const isAlreadyAssumedError =
        err instanceof ApiError &&
        (err.status === 409 ||
          (err.status === 400 &&
            typeof err.message === 'string' &&
            err.message.includes('No se puede asumir una alerta')));

      if (isAlreadyAssumedError) {
        setAlert((prevAlert) =>
          prevAlert
            ? {
                ...prevAlert,
                estado: 'Asumida',
              }
            : prevAlert
        );

        NativeAlert.alert(
          'Caso ya asumido',
          'Este caso ya fue asumido por otro guardia.'
        );

        return;
      }

      NativeAlert.alert(
        'Error',
        err.message || 'No se pudo asumir el caso. Intenta nuevamente.'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─── BUG FIX HU-09: "Ir en Camino" debe llamar SOLO a enRouteAlert ─────────
  // Antes llamaba a handleAssumeCase que hacía assume+enRoute en un solo paso,
  // lo que rompía el flujo Asumida → En Camino porque assume ya había ocurrido.
  const handleEnRoute = async () => {
    if (!alert) return;

    setUpdatingStatus(true);

    try {
      // Transición: Asumida → En Camino
      const updatedAlert = await alertService.enRouteAlert(alert.id);
      setAlert(updatedAlert);
    } catch (err: any) {
      alertMessage(err.message || 'No se pudo marcar como "En Camino"');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResolve = async () => {
    if (!alert) return;

    setUpdatingStatus(true);

    try {
      const updatedAlert = await alertService.arriveAlert(alert.id);
      setAlert(updatedAlert);
    } catch (err: any) {
      alertMessage(err.message || 'No se pudo marcar como resuelta');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleClose = async () => {
    if (!alert) return;

    if (!reportText.trim()) {
      NativeAlert.alert(
        'Reporte obligatorio',
        'Debes ingresar las observaciones finales sobre el incidente antes de poder cerrar el caso.'
      );
      return;
    }

    setUpdatingStatus(true);

    try {
      const updatedAlert = await alertService.closeAlert(alert.id, reportText.trim());
      setAlert(updatedAlert);
    } catch (err: any) {
      alertMessage(err.message || 'No se pudo cerrar la alerta');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const alertMessage = (message: string) => {
    NativeAlert.alert('Aviso', message);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#ef4444" size="large" />
          <Text style={styles.loadingText}>Cargando detalle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !alert) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft color="#fff" size={24} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Detalle de Alerta</Text>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centerContainer}>
          <AlertTriangle color="#ef4444" size={42} />
          <Text style={styles.errorTitle}>No se pudo cargar la alerta</Text>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={loadAlert}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const lat = alert.lat || -1.267584;
  const lng = alert.lng || -78.624025;

  // Usar campos desnormalizados del nuevo modelo de microservicios
  const userName = (alert as any).nombreUsuario || alert.usuario?.nombre || 'Usuario desconocido';
  const faculty  = (alert as any).facultad || alert.usuario?.facultad || 'Facultad no registrada';
  const zoneName = (alert as any).nombreZona || alert.zona?.nombre || 'Zona no asignada';
  const userEmail = (alert as any).correoUsuario || alert.usuario?.correo || 'No disponible';

  const currentStatus = alert.estado || 'Activa';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Detalle de Alerta</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mapContainer}>
          <LeafletMap
            centerLat={lat}
            centerLng={lng}
            markers={[
              {
                id: alert.id.toString(),
                lat,
                lng,
                title: userName,
                severity: 'High',
              },
            ]}
          />

          <View style={styles.locationOverlay}>
            <MapPin size={16} color="#ef4444" />
            <Text style={styles.locationText}>{zoneName}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <AlertTriangle size={15} color="#ef4444" />
              <Text style={styles.statusText}>{currentStatus}</Text>
            </View>

            <Text style={styles.alertCode}>#{alert.id}</Text>
          </View>

          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userRole}>Estudiante · {faculty}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Información de la alerta</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin size={18} color="#94a3b8" />
              <View>
                <Text style={styles.infoLabel}>Zona</Text>
                <Text style={styles.infoValue}>{zoneName}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Clock size={18} color="#94a3b8" />
              <View>
                <Text style={styles.infoLabel}>Fecha y hora</Text>
                <Text style={styles.infoValue}>{formatDate(alert.fechaHora)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Navigation size={18} color="#94a3b8" />
              <View>
                <Text style={styles.infoLabel}>Coordenadas</Text>
                <Text style={styles.infoValue}>
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <UserRound size={18} color="#94a3b8" />
              <View>
                <Text style={styles.infoLabel}>Correo del usuario</Text>
                <Text style={styles.infoValue}>
                  {userEmail}
                </Text>
              </View>
            </View>

            {(alert as any).observacionesGuardia && (
              <View style={[styles.infoRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' }]}>
                <ClipboardList size={18} color="#ef4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Reporte del Guardia</Text>
                  <Text style={[styles.infoValue, { color: '#cbd5e1' }]}>
                    {(alert as any).observacionesGuardia}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {currentStatus === 'Activa' && (
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={handleAssumeCase}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Shield size={20} color="#fff" />
                    <Text style={styles.primaryActionText}>Asumir Caso</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {currentStatus === 'Asumida' && (
              <TouchableOpacity
                style={[styles.primaryAction, { backgroundColor: '#2563eb' }]}
                onPress={handleEnRoute}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Navigation size={20} color="#fff" />
                    <Text style={styles.primaryActionText}>Ir en Camino</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {currentStatus === 'Asumida' && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Esta alerta ya fue asumida. Continúa con el estado “Ir en Camino” si el caso está asignado a tu guardia.
               </Text>
              </View>
            )}

            {currentStatus === 'En Camino' && (
              <TouchableOpacity
                style={[styles.primaryAction, { backgroundColor: '#16a34a' }]}
                onPress={handleResolve}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.primaryActionText}>Llegué — Resolver</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {currentStatus === 'Resuelta' && (
              <View style={styles.reportContainer}>
                <Text style={styles.sectionTitle}>Reporte Final (Obligatorio)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Detalla qué sucedió y cómo se resolvió la alerta..."
                  placeholderTextColor="#64748b"
                  value={reportText}
                  onChangeText={setReportText}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.primaryAction, { backgroundColor: '#9333ea', marginTop: 12 }]}
                  onPress={handleClose}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <XCircle size={20} color="#fff" />
                      <Text style={styles.primaryActionText}>Guardar y Cerrar Caso</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {currentStatus === 'Cerrada' && (
              <View style={styles.completedBox}>
                <CheckCircle size={20} color="#16a34a" />
                <Text style={styles.completedText}>Caso Cerrado</Text>
              </View>
            )}

            {currentStatus === 'Cancelada' && (
              <View style={styles.completedBox}>
                <XCircle size={20} color="#f59e0b" />
                <Text style={[styles.completedText, { color: '#f59e0b' }]}>Caso Cancelado</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryActionText}>Volver al panel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { ClipboardList } from 'lucide-react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    width: '100%',
    backgroundColor: '#000',
  },
  locationOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 10,
  },
  locationText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#ef444415',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  alertCode: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '900',
  },
  userRole: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 22,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    marginTop: 28,
    gap: 12,
  },
  primaryAction: {
    backgroundColor: '#ef4444',
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  primaryActionDisabled: {
    backgroundColor: '#16a34a',
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryAction: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  completedBox: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  completedText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '900',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 14,
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '900',
  },

  infoBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#78350f',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },

  infoText: {
    color: '#fef3c7',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 18,
  },

  reportContainer: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    color: '#fff',
    fontWeight: '700',
    textAlignVertical: 'top',
  },

});