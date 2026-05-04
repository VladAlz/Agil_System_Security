import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import type { LoginRequest, LoginResponse, User } from '../types';

const AUTH_API = process.env.EXPO_PUBLIC_AUTH_API_URL ?? 'http://10.0.2.2:5001';

const KEYS = {
  ACCESS_TOKEN: 'ssiu_access_token',
  REFRESH_TOKEN: 'ssiu_refresh_token',
  USER: 'ssiu_user',
} as const;

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const { data } = await axios.post<LoginResponse>(
        `${AUTH_API}/auth/login`,
        credentials,
        { timeout: 8000 },
      );
      await AsyncStorage.multiSet([
        [KEYS.ACCESS_TOKEN, data.accessToken],
        [KEYS.REFRESH_TOKEN, data.refreshToken],
        [KEYS.USER, JSON.stringify(data.user)],
      ]);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Credenciales incorrectas');
        }
        throw new Error('Error de conexión con el servidor');
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN, KEYS.USER]);
  },

  async getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  async getStoredUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? (JSON.parse(raw) as User) : null;
  },
};
