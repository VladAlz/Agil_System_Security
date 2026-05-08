# S.S.I.U. — Sistema de Seguridad Integral Universitaria
**Universidad Técnica de Ambato (FISEI)**

Este es el repositorio oficial del sistema S.S.I.U. para el **Sprint 1**. El proyecto integra un Backend en .NET 8, una base de datos SQL Server, un Dashboard administrativo Web y dos Aplicaciones Móviles.

---

## 🚀 Estado del Proyecto: Sprint 1 (Integración Completa)

El sistema ha superado la fase de maqueta y ahora es **funcional al 100%** con datos reales persistidos en SQL Server.

### Componentes Activos:
*   **Backend:** API REST + SignalR (Real-time).
*   **Web Dashboard:** Panel de monitoreo para Administradores.
*   **User App:** Aplicación para estudiantes con botón de pánico de 3 segundos.
*   **Guard App:** Aplicación para guardias con notificaciones en tiempo real.

---

## 🛠️ Guía de Instalación y Ejecución

Para que el equipo pueda correr el proyecto completo localmente, sigan estos pasos:

### 1. Requisitos Previos
*   **SQL Server Express 2022** (Instalado y corriendo localmente).
*   **.NET 8 SDK**.
*   **Node.js v18+**.
*   **Expo Go** (Opcional, para probar en celular físico).

### 2. Levantar el Backend (Cerebro)
El backend debe estar encendido para que todo lo demás funcione.
```bash
cd backend/Ssiu.Api
dotnet run
```
*   **URL:** `http://localhost:5233`
*   **Swagger:** `http://localhost:5233/swagger`

### 3. Levantar el Dashboard Web (Administración)
```bash
cd web/dashboard
npm install
npm run dev
```
*   **URL:** `http://localhost:8080` (o el puerto que asigne Vite).
*   **Login:** `admin@uta.edu.ec` / `admin123`

### 4. Levantar Aplicaciones Móviles (Usuario y Guardia)
Deben abrirse en terminales separadas:

**App del Usuario:**
```bash
cd mobile/user-app
npm install
npx expo start --web
```
*   **Login:** `estudiante@uta.edu.ec` / `student123`

**App del Guardia:**
```bash
cd mobile/guard-app
npm install
npx expo start --web
```
*   **Login:** `guardia1@uta.edu.ec` / `guard123`

---

## 📋 Pendientes para el Cierre Total (Último 5%)

Como **Tech Lead**, he identificado las últimas tareas para llegar al 100% de la planificación oficial del Sprint 1:

### 🔴 [TAREA T04-02] — Algoritmo de Detección de Zona
*   **Responsable:** **Willian**
*   **Descripción:** Actualmente, las alertas se asignan a la "Zona 1" por defecto. Falta implementar el algoritmo matemático en el `AlertsController.cs` para que, según las coordenadas GPS enviadas por el estudiante, el sistema identifique automáticamente si pertenece a la Zona 1, 2, 3 o 4.

### 🔴 [TAREA T02-09/10] — Pruebas de Calidad (QA)
*   **Responsable:** **Vladimir**
*   **Descripción:** Se requiere crear el archivo formal de pruebas unitarias para el módulo de alertas. Se debe verificar que:
    1. La alerta se cree correctamente en la BD.
    2. La notificación llegue al SignalR Hub.
    3. El sistema rechace coordenadas fuera del campus.

---

## 👥 Equipo de Desarrollo
*   **Alen:** Tech Lead / Backend & Arquitectura.
*   **Gaby:** Frontend Web / Dashboard.
*   **Willian:** Mobile Developer (Guard App).
*   **Vladimir:** Mobile Developer (User App) / QA Manager.
