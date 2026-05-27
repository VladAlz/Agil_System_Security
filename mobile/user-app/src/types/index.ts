export type UserRole = 'Admin' | 'Guard' | 'Student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  faculty?: string;
  zoneId?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface AlertPayload {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface AlertResponse {
  id: string;
  status: 'Active' | 'Assumed' | 'Closed';
  zoneId: number;
  message: string;
}

// ─── HU-10 Grupo de Confianza ─────────────────────────────────────────────────
export interface TrustContact {
  id: number;
  nombre: string;
  correo: string;
  creadoEn: string;
}
