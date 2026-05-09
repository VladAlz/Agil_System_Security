import AsyncStorage from '@react-native-async-storage/async-storage';

const IS_WEB = typeof window !== 'undefined' && window.location.hostname === 'localhost';

const API_URL = IS_WEB
  ? 'http://localhost:5233/api'
  : 'http://10.0.2.2:5233/api';

export type GuardUser = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  facultad: string;
  guardId?: number;
  zonaId?: number;
  zonaNombre?: string;
  zonaColor?: string;
  estado?: string;
};

export type LoginResponse = {
  token: string;
  usuario: GuardUser;
};

const TOKEN_KEY = 'guard_token';
const USER_KEY = 'guard_user';

export const authService = {
  async login(correo: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correo: correo.trim(),
        password: password.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'Correo o contraseña incorrectos');
    }

    if (data.usuario?.rol !== 'Guardia') {
      throw new Error('Este usuario no pertenece al módulo Guardia');
    }

    await AsyncStorage.multiSet([
      [TOKEN_KEY, data.token],
      [USER_KEY, JSON.stringify(data.usuario)],
    ]);

    return {
      token: data.token,
      usuario: data.usuario,
    };
  },

  async getSession(): Promise<LoginResponse | null> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userJson = await AsyncStorage.getItem(USER_KEY);

    if (!token || !userJson) {
      return null;
    }

    return {
      token,
      usuario: JSON.parse(userJson),
    };
  },

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },
};