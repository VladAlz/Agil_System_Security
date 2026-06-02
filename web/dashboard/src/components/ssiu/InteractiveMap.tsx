// ─── InteractiveMap.tsx ─────────────────────────────────────────────────────
// Mapa Leaflet con marcadores en tiempo real vinculados al estado de cada alerta.
// Los marcadores cambian de color/ícono automáticamente cuando llegan eventos
// de SignalR (onAlertAssumed, onGuardEnRoute, onAlertResolved, onAlertClosed).
// HU-06 · Gaby

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polygon, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Alert } from '@/data/alerts';
import { ZoneLegend, ZONES_DATA } from './ZoneLegend';
import { cn } from '@/lib/utils';
import type { GuardLocation } from '@/hooks/use-alert-hub';

// ─── Polígonos de zonas (coordenadas reales del Campus Huachi UTA) ────────────
const ZONE_POLYGONS = {
  "1": [
    [-1.266403, -78.625312], [-1.267101, -78.625493], [-1.267619, -78.625643],
    [-1.267394, -78.624758], [-1.267828, -78.624503], [-1.267693, -78.624075],
    [-1.266852, -78.624276], [-1.266477, -78.624359], [-1.266470, -78.624768]
  ],
  "2": [
    [-1.267714, -78.625654], [-1.267416, -78.624725], [-1.267848, -78.624568],
    [-1.267731, -78.624043], [-1.268145, -78.623881], [-1.268232, -78.624010],
    [-1.268361, -78.624278], [-1.268678, -78.624185], [-1.268798, -78.624850],
    [-1.268414, -78.624999], [-1.268746, -78.625922], [-1.266403, -78.625312]
  ],
  "3": [
    [-1.268034, -78.623935], [-1.268067, -78.623789], [-1.267916, -78.623342],
    [-1.267111, -78.623338], [-1.266572, -78.623173], [-1.266471, -78.623637],
    [-1.266471, -78.624359]
  ],
  "4": [
    [-1.268747, -78.625948], [-1.268431, -78.624992], [-1.268851, -78.624857],
    [-1.268655, -78.624201], [-1.268294, -78.624264], [-1.267994, -78.623337],
    [-1.268814, -78.623302], [-1.269338, -78.623293], [-1.269575, -78.623386],
    [-1.269662, -78.623470], [-1.269957, -78.623845], [-1.270194, -78.622425],
    [-1.270935, -78.622283], [-1.270364, -78.626346], [-1.268743, -78.625958]
  ]
};

// ─── Helpers de posición ────────────────────────────────────────────────────
const getLatLng = (x: number, y: number): [number, number] => {
  const lat = -1.2664 - (y / 100) * 0.0041;
  const lng = -78.6253 + (x / 100) * 0.0033;
  return [lat, lng];
};

const resolveAlertLatLng = (alert: Alert): [number, number] => {
  // Prefiere las coordenadas GPS reales del backend
  if (alert.lat !== undefined && alert.lng !== undefined) {
    return [alert.lat, alert.lng];
  }
  return getLatLng(alert.coords.x, alert.coords.y);
};

// ─── Centro/zoom del Campus Huachi (unificado web ↔ móvil) ────────────────────
const CAMPUS_CENTER: [number, number] = [-1.267584, -78.624025];
const CAMPUS_ZOOM = 17;

// ─── Puntos de referencia (POIs) del campus — HU-15 ───────────────────────────
const CAMPUS_POIS = [
  { id: "1", name: "FISEI",            lat: -1.26707, lng: -78.62480, color: "#0ea5e9" },
  { id: "2", name: "FCA",              lat: -1.26807, lng: -78.62478, color: "#eab308" },
  { id: "3", name: "Administración",   lat: -1.26723, lng: -78.62365, color: "#a855f7" },
  { id: "4", name: "Áreas Deportivas", lat: -1.26960, lng: -78.62390, color: "#22c55e" },
];

const getPoiIcon = (name: string, color: string) =>
  L.divIcon({
    html: `<div style="display:flex;align-items:center;gap:4px;white-space:nowrap;pointer-events:none;">
             <span style="width:11px;height:11px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.6)"></span>
             <span style="font-size:11px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000,0 0 5px #000">${name}</span>
           </div>`,
    className: "ssiu-poi-label",
    iconSize: [130, 16],
    iconAnchor: [5, 8],
  });

