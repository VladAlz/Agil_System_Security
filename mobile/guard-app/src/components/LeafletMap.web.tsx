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

// HU-15: puntos de referencia del Campus Huachi (mismos que el dashboard web)
const CAMPUS_POIS = [
  { id: '1', name: 'FISEI',            lat: -1.26707, lng: -78.62480, color: '#0ea5e9' },
  { id: '2', name: 'FCA',              lat: -1.26807, lng: -78.62478, color: '#eab308' },
  { id: '3', name: 'Administración',   lat: -1.26723, lng: -78.62365, color: '#a855f7' },
  { id: '4', name: 'Áreas Deportivas', lat: -1.26960, lng: -78.62390, color: '#22c55e' },
];

const poiIcon = (name: string, color: string) =>
  L.divIcon({
    html: `<div style="display:flex;align-items:center;gap:4px;white-space:nowrap;">
             <span style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.6)"></span>
             <span style="font-size:11px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000,0 0 5px #000">${name}</span>
           </div>`,
    className: 'ssiu-poi-label',
    iconSize: [130, 16],
    iconAnchor: [5, 8],
  });

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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater lat={targetLat} lng={targetLng} />

        {/* HU-15: puntos de referencia del campus */}
        {CAMPUS_POIS.map((poi) => (
          <Marker
            key={`poi-${poi.id}`}
            position={[poi.lat, poi.lng]}
            icon={poiIcon(poi.name, poi.color)}
            interactive={false}
          />
        ))}

        {markers.map((marker) => {
          const isGuard = marker.severity === 'guard';
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
