import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import type { LoginRequest, LoginResponse, User } from '../types';

import { BASE_URL } from '../config/api';

const AUTH_API = BASE_URL;

const KEYS = {
  ACCESS_TOKEN: 'ssiu_access_token',
  USER: 'ssiu_user',
} as const;

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const { data } = await axios.post<any>(
        `${AUTH_API}/Auth/login`,
        { correo: credentials.email, password: credentials.password },
        { timeout: 8000 },
      );
      
      if (data.usuario.rol !== 'Estudiante') {
        throw new Error('Acceso denegado: Esta aplicación es solo para Estudiantes.');
      }

      const mappedResponse: LoginResponse = {
        accessToken: data.token,
        refreshToken: "",
        user: {
            id: data.usuario.id.toString(),
            name: data.usuario.nombre,
            email: data.usuario.correo,
            role: data.usuario.rol,
            faculty: data.usuario.facultad
        }
      };

      await AsyncStorage.multiSet([
        [KEYS.ACCESS_TOKEN, mappedResponse.accessToken],
        [KEYS.USER, JSON.stringify(mappedResponse.user)],
      ]);
      return mappedResponse;
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
    await AsyncStorage.multiRemove([KEYS.ACCESS_TOKEN, KEYS.USER]);
  },

  async getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  async getStoredUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? (JSON.parse(raw) as User) : null;
  },
};
