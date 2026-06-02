// ─── GuardLeafletWebView.tsx — Mapa Leaflet en WebView (HU-13/HU-15) ──────────
// Renderiza el mapa del guardia con Leaflet dentro de un WebView: mismo satélite
// ESRI + capa de calles CARTO + zonas + POIs que el dashboard, SIN API key de
// Google (evita react-native-maps y su requisito de facturación).

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

// Polígonos de zonas (coords reales Campus Huachi) en pares [lat, lng]
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

function buildHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#0f172a}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lng}], 17);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png').addTo(map);
  var zones = ${JSON.stringify(ZONES)};
  zones.forEach(function(z){ L.polygon(z.coords, { color: z.color, fillColor: z.color, fillOpacity: 0.18, weight: 2 }).addTo(map); });
  var pois = ${JSON.stringify(POIS)};
  pois.forEach(function(p){
    L.marker([p.lat, p.lng], { interactive: false, icon: L.divIcon({ className: '', iconSize: [130,16], iconAnchor: [5,8],
      html: '<div style="display:flex;align-items:center;gap:4px;white-space:nowrap"><span style="width:10px;height:10px;border-radius:50%;background:'+p.color+';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.6)"></span><span style="font-size:11px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000,0 0 5px #000">'+p.name+'</span></div>' }) }).addTo(map);
  });
  L.marker([${lat}, ${lng}], { icon: L.divIcon({ className: '', iconSize: [30,30], iconAnchor: [15,15],
    html: '<div style="width:28px;height:28px;border-radius:50%;background:#2563eb;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 6px rgba(0,0,0,.5)">P</div>' }) }).addTo(map).bindPopup('Tu ubicacion');
</script>
</body></html>`;
}

interface Props {
  lat: number;
  lng: number;
}

export function GuardLeafletWebView({ lat, lng }: Props) {
  const safeLat = Number.isFinite(lat) ? lat : -1.267584;
  const safeLng = Number.isFinite(lng) ? lng : -78.624025;
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildHtml(safeLat, safeLng), baseUrl: 'https://ssiu.local/' }}
        style={styles.webview}
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  webview: { flex: 1, backgroundColor: '#0f172a' },
});