// ─── Iconos personalizados por estado ────────────────────────────────────────
// Se generan como HTML + CSS para que Tailwind los estilice.
// La clave de diseño: el ícono cambia INMEDIATAMENTE cuando el estado del alert
// cambia en el array de React — no hay que hacer nada extra.
const STATUS_CONFIG: Record<string, { emoji: string; color: string; shadow: string; pulse: boolean }> = {
  active:    { emoji: "🚨", color: "bg-red-600 border-red-200",     shadow: "shadow-red-500/60",    pulse: true  },
  assigned:  { emoji: "🛡️", color: "bg-orange-500 border-orange-200", shadow: "shadow-orange-500/60", pulse: false },
  enroute:   { emoji: "🏃", color: "bg-yellow-400 border-yellow-200", shadow: "shadow-yellow-400/60", pulse: false },
  resolved:  { emoji: "✅", color: "bg-emerald-500 border-emerald-200", shadow: "shadow-emerald-500/60", pulse: false },
  closed:    { emoji: "🔒", color: "bg-slate-500 border-slate-200",   shadow: "shadow-slate-400/40",  pulse: false },
  cancelled: { emoji: "❌", color: "bg-purple-500 border-purple-200", shadow: "shadow-purple-400/40", pulse: false },
};

const getMarkerIcon = (status: string, isSelected: boolean) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const selectedRing = isSelected ? "ring-4 ring-white ring-offset-1 ring-offset-transparent scale-125" : "";
  const pulseClass   = cfg.pulse ? "animate-pulse" : "";

  return L.divIcon({
    html: `<div class="relative flex items-center justify-center w-9 h-9 rounded-full border-2 text-base shadow-xl transition-all duration-300 ${cfg.color} ${cfg.shadow} ${selectedRing} ${pulseClass}">
             <span class="select-none leading-none">${cfg.emoji}</span>
           </div>`,
    className: "custom-leaflet-marker",
    iconSize:    [36, 36],
    iconAnchor:  [18, 18],
    popupAnchor: [0, -20],
  });
};

// ─── Componente interno: reactivo a cambios de cámara ──────────────────────
function MapCamera({
  lat,
  lng,
  focusedZone,
  latestAlertId,
}: {
  lat: number;
  lng: number;
  focusedZone?: string | null;
  latestAlertId?: string | null;
}) {
  const map = useMap();
  const prevLatestRef = useRef<string | null>(null);

  useEffect(() => {
    // Cuando se focaliza una zona: centrar en el centroide del polígono
    if (focusedZone && ZONE_POLYGONS[focusedZone as keyof typeof ZONE_POLYGONS]) {
      const poly = ZONE_POLYGONS[focusedZone as keyof typeof ZONE_POLYGONS];
      const lats  = poly.map(p => p[0]);
      const lngs  = poly.map(p => p[1]);
      const cLat  = (Math.min(...lats) + Math.max(...lats)) / 2;
      const cLng  = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      map.flyTo([cLat, cLng], 17.5, { animate: true, duration: 1.0 });
      return;
    }

    // Cuando se selecciona una alerta: centrar en ella
    if (lat !== -1.267584 || lng !== -78.624025) {
      map.flyTo([lat, lng], 18, { animate: true, duration: 1.2 });
      return;
    }
  }, [lat, lng, focusedZone, map]);

  useEffect(() => {
    // Cuando llega una NUEVA alerta (SignalR ReceiveAlert): hacer fly suave
    if (latestAlertId && latestAlertId !== prevLatestRef.current) {
      prevLatestRef.current = latestAlertId;
      if (lat !== -1.267584 || lng !== -78.624025) {
        map.flyTo([lat, lng], 18, { animate: true, duration: 0.8 });
      }
    }
  }, [latestAlertId, lat, lng, map]);

  return null;
}

