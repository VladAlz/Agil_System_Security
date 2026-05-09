import { API_URL } from '../../config/api';

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
    const response = await fetch(`${API_URL}/Guards/${guardId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        estado: nuevoEstado,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'No se pudo actualizar el estado');
    }

    return data;
  },
};