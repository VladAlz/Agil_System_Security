import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
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

export const LeafletMap = ({ centerLat, centerLng, markers = [] }: Props) => {
  // Use the first marker for the main pin if available, otherwise fallback to center
  const targetLat = markers.length > 0 ? markers[0].lat : centerLat;
  const targetLng = markers.length > 0 ? markers[0].lng : centerLng;
  
  // Embed de Google Maps gratuito sin API key (modo satélite: t=k)
  const mapUrl = `https://maps.google.com/maps?q=${targetLat},${targetLng}&t=k&z=18&ie=UTF8&iwloc=&output=embed`;

  return (
    <View style={styles.container}>
      {/* Capa invisible para simular restricción de área bloqueando interacciones si es necesario */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} pointerEvents="none" />
      
      {Platform.OS === 'web' ? (
        <iframe 
          src={mapUrl}
          width="100%" 
          height="100%" 
          style={{ border: 0, flex: 1 }} 
          allowFullScreen={false} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps Satellite Mobile"
        />
      ) : (
        <WebView 
          originWhitelist={['*']}
          source={{ uri: mapUrl }}
          style={styles.map}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
});

