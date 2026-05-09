# S.S.I.U. — Sistema de Seguridad Integral Universitaria
**Universidad Técnica de Ambato (FISEI)**

Este es el repositorio oficial del sistema S.S.I.U. para el **Sprint 1**. El proyecto integra un Backend en .NET 8, una base de datos SQL Server, un Dashboard administrativo Web y dos Aplicaciones Móviles.

---

## 🚀 Estado del Proyecto: Sprint 1 (Integración Completa)

El sistema ha superado la fase de maqueta y ahora es **funcional al 100%** con datos reales persistidos en SQL Server.

### Componentes Activos:
*   **Backend:** API REST + SignalR (Real-time).
*   **Web Dashboard:** Panel de monitoreo con Mapa de 4 Zonas (FISEI, Auditoría, Administración, Áreas Verdes).
*   **User App:** Aplicación para estudiantes con botón de pánico de 3 segundos (Lógica de presión + Vibración).
*   **Guard App:** Aplicación para guardias (Sprint 1: Recepción de alertas).

---

## 🛠️ Guía de Ejecución para el Equipo

Para que la comunicación entre celular y PC funcione, sigan este orden estrictamente:

### 1. Preparar el Backend (IMPORTANTE)
Para que el celular físico pueda enviar alertas, el servidor debe escuchar en todas las interfaces de tu red.
1. Abre una terminal en: `backend/Ssiu.Api`
2. Ejecuta:
```bash
dotnet run --urls "http://0.0.0.0:5233"
```
> **Nota:** Verifica tu IP local (ej. `192.168.1.61`) usando `ipconfig` en Windows. Esa es la IP que usan las apps para conectarse.

### 2. Dashboard Web (Admin)
1. Abre una terminal en: `web/dashboard`
2. Ejecuta:
```bash
npm run dev
```
*   **Login:** `admin@uta.edu.ec` / `admin123`

### 3. User App (Estudiante)
Para probar en tu celular real:
1. Abre una terminal en: `mobile/user-app`
2. Ejecuta:
```bash
npx expo start
```
3. Escanea el código QR con la app **Expo Go** (Android) o la Cámara (iOS).
*   **Login Estudiante:** `estudiante@uta.edu.ec` / `student123`
*   **Login Estudiante2:** `carlos.perez2@uta.edu.ec` / `perez123password`
*   **Acción:** Mantén presionado el botón SOS por 3 segundos para activar SignalR.

### 4. Guard App (Seguridad)
1. Abre una terminal en: `mobile/guard-app`
2. Ejecuta:
```bash
npx expo start
```
*   **Login Guardia:** `guardia1@uta.edu.ec` / `guard123`

---

## 💡 Tips de Desarrollo (Sprint 1)
*   **Base de Datos:** Asegúrate de tener SQL Server corriendo. El sistema usa `Trusted_Connection=True` por defecto.
*   **Firewall:** Si el celular no conecta, intenta desactivar temporalmente el Firewall de Windows o permitir el puerto `5233`.
*   **Clean Code:** Se han eliminado los archivos `.tmp` y carpetas vacías para facilitar la navegación en el "Laberinto" de archivos.

---

## 👥 Equipo de Desarrollo
*   **Alen:** Tech Lead / Backend & Arquitectura.
*   **Gaby:** Frontend Web / Dashboard.
*   **Willian:** Mobile Developer (Guard App).
*   **Vladimir:** Mobile Developer (User App) / QA Manager.
