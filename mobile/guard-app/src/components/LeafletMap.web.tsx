import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack/Metro
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  severity: string;
}

interface Props {
  centerLat: number;
  centerLng: number;
  markers?: MarkerData[];
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export const LeafletMap = ({ centerLat, centerLng, markers = [] }: Props) => {
  const targetLat = markers.length > 0 ? markers[0].lat : centerLat;
  const targetLng = markers.length > 0 ? markers[0].lng : centerLng;

  return (
    <View style={styles.container}>
      <MapContainer 
        center={[targetLat, targetLng]} 
        zoom={18} 
        style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />
        <MapUpdater lat={targetLat} lng={targetLng} />
        {markers.map((marker) => {
          const isGuard = marker.severity === 'guard';
          const bgColor = isGuard ? 'bg-blue-600' : 'bg-red-600';
          const emoji = isGuard ? '👮' : '🚨';
          
          return (
            <Marker 
              key={marker.id} 
              position={[marker.lat, marker.lng]}
              icon={L.divIcon({
                html: `<div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background-color: ${isGuard ? '#2563eb' : '#dc2626'}; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: white; font-size: 16px;">
                         ${emoji}
                       </div>`,
                className: "custom-mobile-marker",
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            />
          );
        })}
      </MapContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden'
  }
});