// ─── Componente principal ────────────────────────────────────────────────────
interface Props {
  alerts: Alert[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  focusedZone?: string | null;
  guards?: Record<string, GuardLocation>;
}

export const InteractiveMap = ({ alerts, selectedId, onSelect, focusedZone, guards = {} }: Props) => {
  // Mostrar solo alertas visibles en el mapa (excluye canceladas para no saturar)
  const mapAlerts = alerts.filter(
    a => a.status === "active" || a.status === "assigned" || a.status === "enroute" || a.status === "resolved"
  );

  // La alerta más reciente (la primera del array, ya que vienen ordenadas desc)
  const latestAlertId = alerts[0]?.id ?? null;

  // Centro del mapa: alerta seleccionada o campus por defecto
  const selectedAlert = alerts.find(a => a.id === selectedId);
  const [centerLat, centerLng] = selectedAlert
    ? resolveAlertLatLng(selectedAlert)
    : CAMPUS_CENTER;

  return (
    <div style={{ height: '100%', width: '100%', background: '#0f172a', position: 'relative' }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={CAMPUS_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Mapa satelital ESRI — funciona sin API key */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />

        {/* HU-15: capa de etiquetas (calles y lugares) sobre el satélite */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />

        {/* Polígonos de zonas — se resaltan cuando se enfoca una zona */}
        {ZONES_DATA.map(zone => (
          <Polygon
            key={zone.id}
            positions={ZONE_POLYGONS[zone.id as keyof typeof ZONE_POLYGONS] as any}
            pathOptions={{
              fillColor:   zone.color,
              fillOpacity: focusedZone === zone.id ? 0.38 : 0.16,
              color:       zone.color,
              weight:      focusedZone === zone.id ? 3 : 1.5,
              dashArray:   focusedZone === zone.id ? undefined : "5, 5",
            }}
          />
        ))}

        {/* HU-15: marcadores de puntos de referencia (POIs) del campus */}
        {CAMPUS_POIS.map(poi => (
          <Marker
            key={`poi-${poi.id}`}
            position={[poi.lat, poi.lng]}
            icon={getPoiIcon(poi.name, poi.color)}
            interactive={false}
          />
        ))}

        {/* ── Marcadores dinámicos — se re-renderizan con cada cambio de estado ──
            Cuando SignalR dispara onAlertAssumed, el estado del Alert en el array
            cambia de "active" → "assigned" y React re-renderiza el Marker con el
            nuevo ícono automáticamente. No se necesita ninguna suscripción extra.  */}
        {mapAlerts.map(alert => {
          const [alat, alng] = resolveAlertLatLng(alert);
          const isSelected   = alert.id === selectedId;
          const statusLabel  = {
            active:   "🚨 ACTIVA",
            assigned: "🛡️ ASUMIDA",
            enroute:  "🏃 EN CAMINO",
            resolved: "✅ RESUELTA",
            closed:   "🔒 CERRADA",
            cancelled:"❌ CANCELADA",
          }[alert.status] ?? alert.status;

          return (
            <Marker
              key={`${alert.id}-${alert.status}`}   // key incluye estado → forza re-render del ícono
              position={[alat, alng]}
              icon={getMarkerIcon(alert.status, isSelected)}
              eventHandlers={{ click: () => onSelect(alert.id) }}
            >
              <Popup>
                <div className="p-2 space-y-2 text-slate-800 max-w-[200px]">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-mono font-bold text-xs text-blue-700">{alert.code}</span>
                    <span className={cn(
                      "text-[9px] font-extrabold px-1.5 py-0.5 rounded border",
                      alert.status === "active"   ? "bg-red-100 text-red-700 border-red-200" :
                      alert.status === "assigned" ? "bg-orange-100 text-orange-700 border-orange-200" :
                      alert.status === "enroute"  ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                      "bg-green-100 text-green-700 border-green-200"
                    )}>
                      {statusLabel}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-xs">{alert.user.name}</p>
                    <p className="text-[10px] text-slate-500">{alert.user.faculty}</p>
                  </div>
                  {alert.guard && (
                    <p className="text-[10px] text-blue-600 font-semibold">
                      👮 Guardia: {alert.guard}
                    </p>
                  )}
                  <p className="text-[10px] bg-slate-100 p-1.5 rounded italic">
                    "{alert.location}"
                  </p>
                  <button
                    onClick={() => onSelect(alert.id)}
                    className="w-full text-center py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition-colors"
                  >
                    Ver Detalles
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapCamera
          lat={centerLat}
          lng={centerLng}
          focusedZone={focusedZone}
          latestAlertId={latestAlertId}
        />

        {/* ── Marcadores de Guardias en Patrullaje ── */}
        {Object.values(guards).map((guard) => (
          <Marker
            key={`guard-${guard.guardName}`}
            position={[guard.lat, guard.lng]}
            icon={L.divIcon({
              html: `<div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 bg-blue-600 border-blue-300 shadow-blue-500/60 shadow-lg text-white">
                       <span class="select-none leading-none text-sm">👮</span>
                     </div>`,
              className: "custom-leaflet-marker",
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -18],
            })}
          >
            <Popup>
              <div className="p-1 text-center text-slate-800">
                <p className="font-bold text-xs text-blue-700">👮 Guardia en Patrullaje</p>
                <p className="text-xs font-semibold">{guard.guardName}</p>
                <p className="text-[10px] text-slate-500 mt-1">Última act: {new Date(guard.timestamp).toLocaleTimeString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <ZoneLegend />

      {/* ── Contador de alertas activas en el mapa ── */}
      {mapAlerts.filter(a => a.status === "active").length > 0 && (
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-full shadow-lg animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white" />
          {mapAlerts.filter(a => a.status === "active").length} ACTIVA
          {mapAlerts.filter(a => a.status === "active").length > 1 ? "S" : ""}
        </div>
      )}
    </div>
  );
};
