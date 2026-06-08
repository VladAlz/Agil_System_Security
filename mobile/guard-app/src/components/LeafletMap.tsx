// ─── LeafletMap.tsx (nativo) — Mapa Leaflet en WebView, SIN Google ────────────
// Reemplaza el antiguo embed de Google Maps (que fallaba con "must be used in an
// iframe") por Leaflet: satélite ESRI + calles CARTO + zonas + POIs + marcadores.
// Misma interfaz que antes (centerLat/centerLng/markers) para Dashboard,
// AlertDetail y MapScreen.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

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

const ZONES = [
  { color: '#0ea5e9', coords: [[-1.266403,-78.625312],[-1.267101,-78.625493],[-1.267619,-78.625643],[-1.267394,-78.624758],[-1.267828,-78.624503],[-1.267693,-78.624075],[-1.266852,-78.624276],[-1.266477,-78.624359],[-1.266470,-78.624768]] },
  { color: '#eab308', coords: [[-1.267714,-78.625654],[-1.267416,-78.624725],[-1.267848,-78.624568],[-1.267731,-78.624043],[-1.268145,-78.623881],[-1.268232,-78.624010],[-1.268361,-78.624278],[-1.268678,-78.624185],[-1.268798,-78.624850],[-1.268414,-78.624999],[-1.268746,-78.625922],[-1.266403,-78.625312]] },
  { color: '#a855f7', coords: [[-1.268034,-78.623935],[-1.268067,-78.623789],[-1.267916,-78.623342],[-1.267111,-78.623338],[-1.266572,-78.623173],[-1.266471,-78.623637],[-1.266471,-78.624359]] },
  { color: '#22c55e', coords: [[-1.268747,-78.625948],[-1.268431,-78.624992],[-1.268851,-78.624857],[-1.268655,-78.624201],[-1.268294,-78.624264],[-1.267994,-78.623337],[-1.268814,-78.623302],[-1.269338,-78.623293],[-1.269575,-78.623386],[-1.269662,-78.623470],[-1.269957,-78.623845],[-1.270194,-78.622425],[-1.270935,-78.622283],[-1.270364,-78.626346],[-1.268743,-78.625958]] },
];

const POIS = [
  { name: 'FISEI', lat: -1.26707, lng: -78.62480, color: '#0ea5e9' },
  { name: 'FCA', lat: -1.26807, lng: -78.62478, color: '#eab308' },
  { name: 'Administración', lat: -1.26723, lng: -78.62365, color: '#a855f7' },
  { name: 'Áreas Deportivas', lat: -1.26960, lng: -78.62390, color: '#22c55e' },
];

function buildHtml(lat: number, lng: number, markers: MarkerData[]): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#0f172a}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: false, maxZoom: 22 }).setView([${lat}, ${lng}], 18);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 19, maxZoom: 22 }).addTo(map);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', { maxNativeZoom: 19, maxZoom: 22 }).addTo(map);
  var zones = ${JSON.stringify(ZONES)};
  zones.forEach(function(z){ L.polygon(z.coords, { color: z.color, fillColor: z.color, fillOpacity: 0.15, weight: 2 }).addTo(map); });
  var pois = ${JSON.stringify(POIS)};
  pois.forEach(function(p){
    L.marker([p.lat, p.lng], { interactive: false, icon: L.divIcon({ className: '', iconSize: [130,16], iconAnchor: [5,8],
      html: '<div style="display:flex;align-items:center;gap:4px;white-space:nowrap"><span style="width:9px;height:9px;border-radius:50%;background:'+p.color+';border:2px solid #fff"></span><span style="font-size:10px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000">'+p.name+'</span></div>' }) }).addTo(map);
  });
  var markers = ${JSON.stringify(markers)};
  markers.forEach(function(m){
    var color = (m.severity === 'guard') ? '#2563eb' : '#dc2626';
    L.marker([m.lat, m.lng], { icon: L.divIcon({ className: '', iconSize: [28,28], iconAnchor: [14,14],
      html: '<div style="width:24px;height:24px;border-radius:50%;background:'+color+';border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>' }) }).addTo(map).bindPopup(m.title);
  });
</script>
</body></html>`;
}

export const LeafletMap = ({ centerLat, centerLng, markers = [] }: Props) => {
  const lat = Number.isFinite(centerLat) ? centerLat : -1.267584;
  const lng = Number.isFinite(centerLng) ? centerLng : -78.624025;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildHtml(lat, lng, markers), baseUrl: 'https://ssiu.local/' }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        startInLoadingState
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', position: 'relative' },
  map: { flex: 1, backgroundColor: '#0f172a' },
});
