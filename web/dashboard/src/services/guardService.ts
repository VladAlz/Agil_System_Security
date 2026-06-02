// ─── guardService.ts — Guardias reales para asignación de turnos (HU-14) ──────
// Consulta Identity.Service (GET /api/auth/guards vía Gateway :5000) para poblar
// el selector de guardias del modal de apertura de turno.

import { API_URL } from "@/config/api";

export interface Guard {
  id: number;            // Identificador estable usado como guardiaId del turno
  usuarioId: number;
  guardId: number | null;
  nombre: string;
  correo: string;
  zonaId: number | null;
  estado: string;        // "En Servicio" | "Descansando" | "Disponible"
}

/**
 * Lista los guardias registrados en la base de datos (HU-14).
 * Endpoint público de Identity; se envía el token si existe por consistencia.
 */
export async function fetchGuards(): Promise<Guard[]> {
  const token = localStorage.getItem("ssiu_token") ?? "";
  const resp = await fetch(`${API_URL}/auth/guards`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  return resp.json() as Promise<Guard[]>;
}
