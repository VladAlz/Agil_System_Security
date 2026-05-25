import { apiFetch } from './apiClient';

export type GuardStatusResponse = {
  id: number;
  usuarioId: number;
  zonaId: number;
  estado: string;
  usuario?: {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
  };
  zona?: {
    id: number;
    nombre: string;
    color: string;
  };
};

export const guardService = {
  async toggleStatus(
    guardId: number,
    nuevoEstado: string
  ): Promise<GuardStatusResponse> {
    return apiFetch<GuardStatusResponse>(`/Guards/${guardId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        estado: nuevoEstado,
      }),
    });
  },
};