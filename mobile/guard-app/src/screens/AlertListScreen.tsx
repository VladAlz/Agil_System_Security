import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  UserRound,
} from 'lucide-react-native';

import { apiFetch, extractItems } from '../services/apiClient';
import {
  NormalizedAlertStatusEvent,
  SignalRAlert,
  useSignalR,
} from '../hooks/useSignalR';
import { useAuth } from '../context/AuthContext';


type AlertItem = {
  id: string;
  usuario: string;
  zona: string;
  tiempo: string;
  estado: string;
  tipo: string;
};

function formatTime(fecha?: string) {
  if (!fecha) return 'Ahora';

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return 'Ahora';
  }

  return date.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapAlertFromApi(item: any): AlertItem {
  return {
    id: item.id?.toString() || Math.random().toString(),
    usuario:
      item.nombreUsuario ||
      item.usuario?.nombre ||
      item.user?.nombre ||
      item.usuarioNombre ||
      'Usuario desconocido',
    zona:
      item.nombreZona ||
      item.zona?.nombre ||
      item.zone?.nombre ||
      item.zonaNombre ||
      'Zona no asignada',
    tiempo: formatTime(
      item.fechaHora ||
        item.fechaCreacion ||
        item.createdAt ||
        item.timestamp
    ),
    estado: item.estado || 'En espera',
    tipo: item.tipo || 'Pánico',
  };
}

export default function AlertListScreen({ navigation }: any) {
  const { guard } = useAuth();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

    const fetchAlerts = useCallback(async () => {
      try {
        const data = await apiFetch<any>('/Alerts');

        const alertsArray = extractItems<any>(data);

        const mappedAlerts: AlertItem[] = alertsArray.map(mapAlertFromApi);

        setAlerts(mappedAlerts);
      } catch (error) {
        console.error('Error cargando alertas:', error);
        setAlerts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

      const handleAlertCreated = useCallback((newAlert: SignalRAlert) => {
        const mappedAlert = mapAlertFromApi(newAlert);

        setAlerts((prevAlerts) => {
          const alreadyExists = prevAlerts.some(
            (item) => String(item.id) === String(mappedAlert.id)
          );

          if (alreadyExists) {
           return prevAlerts;
          }

          return [mappedAlert, ...prevAlerts];
        });
      }, []);

      const handleAlertUpdated = useCallback(
        (event: NormalizedAlertStatusEvent) => {
          if (!event.alertId) return;

          setAlerts((prevAlerts) =>
            prevAlerts.map((item) =>
              String(item.id) === String(event.alertId)
                ? {
                    ...item,
                    estado: event.estado || item.estado,
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

    useSignalR({
      zonaId: guard?.zonaId,
      onAlertCreated: handleAlertCreated,
      onAlertUpdated: handleAlertUpdated,
      onAlertRemoved: handleAlertRemoved,
      onReconnect: fetchAlerts,
    });

    useEffect(() => {
      fetchAlerts();
    }, [fetchAlerts]);

    const onRefresh = useCallback(() => {
      setRefreshing(true);
      fetchAlerts();
    }, [fetchAlerts]);

  const renderAlertCard = ({ item }: { item: AlertItem }) => (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={() =>
        navigation.navigate('AlertDetail', {
          alertId: item.id,
        })
      }
    >
      <View style={styles.leftBar} />

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.userRow}>
            <UserRound size={16} color="#f8fafc" />
            <Text style={styles.userName}>{item.usuario}</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.estado}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={15} color="#94a3b8" />
          <Text style={styles.infoText}>{item.zona}</Text>
        </View>

        <View style={styles.infoRow}>
          <Clock3 size={15} color="#94a3b8" />
          <Text style={styles.infoText}>{item.tiempo}</Text>
        </View>
      </View>

      <ChevronRight size={22} color="#475569" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={22} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Alertas del Turno</Text>
          <Text style={styles.subtitle}>
            Revisión de alertas asignadas y recientes
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <AlertTriangle size={24} color="#ef4444" />
        </View>

        <View>
          <Text style={styles.summaryNumber}>{alerts.length}</Text>
          <Text style={styles.summaryLabel}>Alertas registradas</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#ef4444" size="large" />
          <Text style={styles.loadingText}>Cargando alertas...</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            alerts.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ef4444"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertTriangle size={42} color="#475569" />
              <Text style={styles.emptyTitle}>En espera</Text>
              <Text style={styles.emptySubtitle}>
                No existen alertas registradas para este turno.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#ef444415',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryNumber: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  alertCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  leftBar: {
    width: 6,
    height: '100%',
    backgroundColor: '#ef4444',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: '#ef444415',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 14,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});