import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapContainer, TileLayer, Marker, useMap, Polygon } from 'react-leaflet';
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

const ZONES = [
  { color: '#0ea5e9', coords: [[-1.266403,-78.625312],[-1.267101,-78.625493],[-1.267619,-78.625643],[-1.267394,-78.624758],[-1.267828,-78.624503],[-1.267693,-78.624075],[-1.266852,-78.624276],[-1.266477,-78.624359],[-1.266470,-78.624768]] },
  { color: '#eab308', coords: [[-1.267714,-78.625654],[-1.267416,-78.624725],[-1.267848,-78.624568],[-1.267731,-78.624043],[-1.268145,-78.623881],[-1.268232,-78.624010],[-1.268361,-78.624278],[-1.268678,-78.624185],[-1.268798,-78.624850],[-1.268414,-78.624999],[-1.268746,-78.625922],[-1.266403,-78.625312]] },
  { color: '#a855f7', coords: [[-1.268034,-78.623935],[-1.268067,-78.623789],[-1.267916,-78.623342],[-1.267111,-78.623338],[-1.266572,-78.623173],[-1.266471,-78.623637],[-1.266471,-78.624359]] },
  { color: '#22c55e', coords: [[-1.268747,-78.625948],[-1.268431,-78.624992],[-1.268851,-78.624857],[-1.268655,-78.624201],[-1.268294,-78.624264],[-1.267994,-78.623337],[-1.268814,-78.623302],[-1.269338,-78.623293],[-1.269575,-78.623386],[-1.269662,-78.623470],[-1.269957,-78.623845],[-1.270194,-78.622425],[-1.270935,-78.622283],[-1.270364,-78.626346],[-1.268743,-78.625958]] },
];

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
  const targetLat = centerLat;
  const targetLng = centerLng;

  return (
    <View style={styles.container}>
      <MapContainer 
        center={[targetLat, targetLng]} 
        zoom={18}
        maxZoom={22}
        style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxNativeZoom={19}
          maxZoom={22}
        />
        <MapUpdater lat={targetLat} lng={targetLng} />

        {/* Zonas */}
        {ZONES.map((zone, index) => (
          <Polygon
            key={`zone-${index}`}
            positions={zone.coords as any}
            pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.15, weight: 2 }}
          />
        ))}

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
