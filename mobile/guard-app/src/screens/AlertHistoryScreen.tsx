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
  ArrowLeft,
  CheckCircle2,
  Clock,
  History,
  MapPin,
  ShieldCheck,
  User,
} from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import {
  alertHistoryService,
  GuardAlertHistoryItem,
} from '../services/alertHistoryService';

export default function AlertHistoryScreen({ navigation }: any) {
  const { guard } = useAuth();

  const [history, setHistory] = useState<GuardAlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const guardiaId = guard?.guardId;

  const loadHistory = useCallback(async () => {
    if (!guardiaId) {
      setHistory([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await alertHistoryService.getTodayHistory(guardiaId);
      setHistory(data);
    } catch (error) {
      console.error('Error cargando historial del guardia:', error);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [guardiaId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Sin registrar';

    return new Date(value).toLocaleString();
  };

  const formatMinutes = (value?: number | null) => {
    if (value === null || value === undefined) {
      return 'En proceso';
    }

    return `${value} min`;
  };

  const getStatusStyle = (estado: string) => {
    switch (estado) {
      case 'Cerrada':
        return styles.statusClosed;
      case 'Resuelta':
        return styles.statusResolved;
      case 'En Camino':
        return styles.statusEnRoute;
      case 'Asumida':
        return styles.statusAssumed;
      default:
        return styles.statusActive;
    }
  };

  const renderHistoryItem = ({ item }: { item: GuardAlertHistoryItem }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userBlock}>
          <View style={styles.avatarBox}>
            <User size={24} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.nombreUsuario}</Text>
            <Text style={styles.userMeta}>
              {item.facultad || 'Sin facultad'} · {item.nombreZona}
            </Text>
          </View>
        </View>

        <View style={[styles.statusBadge, getStatusStyle(item.estado)]}>
          <Text style={styles.statusText}>{item.estado}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <MapPin size={18} color="#94a3b8" />
          <Text style={styles.infoText}>Zona: {item.nombreZona}</Text>
        </View>

        <View style={styles.infoRow}>
          <Clock size={18} color="#94a3b8" />
          <Text style={styles.infoText}>
            Alerta: {formatDateTime(item.fechaHora)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <ShieldCheck size={18} color="#94a3b8" />
          <Text style={styles.infoText}>
            Asumida: {formatDateTime(item.fechaAsumida)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <CheckCircle2 size={18} color="#94a3b8" />
          <Text style={styles.infoText}>
            Cierre: {formatDateTime(item.fechaCerrada || item.fechaResuelta)}
          </Text>
        </View>
      </View>

      <View style={styles.responseBox}>
        <Text style={styles.responseLabel}>Tiempo de respuesta</Text>
        <Text style={styles.responseValue}>
          {formatMinutes(item.tiempoRespuestaMinutos)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator color="#ef4444" size="large" />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={26} color="#fff" />
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>Historial del Turno</Text>
          <Text style={styles.subtitle}>
            Alertas atendidas por el guardia
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <History size={32} color="#ef4444" />
        </View>

        <View>
          <Text style={styles.summaryNumber}>{history.length}</Text>
          <Text style={styles.summaryText}>Alertas del turno actual</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ef4444"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <History size={56} color="#64748b" />
            <Text style={styles.emptyTitle}>Sin historial</Text>
            <Text style={styles.emptyText}>
              No existen alertas atendidas por este guardia durante el día.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 18,
  },
  backButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 15,
  },
  summaryCard: {
    marginHorizontal: 26,
    marginBottom: 18,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryNumber: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },
  summaryText: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 26,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    gap: 12,
    marginBottom: 16,
  },
  userBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
  },
  userMeta: {
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusActive: {
    backgroundColor: '#dc2626',
  },
  statusAssumed: {
    backgroundColor: '#f97316',
  },
  statusEnRoute: {
    backgroundColor: '#2563eb',
  },
  statusResolved: {
    backgroundColor: '#16a34a',
  },
  statusClosed: {
    backgroundColor: '#7c3aed',
  },
  infoGrid: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    color: '#cbd5e1',
    fontWeight: '700',
    flex: 1,
  },
  responseBox: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 14,
  },
  responseLabel: {
    color: '#94a3b8',
    fontWeight: '800',
    marginBottom: 4,
  },
  responseValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 110,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 18,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },
});