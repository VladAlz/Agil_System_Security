import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}


const TOKEN_KEY = 'guard_token';

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error('No existe una sesión activa. Inicia sesión nuevamente.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, headers, ...restOptions } = options;

  const authHeaders = auth ? await getAuthHeaders() : {};

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      data?.mensaje ||
      data?.message ||
      data?.title ||
      data?.error ||
      'Ocurrió un error al comunicarse con el servidor';

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export function extractItems<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}