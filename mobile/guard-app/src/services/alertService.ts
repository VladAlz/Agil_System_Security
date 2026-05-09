const IS_WEB =
  typeof window !== 'undefined' && window.location.hostname === 'localhost';

const API_URL = IS_WEB
  ? 'http://localhost:5233/api'
  : 'http://10.0.2.2:5233/api';

export type AlertDetail = {
  id: number;
  usuarioId: number;
  zonaId: number;
  lat: number;
  lng: number;
  estado: string;
  fechaHora: string;
  usuario?: {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
    facultad: string;
  };
  zona?: {
    id: number;
    nombre: string;
    color: string;
  };
};

export const alertService = {
  async getById(alertId: string | number): Promise<AlertDetail> {
    const response = await fetch(`${API_URL}/Alerts/${alertId}`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'No se pudo cargar la alerta');
    }

    return data;
  },

  async updateStatus(
    alertId: string | number,
    estado: string
  ): Promise<AlertDetail> {
    const response = await fetch(`${API_URL}/Alerts/${alertId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        estado,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.mensaje || 'No se pudo actualizar la alerta');
    }

    return data;
  },
};