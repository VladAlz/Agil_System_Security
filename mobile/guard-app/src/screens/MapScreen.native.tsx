import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
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

let MapView: any = null;
let Marker: any = null;
let Polygon: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polygon = Maps.Polygon;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const ZONES_COORDS = {
  "1": [ // Z1: Azul
    { latitude: -1.266403, longitude: -78.625312 }, { latitude: -1.267101, longitude: -78.625493 }, 
    { latitude: -1.267619, longitude: -78.625643 }, { latitude: -1.267394, longitude: -78.624758 }, 
    { latitude: -1.267828, longitude: -78.624503 }, { latitude: -1.267693, longitude: -78.624075 },
    { latitude: -1.266852, longitude: -78.624276 }, { latitude: -1.266477, longitude: -78.624359 }, 
    { latitude: -1.266470, longitude: -78.624768 }
  ],
  "2": [ // Z2: Verde (Cambiado a Verde según plan)
    { latitude: -1.267714, longitude: -78.625654 }, { latitude: -1.267416, longitude: -78.624725 }, 
    { latitude: -1.267848, longitude: -78.624568 }, { latitude: -1.267731, longitude: -78.624043 }, 
    { latitude: -1.268145, longitude: -78.623881 }, { latitude: -1.268232, longitude: -78.624010 },
    { latitude: -1.268361, longitude: -78.624278 }, { latitude: -1.268678, longitude: -78.624185 }, 
    { latitude: -1.268798, longitude: -78.624850 }, { latitude: -1.268414, longitude: -78.624999 }, 
    { latitude: -1.268746, longitude: -78.625922 }, { latitude: -1.266403, longitude: -78.625312 }
  ],
  "3": [ // Z3: Naranja
    { latitude: -1.268034, longitude: -78.623935 }, { latitude: -1.268067, longitude: -78.623789 }, 
    { latitude: -1.267916, longitude: -78.623342 }, { latitude: -1.267111, longitude: -78.623338 }, 
    { latitude: -1.266572, longitude: -78.623173 }, { latitude: -1.266471, longitude: -78.623637 },
    { latitude: -1.266471, longitude: -78.624359 }
  ],
  "4": [ // Z4: Rojo
    { latitude: -1.268747, longitude: -78.625948 }, { latitude: -1.268431, longitude: -78.624992 }, 
    { latitude: -1.268851, longitude: -78.624857 }, { latitude: -1.268655, longitude: -78.624201 }, 
    { latitude: -1.268294, longitude: -78.624264 }, { latitude: -1.267994, longitude: -78.623337 },
    { latitude: -1.268814, longitude: -78.623302 }, { latitude: -1.269338, longitude: -78.623293 }, 
    { latitude: -1.269575, longitude: -78.623386 }, { latitude: -1.269662, longitude: -78.623470 }, 
    { latitude: -1.269957, longitude: -78.623845 }, { latitude: -1.270194, longitude: -78.622425 },
    { latitude: -1.270935, longitude: -78.622283 }, { latitude: -1.270364, longitude: -78.626346 }, 
    { latitude: -1.268743, longitude: -78.625958 }
  ]
};

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
          <Text style={styles.subtitle}>
            Ubicación actual y zonas del campus
          </Text>
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
        ) : Platform.OS === 'web' ? (
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
        ) : (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            region={{
              latitude,
              longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {/* Zonas HU-04 */}
            <Polygon
              coordinates={ZONES_COORDS["1"]}
              fillColor="rgba(37, 99, 235, 0.2)"
              strokeColor="#2563eb"
              strokeWidth={2}
            />
            <Polygon
              coordinates={ZONES_COORDS["2"]}
              fillColor="rgba(34, 197, 94, 0.2)"
              strokeColor="#22c55e"
              strokeWidth={2}
            />
            <Polygon
              coordinates={ZONES_COORDS["3"]}
              fillColor="rgba(245, 158, 11, 0.2)"
              strokeColor="#f59e0b"
              strokeWidth={2}
            />
            <Polygon
              coordinates={ZONES_COORDS["4"]}
              fillColor="rgba(239, 68, 68, 0.2)"
              strokeColor="#ef4444"
              strokeWidth={2}
            />

            <Marker
              coordinate={{
                latitude,
                longitude,
              }}
              title="Tu ubicación"
              description={guard?.zonaNombre || 'Guardia'}
              pinColor="blue"
            />
          </MapView>
        )}

        <View style={styles.mapBadge}>
          <Navigation size={15} color="#fff" />
          <Text style={styles.mapBadgeText}>
            Campus UTA · Zonas Activas
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
  map: {
    flex: 1,
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