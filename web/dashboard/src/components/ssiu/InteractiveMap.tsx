interface Props {
  lat?: number;
  lng?: number;
  isActive?: boolean;
}

export const InteractiveMap = ({ lat = -1.267584, lng = -78.624025, isActive }: Props) => {
  // t=k is for satellite view, z=18 is zoom level
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=18&ie=UTF8&iwloc=&output=embed`;

  return (
    <div style={{ height: '100%', width: '100%', background: '#0f172a', position: 'relative' }}>
      {/* Capa invisible para evitar que el usuario arrastre el mapa fuera de la zona (opcional) */}
      <div className="absolute inset-0 z-10 pointer-events-none" />
      <iframe 
        src={mapUrl}
        width="100%" 
        height="100%" 
        style={{ border: 0 }} 
        allowFullScreen={false} 
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Maps Satellite"
      />
    </div>
  );
};


