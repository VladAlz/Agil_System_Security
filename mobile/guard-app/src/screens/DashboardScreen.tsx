import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { guardService } from '../services/guardService';
import { apiFetch, extractItems } from '../services/apiClient';
import * as Location from 'expo-location';

import {
  NormalizedAlertStatusEvent,
  SignalRAlert,
  useSignalR,
} from '../hooks/useSignalR';


import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';

import {
  MapPin,
  ChevronRight,
  Navigation,
  LogOut,
  ShieldCheck,
  ClipboardList,
  History,
} from 'lucide-react-native';

import { LeafletMap } from '../components/LeafletMap';


interface Alert {
  id: string;
  user: string;
  location: string;
  time: string;
  type: string;
  severity: string;
  estado?: string;
  guardiaAsignadoId?: number;
  guardiaAsignadoNombre?: string;
  lat?: number;
  lng?: number;
  coords: { x: number; y: number };
}

const getLatLng = (x: number, y: number): { lat: number; lng: number } => {
  return {
    lat: -1.267584 - ((y - 50) / 100) * 0.005,
    lng: -78.624025 + ((x - 50) / 100) * 0.005,
  };
};

const mapAlertFromApi = (bAlert: any): Alert => ({
  id: String(bAlert.id ?? ''),
  user: bAlert.nombreUsuario || bAlert.usuario?.nombre || 'Desconocido',
  location:
    bAlert.nombreZona || bAlert.zona?.nombre || 'Ubicación desconocida',
  time: bAlert.fechaHora
    ? new Date(bAlert.fechaHora).toLocaleTimeString()
    : 'Ahora',
  type: 'Pánico',
  severity: bAlert.estado === 'Activa' ? 'High' : 'Medium',
  estado: bAlert.estado,
  guardiaAsignadoId: bAlert.guardiaAsignadoId,
  guardiaAsignadoNombre: bAlert.guardiaAsignadoNombre,
  lat: bAlert.lat,
  lng: bAlert.lng,
  coords: { x: bAlert.coords?.x || 50, y: bAlert.coords?.y || 50 },
});

