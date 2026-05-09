import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Dimensions,
} from 'react-native';

import {
  MapPin,
  ChevronRight,
  Navigation,
  LogOut,
} from 'lucide-react-native';

import * as signalR from '@microsoft/signalr';
import { LeafletMap } from '../components/LeafletMap';

const { width } = Dimensions.get('window');

interface Alert {
  id: string;
  user: string;
  location: string;
  time: string;
  type: string;
  severity: string;
  coords: { x: number; y: number };
}

const getLatLng = (x: number, y: number): { lat: number; lng: number } => {
  return {
    lat: -1.267584 - ((y - 50) / 100) * 0.005,
    lng: -78.624025 + ((x - 50) / 100) * 0.005,
  };
};

const IS_WEB =
  typeof window !== 'undefined' && window.location.hostname === 'localhost';

const API_URL = IS_WEB
  ? 'http://localhost:5233/api'
  : 'http://10.0.2.2:5233/api';

const HUB_URL = IS_WEB
  ? 'http://localhost:5233/alerthub'
  : 'http://10.0.2.2:5233/alerthub';

export default function DashboardScreen({ navigation }: any) {
  const { guard, logout } = useAuth();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        console.log('Connected to SignalR from Guard App');

        connection
          .invoke('JoinAdminGroup')
          .catch((err) => console.error(err));

        connection.on('ReceiveAlert', (bAlert: any) => {
          const mapped: Alert = {
            id: bAlert.id.toString(),
            user: bAlert.usuario?.nombre || 'Desconocido',
            location: bAlert.zona?.nombre || 'Ubicación desconocida',
            time: 'Ahora',
            type: 'Pánico',
            severity: 'High',
            coords: { x: 50, y: 50 },
          };

          setAlerts((prev) => [mapped, ...prev]);
        });
      })
      .catch((err) => console.error('SignalR Connection Error: ', err));

    return () => {
      connection.stop();
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/Alerts`);
      const data = await response.json();

      const mappedData: Alert[] = data.map((bAlert: any) => ({
        id: bAlert.id.toString(),
        user: bAlert.usuario?.nombre || 'Desconocido',
        location: bAlert.zona?.nombre || 'Ubicación desconocida',
        time: 'Ahora',
        type: 'Pánico',
        severity: 'High',
        coords: { x: 50, y: 50 },
      }));

      setAlerts(mappedData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const mapMarkers = alerts.map((a: Alert) => ({
    id: a.id,
    ...getLatLng(a.coords.x, a.coords.y),
    title: a.user,
    severity: a.severity,
  }));

  const renderItem = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
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
          <Text style={styles.alertType}>{item.type}</Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={14} color="#94a3b8" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>
      </View>

      <ChevronRight size={20} color="#334155" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <LeafletMap
          centerLat={-1.267584}
          centerLng={-78.624025}
          markers={mapMarkers}
        />

        <View style={styles.mapBadge}>
          <Navigation size={14} color="#fff" />
          <Text style={styles.mapBadgeText}>GPS Activo · Zona 2</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Panel de Control</Text>
            <Text style={styles.subtitle}>
              Guardia: {guard?.nombre || 'Guardia'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={16} color="#f8fafc" />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>

            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>{alerts.length}</Text>
              <Text style={styles.miniStatLabel}>Activas</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Alertas Recientes</Text>

        <FlatList
          data={alerts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No existen alertas recientes.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mapContainer: {
    height: 260,
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  mapBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mapBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  logoutButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  miniStat: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  miniStatNum: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '800',
  },
  miniStatLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  alertCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
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
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '700',
  },
  alertType: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    backgroundColor: '#ef444415',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
});