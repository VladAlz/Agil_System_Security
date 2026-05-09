import { Platform } from 'react-native';

const API_PORT = '5233';

// Cambia solo esta IP cuando tu PC cambie de red
const PC_IP = '192.168.101.10';

const getApiHost = () => {
  if (Platform.OS === 'web') {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'localhost';
    }

    return hostname;
  }

  return PC_IP;
};

const API_HOST = getApiHost();

export const API_URL = `http://${API_HOST}:${API_PORT}/api`;
export const HUB_URL = `http://${API_HOST}:${API_PORT}/alerthub`;