export default function DashboardScreen({ navigation }: any) {
  const { guard, logout, updateGuardStatus } = useAuth();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [guardLocation, setGuardLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -1.267584, lng: -78.624025 });
  const [isLoading, setIsLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [isAlertsHovered, setIsAlertsHovered] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const estadoActual = guard?.estado || 'Descansando';
  const estaDisponible = estadoActual === 'En Servicio';

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await apiFetch<any>('/Alerts');

      const alertsArray = extractItems<any>(data);

      const activeAlerts = alertsArray.filter((item: any) =>
        ['Activa', 'Asumida', 'En Camino'].includes(item.estado)
      );

      const mappedData: Alert[] = activeAlerts.map(mapAlertFromApi);

      setAlerts(mappedData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAlertCreated = useCallback(
    (bAlert: SignalRAlert) => {
      const mapped = mapAlertFromApi(bAlert);

      setAlerts((prev) => {
        const alreadyExists = prev.some((item) => item.id === mapped.id);

        if (alreadyExists) {
          return prev;
        }

        return [mapped, ...prev];
      });

      navigation.navigate('AlertDetail', {
        alertId: mapped.id,
      });
    },
    [navigation]
  );

  const handleAlertUpdated = useCallback(
    (event: NormalizedAlertStatusEvent) => {
      if (!event.alertId) return;

      if (
        event.estado === 'Resuelta' ||
        event.estado === 'Cerrada' ||
        event.estado === 'Cancelada'
      ) {
        setAlerts((prevAlerts) =>
          prevAlerts.filter(
            (item) => String(item.id) !== String(event.alertId)
          )
        );
        return;
      }

      setAlerts((prevAlerts) =>
        prevAlerts.map((item) =>
          String(item.id) === String(event.alertId)
            ? {
                ...item,
                estado: event.estado || item.estado,
                guardiaAsignadoId: event.guardId ?? item.guardiaAsignadoId,
                guardiaAsignadoNombre:
                  event.guardName ?? item.guardiaAsignadoNombre,
              }
            : item
        )
      );
    },
    []
  );

  const handleAlertRemoved = useCallback((alertId: number | string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.filter((item) => String(item.id) !== String(alertId))
    );
  }, []);

  const { isConnected, connectionStatus, connection } = useSignalR({
    zonaId: guard?.zonaId,
    onAlertCreated: handleAlertCreated,
    onAlertUpdated: handleAlertUpdated,
    onAlertRemoved: handleAlertRemoved,
    onReconnect: fetchAlerts,
  });

  const showOfflineBanner =
    connectionStatus === 'reconnecting' || connectionStatus === 'disconnected';

  const offlineMessage =
    connectionStatus === 'reconnecting'
     ? 'Sin conexión — reconectando...'
     : 'Sin conexión con el servidor';

  // Guard tracking logic
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      if (!guard || !isConnected || !connection) return;

      const fallbackLat = -1.267584 + (Math.random() * 0.002 - 0.001);
      const fallbackLng = -78.624025 + (Math.random() * 0.002 - 0.001);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permiso de ubicación denegado. Usando ubicación simulada.');
        setGuardLocation({lat: fallbackLat, lng: fallbackLng});
        connection.invoke('UpdateGuardLocation', guard.nombre, guard.zonaId || 0, fallbackLat, fallbackLng).catch(console.error);
        return; // We can't watch position if denied
      }

      try {
        const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const lat = initialLoc.coords.latitude;
        const lng = initialLoc.coords.longitude;
        setGuardLocation({lat, lng});
        connection.invoke('UpdateGuardLocation', guard.nombre, guard.zonaId || 0, lat, lng).catch(console.error);
      } catch (err) {
        console.warn("Could not get initial location, using fallback", err);
        setGuardLocation({lat: fallbackLat, lng: fallbackLng});
        connection.invoke('UpdateGuardLocation', guard.nombre, guard.zonaId || 0, fallbackLat, fallbackLng).catch(console.error);
      }

      try {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (location) => {
            const lat = location.coords.latitude;
            const lng = location.coords.longitude;
            setGuardLocation({lat, lng});
            connection.invoke('UpdateGuardLocation', guard.nombre, guard.zonaId || 0, lat, lng).catch(console.error);
          }
        );
      } catch (err) {
        console.warn("Watch position failed", err);
      }
    };

    if (isTracking) {
      startTracking();
    } else {
      setGuardLocation(null);
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [guard, isConnected, connection, isTracking]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleToggleStatus = async () => {
    if (!guard?.guardId) {
      alert('Este usuario no tiene registro de guardia asignado.');
      return;
    }

    const estadoAnterior = estadoActual;
    const nuevoEstado =
      estadoActual === 'En Servicio' ? 'Descansando' : 'En Servicio';

    setChangingStatus(true);

    // Optimistic update
    updateGuardStatus(nuevoEstado);

    try {
      const data = await guardService.toggleStatus(guard.guardId, nuevoEstado);

      updateGuardStatus(data.estado || nuevoEstado);
    } catch (error: any) {
      // Revertir si falla
      updateGuardStatus(estadoAnterior);
      alert(error.message || 'Error al actualizar el estado');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const mapMarkers = alerts.map((a: Alert) => ({
    id: a.id,
    lat: a.lat ?? (a.coords ? getLatLng(a.coords.x, a.coords.y).lat : -1.2675),
    lng: a.lng ?? (a.coords ? getLatLng(a.coords.x, a.coords.y).lng : -78.6240),
    title: a.user,
    severity: a.severity,
  }));

  if (guardLocation) {
    mapMarkers.push({
      id: 'guard-self',
      lat: guardLocation.lat,
      lng: guardLocation.lng,
      title: 'Mi Ubicación',
      severity: 'guard',
    });
  }

  const renderItem = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={() => {
        const lat = item.lat ?? (item.coords ? getLatLng(item.coords.x, item.coords.y).lat : -1.267584);
        const lng = item.lng ?? (item.coords ? getLatLng(item.coords.x, item.coords.y).lng : -78.624025);
        setMapCenter({ lat, lng });
      }}
    >
      <View
        style={[
          styles.severityBar,
          {
            backgroundColor:
              item.severity === 'High' ? '#ef4444' : '#f59e0b',
          },
        ]}
      />

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.alertType}>{item.estado || item.type}</Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={14} color="#94a3b8" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={{ padding: 10 }}
        onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
      >
        <ChevronRight size={20} color="#cbd5e1" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root}>
      {showOfflineBanner && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>{offlineMessage}</Text>
        </View>
      )}

      <View style={styles.container}>
        {/* Panel 1/5 */}
        <View style={styles.leftPanel}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Panel de Control</Text>
            <Text style={styles.subtitle}>Guardia: {guard?.nombre || 'Guardia'}</Text>
            <View style={styles.zoneRow}>
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneText}>{guard?.zonaNombre || 'Zona no asignada'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: estaDisponible ? '#16a34a' : '#475569' }]}>
                <ShieldCheck size={13} color="#fff" />
                <Text style={styles.statusText}>{estadoActual}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: estaDisponible ? '#475569' : '#16a34a' }]}
            onPress={handleToggleStatus}
            disabled={changingStatus}
          >
            {changingStatus ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.statusButtonText}>
                {estaDisponible ? 'Cambiar a Descansando' : 'Cambiar a En Servicio'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={16} color="#f8fafc" />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mapButton} onPress={() => navigation.navigate('Map')}>
              <MapPin size={16} color="#f8fafc" />
              <Text style={styles.mapButtonText}>Ver Mapa Local</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapButton, { backgroundColor: isTracking ? '#ef4444' : '#2563eb' }]}
              onPress={() => setIsTracking(!isTracking)}
            >
              <Navigation size={16} color="#f8fafc" />
              <Text style={styles.mapButtonText}>{isTracking ? 'Detener GPS' : 'Activar GPS'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportButton} onPress={() => navigation.navigate('Report')}>
              <ClipboardList size={16} color="#f8fafc" />
              <Text style={styles.mapButtonText}>Generar Reporte</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('AlertHistory')}>
              <History size={16} color="#f8fafc" />
              <Text style={styles.mapButtonText}>Historial Turnos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.miniStatContainer}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>{alerts.length}</Text>
              <Text style={styles.miniStatLabel}>Alertas Activas</Text>
            </View>
          </View>
        </View>

        {/* Mapa 4/5 */}
        <View style={styles.rightPanel}>
          <View style={styles.mapContainer}>
            <LeafletMap centerLat={mapCenter.lat} centerLng={mapCenter.lng} markers={mapMarkers} />
            <View style={styles.mapBadge}>
              <Navigation size={14} color="#fff" />
              <Text style={styles.mapBadgeText}>
                {isConnected ? 'SignalR Activo' : 'Sin conexión'} · {guard?.zonaNombre || 'Sin zona'}
              </Text>
            </View>
          </View>

          {/* Alertas Sobrepuestas (Transparente + Hover) */}
          <View
            style={[styles.alertsOverlay, { opacity: isAlertsHovered ? 0.98 : 0.6 }]}
            {...{
              onMouseEnter: () => setIsAlertsHovered(true),
              onMouseLeave: () => setIsAlertsHovered(false)
            } as any}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alertas Recientes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AlertList')}>
                <Text style={styles.viewAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={alerts}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay alertas activas.</Text>}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 30,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  rightPanel: {
    flex: 4,
    position: 'relative',
    backgroundColor: '#000',
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  mapBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 5,
  },
  mapBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerInfo: {
    marginBottom: 24,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  zoneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  zoneBadge: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  zoneText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  statusButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  headerActions: {
    gap: 12,
  },
  logoutButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  mapButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapButtonText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  miniStatContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  miniStat: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  miniStatNum: {
    color: '#ef4444',
    fontSize: 32,
    fontWeight: '900',
  },
  miniStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  alertsOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 360,
    maxHeight: '90%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    // @ts-ignore
    transition: 'opacity 0.3s ease',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  viewAllText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  alertCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  severityBar: {
    width: 6,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  alertType: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    backgroundColor: '#ef444415',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
  offlineBanner: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  offlineBannerText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});