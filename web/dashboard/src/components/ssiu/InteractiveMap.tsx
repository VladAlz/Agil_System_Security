import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';

// Fix para el icono por defecto de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { ZoneLegend, ZONES_DATA } from './ZoneLegend';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  lat?: number;
  lng?: number;
  isActive?: boolean;
  focusedZone?: string | null;
}

// Coordenadas moldeadas según los límites reales del Campus Huachi
const ZONE_POLYGONS = {
  "1": [ // Z1: Sector FISEI (Cian)
    [-1.266403, -78.625312], [-1.267101, -78.625493], [-1.267619, -78.625643],
    [-1.267394, -78.624758], [-1.267828, -78.624503], [-1.267693, -78.624075],
    [-1.266852, -78.624276], [-1.266477, -78.624359], [-1.266470, -78.624768]
  ],
  "2": [ // Z2: Sector FCA (Amarillo)
    [-1.267714, -78.625654], [-1.267416, -78.624725], [-1.267848, -78.624568],
    [-1.267731, -78.624043], [-1.268145, -78.623881], [-1.268232, -78.624010],
    [-1.268361, -78.624278], [-1.268678, -78.624185], [-1.268798, -78.624850],
    [-1.268414, -78.624999], [-1.268746, -78.625922], [-1.266403, -78.625312]
  ],
  "3": [ // Z3: Administración y Parqueaderos (Morado)
    [-1.268034, -78.623935], [-1.268067, -78.623789], [-1.267916, -78.623342],
    [-1.267111, -78.623338], [-1.266572, -78.623173], [-1.266471, -78.623637],
    [-1.266471, -78.624359]
  ],
  "4": [ // Z4: Áreas Deportivas y Recreación (Verde)
    [-1.268747, -78.625948], [-1.268431, -78.624992], [-1.268851, -78.624857],
    [-1.268655, -78.624201], [-1.268294, -78.624264], [-1.267994, -78.623337],
    [-1.268814, -78.623302], [-1.269338, -78.623293], [-1.269575, -78.623386],
    [-1.269662, -78.623470], [-1.269957, -78.623845], [-1.270194, -78.622425],
    [-1.270935, -78.622283], [-1.270364, -78.626346], [-1.268743, -78.625958]
  ]
};

function MapUpdater({ lat, lng, focusedZone }: { lat: number, lng: number, focusedZone?: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (focusedZone && ZONE_POLYGONS[focusedZone as keyof typeof ZONE_POLYGONS]) {
      const poly = ZONE_POLYGONS[focusedZone as keyof typeof ZONE_POLYGONS];
      const centerLat = (poly[0][0] + poly[2][0]) / 2;
      const centerLng = (poly[0][1] + poly[2][1]) / 2;
      map.flyTo([centerLat, centerLng], 18, {
        animate: true,
        duration: 1.0
      });
    } else {
      map.flyTo([lat, lng], 18, {
        animate: true,
        duration: 1.5
      });
    }
  }, [lat, lng, focusedZone, map]);
  return null;
}

export const InteractiveMap = ({ lat = -1.267584, lng = -78.624025, isActive, focusedZone }: Props) => {
  return (
    <div style={{ height: '100%', width: '100%', background: '#0f172a', position: 'relative' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />

        {ZONES_DATA.map((zone) => (
          <Polygon
            key={zone.id}
            positions={ZONE_POLYGONS[zone.id as keyof typeof ZONE_POLYGONS] as any}
            pathOptions={{
              fillColor: zone.color,
              fillOpacity: 0.25,
              color: zone.color,
              weight: 2,
              dashArray: "5, 5"
            }}
          />
        ))}

        <Marker position={[lat, lng]} />
        <MapUpdater lat={lat} lng={lng} focusedZone={focusedZone} />
      </MapContainer>
      <ZoneLegend />
    </div>
  );
};
