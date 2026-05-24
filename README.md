# S.S.I.U. — Sistema de Seguridad Integral Universitaria
**Universidad Técnica de Ambato (FISEI)**

Este es el repositorio oficial del sistema S.S.I.U. El proyecto ha migrado de un monolito a una **Arquitectura de Microservicios** en .NET 8, bases de datos SQL Server independientes por servicio, un API Gateway (Ocelot) y Aplicaciones Móviles dinámicas.

---

## 🚀 Arquitectura y Estado (Microservicios)

El sistema ahora está desacoplado y funciona de forma distribuida:
*   **Identity.Service (5001):** Gestión de usuarios, autenticación y base de datos `SsiuIdentityDb`.
*   **Alerts.Service (5002):** Almacenamiento desnormalizado de alertas (`SsiuAlertsDb`) y WebSockets en tiempo real vía SignalR.
*   **Campus.Service (5003):** Gestión de zonas geográficas (`SsiuCampusDb`).
*   **Report.API (5004):** Gestión de turnos de guardia (`SsiuReportDb`), métricas y cálculo de estadísticas avanzadas.
*   **Ssiu.Gateway (5000):** Ocelot API Gateway. Todo el tráfico HTTP pasa por aquí.

---

## 🛠️ Guía de Ejecución para el Equipo (8 Terminales Necesarias)

Para correr el proyecto completo en tu PC local, debes abrir **8 terminales** y ejecutar los siguientes comandos en orden.

### 💻 1. Levantar los Microservicios (Backend)
Debes abrir **5 terminales**, una por cada proyecto dentro de la carpeta `backend/microservices`:

**Terminal 1 (Identidad):**
```bash
cd backend/microservices/Identity.Service
dotnet run
```

**Terminal 2 (Alertas y SignalR):**
```bash
cd backend/microservices/Alerts.Service
dotnet run
```

**Terminal 3 (Zonas y Campus):**
```bash
cd backend/microservices/Campus.Service
dotnet run
```

**Terminal 4 (API de Reportes y Estadísticas):**
```bash
cd backend/microservices/Report.API
dotnet run
```

**Terminal 5 (API Gateway):**
```bash
cd backend/microservices/Ssiu.Gateway
dotnet run
```

---

## 🗄️ Sincronización de Base de Datos (EF Core Migrations)

Si es la primera vez que clonas el repo o si ha habido cambios en las tablas, debes sincronizar tu base de datos local de SQL Server.

**Importante:** Ejecuta estos comandos para crear o actualizar las tablas en tu PC:

1. **Tablas de Identidad:**
   ```bash
   cd backend/microservices/Identity.Service
   dotnet ef database update
   ```

2. **Tablas de Alertas:**
   ```bash
   cd backend/microservices/Alerts.Service
   dotnet ef database update
   ```

3. **Tablas de Campus/Zonas:**
   ```bash
   cd backend/microservices/Campus.Service
   dotnet ef database update
   ```

4. **Tablas de Reportes y Turnos:**
   ```bash
   cd backend/microservices/Report.API
   dotnet ef database update
   ```

*(Nota: Si no tienes instalada la herramienta de EF Core, ejecuta `dotnet tool install --global dotnet-ef` primero).*

---

### 🖥️ 2. Levantar los Frontends (Móvil y Web)

**Terminal 6 (App Estudiante - Móvil):**
*Nota:* Las apps móviles detectan tu IP Wi-Fi automáticamente.
```bash
cd mobile/user-app
npx expo start
```

**Terminal 7 (App Guardia - Móvil):**
```bash
cd mobile/guard-app
npx expo start
```

**Terminal 8 (Panel Web de Administración - Dashboard):**
```bash
cd web/dashboard
npm install
npm run dev
```

---

## 👁️ ¿Cómo ver los cambios realizados en el Frontend (Sprint 2)?

Para validar las nuevas funcionalidades implementadas en el panel web, sigue estos pasos:

1. Levanta los microservicios y el panel web de administración (`web/dashboard`).
2. Abre la URL en tu navegador (típicamente `http://localhost:5173`).
3. Inicia sesión con la credencial de administrador: `admin@uta.edu.ec` / `admin123`.

### Funcionalidades a Validar:

*   **Gestión de Turnos (HU-08):**
    *   Ve al menú **Turnos** en la barra lateral (o accede a `/shifts`).
    *   Usa el botón **"Abrir Turno"** para simular la asignación de un guardia y una zona de patrullaje.
    *   Para finalizar un turno, haz clic en **"Cerrar Turno"**; se abrirá un modal donde podrás registrar el número de alertas resueltas y el tiempo de respuesta promedio del turno.
    *   Puedes exportar el historial de turnos en formato **CSV** usando el botón de exportar.
*   **Visualización y Marcadores en Tiempo Real (HU-06):**
    *   En la vista del **Mapa** (pantalla principal `/`), los marcadores cambian de color, emoji e información en tiempo real sin necesidad de recargar el navegador, reaccionando a los eventos de SignalR en Alerts.Service.
*   **Historial de Alertas (HU-07):**
    *   En la pantalla principal `/`, el componente **Historial** ahora realiza peticiones reales al endpoint `GET /api/alerts?estado=Cerrada&pageSize=50`.
    *   Si los servicios de backend están activos, verás una etiqueta verde **"LIVE"** en el panel; de lo contrario, se degradará de manera elegante y transparente a datos simulados (**"DEMO"**).
*   **Estadísticas Avanzadas (HU-07):**
    *   En la página de **Estadísticas** (`/statistics`), los datos del dashboard y los gráficos consumen endpoints en tiempo real provistos por `Report.API` (`/api/stats/...`), incluyendo el cálculo del tiempo promedio de respuesta basado en las marcas temporales de creación y aceptación de cada alerta.

---

## 🔑 Credenciales por Defecto (Modo Desarrollo)

Las bases de datos se crean y pueblan automáticamente. Las contraseñas ahora se guardan en **texto plano** en el `IdentityDbContext` para facilitar el ingreso de usuarios directo desde SQL Server Management Studio (SSMS).

*   **Administrador:** `admin@uta.edu.ec` / `admin123`
*   **Guardia:** `guardia1@uta.edu.ec` / `guard123`
*   **Estudiante 1:** `estudiante@uta.edu.ec` / `student123`
*   **Estudiante 2:** `carlos.perez2@uta.edu.ec` / `perez123password`

*(Para agregar más estudiantes, simplemente haz un `INSERT` en la tabla `Users` de la base de datos `SsiuIdentityDb` usando SSMS).*

---

## 💡 Tips de Solución de Errores
*   **Conexión en celular:** Si la app en tu teléfono físico se queda cargando eternamente, **desactiva el Firewall de Windows Defender**. Este bloquea los puertos 5000, 5001 y 5002 por defecto.
*   **Bases de Datos Viejas:** Si hay errores de esquema al correr `dotnet run`, abre SSMS y elimina las bases de datos `SsiuIdentityDb`, `SsiuAlertsDb`, `SsiuCampusDb` y `SsiuReportDb` (`DROP DATABASE...`). Al volver a correr, se crearán limpias.
*   **IP Dinámica:** Si Expo no logra extraer tu IP, el código hace un fallback seguro a la última IP registrada (`192.168.1.61`). Si estás en otra red, modifica temporalmente ese fallback en los archivos `config/api.ts` de cada app.

---

## 👥 Equipo de Desarrollo
*   **Alen:** Tech Lead / Backend & Arquitectura.
*   **Gaby:** Frontend Web / Dashboard.
*   **Willian:** Mobile Developer (Guard App).
*   **Vladimir:** Mobile Developer (User App) / QA Manager.
