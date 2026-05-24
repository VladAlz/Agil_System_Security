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

export const alerts: Alert[] = [
  {
    id: "a-1042",
    code: "ALT-1042",
    user: {
      name: "Camila Reinoso",
      role: "Estudiante",
      faculty: "FISEI · Ing. Software",
      phone: "+593 99 812 4471",
      avatar: "CR",
    },
    type: "panic",
    status: "active",
    zone: "Zona 2 — Huachi",
    location: "Edificio FISEI · Parqueadero norte",
    coords: { x: 38, y: 44 },
    createdAt: "hace 14 s",
    description:
      "Botón de pánico mantenido 3.2s. Posible seguimiento por desconocido en parqueadero norte. GPS con precisión ±4m.",
    trustGroup: ["María Reinoso (madre)", "Andrés P. (hermano)"],
    timeline: [
      { time: "20:42:11", event: "Botón de pánico activado", actor: "App Usuario" },
      { time: "20:42:12", event: "Alerta creada en Alert.API", actor: "SignalR Hub" },
      { time: "20:42:13", event: "Broadcast a guardias Zona 2", actor: "Notification.Hub" },
    ],
  },
  {
    id: "a-1041",
    code: "ALT-1041",
    user: {
      name: "Jorge Llerena",
      role: "Docente",
      faculty: "FCHE · Pedagogía",
      phone: "+593 98 221 3390",
      avatar: "JL",
    },
    type: "medical",
    status: "assigned",
    zone: "Zona 1 — Ingahurco",
    location: "Biblioteca Central · Piso 2",
    coords: { x: 62, y: 28 },
    createdAt: "hace 3 min",
    description: "Reporte de mareo y caída. Estudiantes cercanos asisten.",
    guard: "G. Ramírez",
    trustGroup: ["Lucía Llerena (esposa)"],
    timeline: [
      { time: "20:39:02", event: "Alerta médica creada", actor: "App Usuario" },
      { time: "20:39:48", event: "Asumida por G. Ramírez", actor: "App Guardia" },
    ],
  },
  {
    id: "a-1040",
    code: "ALT-1040",
    user: {
      name: "Sofía Mena",
      role: "Estudiante",
      faculty: "FISEI · Electrónica",
      phone: "+593 96 554 8821",
      avatar: "SM",
    },
    type: "suspicious",
    status: "active",
    zone: "Zona 3 — Querochaca",
    location: "Sendero peatonal este",
    coords: { x: 78, y: 62 },
    createdAt: "hace 6 min",
    description: "Persona sospechosa rondando el sendero. Sin contacto físico.",
    trustGroup: ["Inés Mena (madre)"],
    timeline: [
      { time: "20:36:20", event: "Alerta de sospecha creada", actor: "App Usuario" },
    ],
  },
  {
    id: "a-1039",
    code: "ALT-1039",
    user: {
      name: "Diego Salazar",
      role: "Estudiante",
      faculty: "FCA · Contabilidad",
      phone: "+593 99 110 2245",
      avatar: "DS",
    },
    type: "panic",
    status: "closed",
    zone: "Zona 4 — Centro",
    location: "Auditorio principal",
    coords: { x: 22, y: 70 },
    createdAt: "hace 22 min",
    description: "Falsa alarma confirmada por guardia. Caso cerrado.",
    guard: "L. Vinueza",
    trustGroup: [],
    timeline: [
      { time: "20:20:10", event: "Alerta creada", actor: "App Usuario" },
      { time: "20:21:55", event: "Asumida por L. Vinueza", actor: "App Guardia" },
      { time: "20:24:30", event: "Cerrada — Falsa alarma", actor: "App Guardia" },
    ],
  },
];
