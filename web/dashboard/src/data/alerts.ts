export type AlertStatus = "active" | "assigned" | "enroute" | "resolved" | "closed" | "cancelled";
export type AlertType = "panic" | "suspicious" | "medical" | "fire";

export interface Alert {
  id: string;
  code: string;
  user: {
    name: string;
    role: "Estudiante" | "Docente" | "Administrativo";
    faculty: string;
    phone: string;
    avatar: string;
  };
  type: AlertType;
  status: AlertStatus;
  zone: string;
  location: string;
  coords: { x: number; y: number };   // posición en % en el mapa (mock)
  lat?: number;                         // coordenada GPS real (del backend)
  lng?: number;                         // coordenada GPS real (del backend)
  createdAt: string;
  description: string;
  guard?: string;
  trustGroup: string[];
  timeline: { time: string; event: string; actor: string }[];
}

export const alerts: Alert[] = [];
