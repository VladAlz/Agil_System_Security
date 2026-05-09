import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ChevronLeft,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldCheck,
} from 'lucide-react-native';

import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { LeafletMap } from '../components/LeafletMap';

const UTA_LOCATION = {
  latitude: -1.267584,
  longitude: -78.624025,
};

type GuardLocation = {
  latitude: number;
  longitude: number;
};

export default function MapScreen({ navigation }: any) {
  const { guard } = useAuth();

  const [location, setLocation] = useState<GuardLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const loadCurrentLocation = async () => {
    try {
      setLoading(true);
      setPermissionDenied(false);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setPermissionDenied(true);
        setLocation(UTA_LOCATION);
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setLocation(UTA_LOCATION);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const latitude = location?.latitude ?? UTA_LOCATION.latitude;
  const longitude = location?.longitude ?? UTA_LOCATION.longitude;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Mapa del Guardia</Text>
          <Text style={styles.subtitle}>Ubicación actual y zona asignada</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <ShieldCheck size={18} color="#22c55e" />
          <View>
            <Text style={styles.infoLabel}>Guardia</Text>
            <Text style={styles.infoValue}>
              {guard?.nombre || 'Guardia no identificado'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={18} color="#3b82f6" />
          <View>
            <Text style={styles.infoLabel}>Zona asignada</Text>
            <Text style={styles.infoValue}>
              {guard?.zonaNombre || 'Zona no asignada'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ef4444" />
            <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
          </View>
        ) : (
          <LeafletMap
            centerLat={latitude}
            centerLng={longitude}
            markers={[
              {
                id: 'guard-location',
                lat: latitude,
                lng: longitude,
                title: 'Ubicación del guardia',
                severity: 'Low',
              },
            ]}
          />
        )}

        <View style={styles.mapBadge}>
          <Navigation size={15} color="#fff" />
          <Text style={styles.mapBadgeText}>
            Guardia ubicado · {guard?.zonaNombre || 'Sin zona'}
          </Text>
        </View>
      </View>

      {permissionDenied ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Permiso de ubicación denegado</Text>
          <Text style={styles.warningText}>
            Se está mostrando la ubicación base de la UTA. Activa los permisos
            GPS para ver la ubicación real del guardia.
          </Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.locationButton} onPress={loadCurrentLocation}>
        <LocateFixed size={20} color="#fff" />
        <Text style={styles.locationButtonText}>Actualizar ubicación</Text>
      </TouchableOpacity>

      <View style={styles.coordinatesCard}>
        <Text style={styles.coordinatesLabel}>Coordenadas actuales</Text>
        <Text style={styles.coordinatesValue}>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
      </View>
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
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 14,
  },
  mapBadge: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  warningCard: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    backgroundColor: '#f59e0b20',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f59e0b55',
  },
  warningTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '900',
  },
  warningText: {
    color: '#fde68a',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },
  locationButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  coordinatesCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  coordinatesLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  coordinatesValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
});