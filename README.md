# S.S.I.U. — Sistema de Seguridad Integral Universitaria
**Universidad Técnica de Ambato (FISEI)**

Este es el repositorio oficial del sistema S.S.I.U. El proyecto ha migrado de un monolito a una **Arquitectura de Microservicios** en .NET 8, bases de datos SQL Server independientes por servicio, un API Gateway (Ocelot) y Aplicaciones Móviles dinámicas.

---

## 🚀 Arquitectura y Estado (Microservicios)

El sistema ahora está desacoplado y funciona de forma distribuida:
*   **Identity.Service (5001):** Gestión de usuarios, autenticación y base de datos `SsiuIdentityDb`.
*   **Alerts.Service (5002):** Almacenamiento desnormalizado de alertas (`SsiuAlertsDb`) y WebSockets en tiempo real vía SignalR.
*   **Campus.Service (5003):** Gestión de zonas geográficas (`SsiuCampusDb`).
*   **Ssiu.Gateway (5000):** Ocelot API Gateway. Todo el tráfico HTTP pasa por aquí.

---

## 🛠️ Guía de Ejecución para el Equipo (6 Terminales Necesarias)

Para correr el proyecto completo en tu PC local, debes abrir **6 terminales** y ejecutar los siguientes comandos en orden.

### 💻 1. Levantar los Microservicios (Backend)
Debes abrir **4 terminales**, una por cada proyecto dentro de la carpeta `backend/microservices`:

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

**Terminal 4 (API Gateway):**
```bash
cd backend/microservices/Ssiu.Gateway
dotnet run
```

---

## 🗄️ Sincronización de Base de Datos (EF Core Migrations)

Si es la primera vez que clonas el repo o si ha habido cambios en las tablas, debes sincronizar tu base de datos local de SQL Server.

**Importante:** Ejecuta estos 3 comandos en terminales diferentes para que se creen las tablas en tu PC:

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

*(Nota: Si no tienes instalada la herramienta de EF Core, ejecuta `dotnet tool install --global dotnet-ef` primero).*

---

### 📱 2. Levantar los Frontends (Móviles)
*Nota:* Las apps ya detectan tu IP Wi-Fi automáticamente gracias a `expo-constants`. No necesitas cambiar la IP manualmente.

**Terminal 5 (App Estudiante):**
```bash
cd mobile/user-app
npx expo start
```

**Terminal 6 (App Guardia):**
```bash
cd mobile/guard-app
npx expo start

```

**Terminal 6 (App Admin):**
cd web/dashboard
npm run dev
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
*   **Bases de Datos Viejas:** Si hay errores de esquema al correr `dotnet run`, abre SSMS y elimina las bases de datos `SsiuIdentityDb`, `SsiuAlertsDb` y `SsiuCampusDb` (`DROP DATABASE...`). Al volver a correr, se crearán limpias.
*   **IP Dinámica:** Si Expo no logra extraer tu IP, el código hace un fallback seguro a la última IP registrada (`192.168.1.61`). Si estás en otra red, modifica temporalmente ese fallback en los archivos `config/api.ts` de cada app.

---

## 👥 Equipo de Desarrollo
*   **Alen:** Tech Lead / Backend & Arquitectura.
*   **Gaby:** Frontend Web / Dashboard.
*   **Willian:** Mobile Developer (Guard App).
*   **Vladimir:** Mobile Developer (User App) / QA Manager.
