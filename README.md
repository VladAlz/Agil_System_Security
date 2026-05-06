# S.S.I.U. — Sistema de Seguridad Integral Universitaria

Universidad Técnica de Ambato — FISEI  
Metodología: Scrum + XP | Ciclo: Abril – Agosto 2026

## Estructura del Proyecto

| Directorio | Descripción | Responsable |
|---|---|---|
| `mobile/user-app/` | App Usuarios — Botón de Pánico (Expo) | Vladimir |
| `mobile/guard-app/` | App Guardias — Mapa y Alertas (Expo) | Wilian |
| `web/dashboard/` | Dashboard Admin — Monitoreo (React + Vite) | Gaby |
| `backend/` | Microservicios .NET Core 8 | Alen |

## Stack Tecnológico

- **Backend:** .NET Core 8 + EF Core + SQL Server + SignalR
- **Web:** React 18 + TypeScript + Vite + TailwindCSS
- **Mobile:** React Native + Expo + TypeScript
- **Mapas:** Google Maps (Integración nativa e Iframe sin API Key para desarrollo)

---

## Resultados del Sprint 1 (MVP Interfaces)
Durante el Sprint 1 se finalizaron las interfaces principales y los flujos simulados (Mock Data) para la presentación:
1. **App Usuarios:** Interfaz de login, botón de pánico con retardo de seguridad y pantalla de confirmación.
2. **Dashboard Web:** Interfaz administrativa de monitoreo, lista de alertas en tiempo real simulada y panel de detalles con **Google Maps Satelital** centrado en la UTA (-1.267584, -78.624025).
3. **App Guardias:** Dashboard móvil para guardias con visualización de alertas y mapa táctico integrado.

*(Nota: La integración real con la base de datos y SignalR se abordará en el Sprint 2).*

---

## Guía de Instalación y Ejecución (Para el Equipo)

Para ver los resultados del Sprint 1, cada miembro debe ejecutar los 3 proyectos simultáneamente en terminales separadas.

### Requisitos Previos
- Tener instalado **Node.js** (v18+ recomendado).
- (Opcional) Instalar la app "Expo Go" en tu celular para escanear los códigos QR.

### 1. Ejecutar el Dashboard Web (Administradores)
Abre una terminal y ejecuta:
```bash
cd web/dashboard
npm install
npm run dev -- --force
```
👉 Abre tu navegador en la URL que indique la terminal (ej: `http://localhost:8080` o `http://localhost:8083`).

### 2. Ejecutar la App de Usuarios (Botón de Pánico)
Abre una **nueva** terminal y ejecuta:
```bash
cd mobile/user-app
npm install
npx expo start
```
👉 Presiona `w` en la terminal para abrirlo en el navegador web (ej: `localhost:8081`), o escanea el QR con Expo Go.

### 3. Ejecutar la App de Guardias
Abre una **tercera** terminal y ejecuta:
```bash
cd mobile/guard-app
npm install --legacy-peer-deps
npx expo start
```
*(Nota: usamos `--legacy-peer-deps` en guard-app para evitar conflictos de dependencias con React Navigation).*
👉 Presiona `w` en la terminal para abrirlo en el navegador web (ej: `localhost:8082`), o escanea el QR con Expo Go.

---

## Sprints

| Sprint | Período | Meta |
|---|---|---|
| Sprint 0 | 27–28 Abr | Infraestructura y entornos |
| Sprint 1 | 29 Abr – 12 May | Auth JWT simulada · Botón de Pánico · UI Dashboard · Mapa UTA |
| Sprint 2 | TBD | Integración .NET Backend, Base de Datos SQL y SignalR |
| Sprint 3 | TBD | Cierre, QA y despliegue |

## Daily Standup

Todos los días a las 22:00h — máximo 15 minutos.
