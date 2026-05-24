// Mocks globales simplificados para la Demo de Sprint 1
// No requieren que las librerías estén instaladas físicamente

// Mock de Fetch (Red dinámico para IDs únicos)
let alertCounter = 0;
global.fetch = jest.fn(() => {
  alertCounter++;
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      id: `alert-id-${alertCounter}`, 
      estado: 'Active',
      zonaId: 1 
    }),
  });
}) as any;

// Mock de AsyncStorage (Virtual)
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}), { virtual: true });

// Mock de SignalR (Virtual)
jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn().mockImplementation(() => ({
    withUrl: jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    configureLogging: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({
      start: jest.fn().mockResolvedValue(null),
      on: jest.fn(),
      stop: jest.fn().mockResolvedValue(null),
    }),
  })),
  LogLevel: { Information: 1 },
}), { virtual: true });

// Mock de Location de Expo (Virtual)
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: -1.2487, longitude: -78.6181 },
  }),
}), { virtual: true });

// Mock de React Navigation (Virtual)
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}), { virtual: true });
