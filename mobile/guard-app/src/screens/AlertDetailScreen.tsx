import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  SafeAreaView, 
  ScrollView
} from 'react-native';
import { Shield, MapPin, Clock, Phone, MessageSquare, ChevronLeft, CheckCircle } from 'lucide-react-native';
import { LeafletMap } from '../components/LeafletMap';

export default function AlertDetailScreen({ route, navigation }: any) {
  const { alertId } = route.params;
  
  // Mapeo simple de coordenadas relativas a Lat/Lng para la UTA centradas en los bloques principales
  const getLatLng = (x: number, y: number): { lat: number, lng: number } => {
    return {
      lat: -1.267584 - ((y - 50) / 100) * 0.0050,
      lng: -78.624025 + ((x - 50) / 100) * 0.0050
    };
  };

  const alert = {
    id: alertId,
    user: 'Camila Reinoso',
    location: 'Parqueadero Norte · FISEI',
    time: '2 min',
    role: 'Estudiante',
    faculty: 'Ingeniería en Sistemas',
    description: 'El usuario reporta una situación de emergencia por posible asalto en las cercanías del bloque de laboratorios.',
    coords: { x: 35, y: 42 }
  };

  const { lat, lng } = getLatLng(alert.coords.x, alert.coords.y);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Alerta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Mapa Detallado con Leaflet */}
        <View style={styles.mapContainer}>
          <LeafletMap 
            centerLat={lat} 
            centerLng={lng} 
            markers={[{ id: alert.id, lat, lng, title: alert.user, severity: 'High' }]} 
          />
          <View style={styles.locationOverlay}>
            <MapPin size={16} color="#ef4444" />
            <Text style={styles.locationText}>{alert.location}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{alert.user[0]}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{alert.user}</Text>
              <Text style={styles.userRole}>{alert.role} · {alert.faculty}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{alert.description}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Clock size={16} color="#94a3b8" />
              <Text style={styles.infoValue}>{alert.time}</Text>
            </View>
            <View style={styles.infoBox}>
              <Shield size={16} color="#94a3b8" />
              <Text style={styles.infoValue}>{alert.id}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryAction}>
              <Shield size={20} color="#fff" />
              <Text style={styles.primaryActionText}>Asumir Alerta</Text>
            </TouchableOpacity>
            
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryAction}>
                <Phone size={20} color="#f1f5f9" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction}>
                <MessageSquare size={20} color="#f1f5f9" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeAction}>
              <CheckCircle size={20} color="#22c55e" />
              <Text style={styles.closeActionText}>Finalizar Caso</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    fontWeight: '700',
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
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
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
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  userName: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '800',
  },
  userRole: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 20,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  description: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoValue: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  primaryAction: {
    backgroundColor: '#ef4444',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#1e293b',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeAction: {
    marginTop: 8,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#22c55e30',
    backgroundColor: '#22c55e05',
  },
  closeActionText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '700',
  },
});
