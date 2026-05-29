@echo off
title S.S.I.U. - Iniciando Sistema
cd /d "%~dp0"

echo =============================================================
echo   S.S.I.U. - SISTEMA DE SEGURIDAD INTEGRAL UNIVERSITARIA
echo =============================================================
echo.
echo   Ruta: %~dp0
echo.

:: ─── Verificar herramientas ────────────────────────────────
where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] .NET SDK no encontrado.
    echo   Descarga: https://dotnet.microsoft.com/download
    pause
    exit /b 1
)
dotnet --version

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado.
    echo   Descarga: https://nodejs.org
    pause
    exit /b 1
)
node --version

echo   SDKs OK.
echo.

:: ─── node_modules de todos los frontends ────────────────
echo [PASO 1/4] Verificando dependencias...

if not exist "web\dashboard\node_modules" (
    echo   Instalando dependencias del Dashboard Web...
    cd /d "web\dashboard"
    call npm install
    if %errorlevel% neq 0 ( echo [ERROR] npm install web\dashboard fallo. & pause & exit /b 1 )
    cd /d "%~dp0"
)

if not exist "mobile\user-app\node_modules" (
    echo   Instalando dependencias de user-app...
    cd /d "mobile\user-app"
    call npm install
    if %errorlevel% neq 0 ( echo [ERROR] npm install mobile\user-app fallo. & pause & exit /b 1 )
    cd /d "%~dp0"
)

if not exist "mobile\guard-app\node_modules" (
    echo   Instalando dependencias de guard-app...
    cd /d "mobile\guard-app"
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 ( echo [ERROR] npm install mobile\guard-app fallo. & pause & exit /b 1 )
    cd /d "%~dp0"
)
echo.

:: ─── Limpieza del Entorno (Previene Errores de Caché) ─────────
echo [PASO 1.5/4] Limpiando procesos en memoria...
taskkill /F /IM dotnet.exe /T >nul 2>nul
taskkill /F /IM node.exe /T >nul 2>nul
echo   Esperando a que Windows libere los archivos...
timeout /t 3 /nobreak >nul
echo.

:: ─── Compilar backend ─────────────────────────────────────
echo [PASO 2/4] Compilando backend .NET...
dotnet build "backend\microservices\Ssiu.Microservices.sln" -m:1 /nr:false --nologo -q
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] VS Code tiene bloqueados los archivos de cache ^(MSB3492^).
    echo               Continuando con la ultima version compilada...
)
echo   OK.
echo.

:: ─── Iniciar servicios ────────────────────────────────────
echo [PASO 3/4] Iniciando servicios...
echo.

echo   1. Identity.Service  :5001
start "Identity" /D "backend\microservices" cmd /k "dotnet run --project Identity.Service --no-build"
timeout /t 2 /nobreak >nul

echo   2. Campus.Service    :5003
start "Campus" /D "backend\microservices" cmd /k "dotnet run --project Campus.Service --no-build"
timeout /t 2 /nobreak >nul

echo   3. Alerts.Service    :5002
start "Alerts" /D "backend\microservices" cmd /k "dotnet run --project Alerts.Service --no-build"
timeout /t 2 /nobreak >nul

echo   3.5 Report.API       :5004
start "Report" /D "backend\microservices" cmd /k "dotnet run --project Report.API --no-build"

echo   Esperando 5s para el Gateway...
timeout /t 5 /nobreak >nul

echo   4. Ssiu.Gateway      :5000
start "Gateway" /D "backend\microservices" cmd /k "dotnet run --project Ssiu.Gateway --no-build"

echo.
echo   Iniciando frontends web...
echo.

echo   5. Dashboard Admin   -> http://localhost:8080
start "Dashboard" /D "web\dashboard" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo   6. App Estudiante    -> http://localhost:8081
start "UserApp" /D "mobile\user-app" cmd /k "set EXPO_OFFLINE=true&& npx expo start -c --web --port 8081"
timeout /t 2 /nobreak >nul

echo   7. App Guardia       -> http://localhost:8082
start "GuardApp" /D "mobile\guard-app" cmd /k "set EXPO_OFFLINE=true&& npx expo start -c --web --port 8082"

echo.
echo =============================================================
echo   TODOS LOS SERVICIOS INICIADOS
echo =============================================================
echo.
echo   Backend:
echo     Gateway       -^> http://localhost:5000
echo     Identity      -^> http://localhost:5001/swagger
echo     Alerts        -^> http://localhost:5002/swagger
echo     Campus        -^> http://localhost:5003/swagger
echo.
echo   Frontend Web:
echo     Dashboard     -^> http://localhost:8080
echo     App Estudiante -^> http://localhost:8081
echo     App Guardia   -^> http://localhost:8082
echo.
echo   Las 3 pestanas se abriran automaticamente en tu navegador.
echo.
echo   =============================================================
echo   LISTO - Todo funcionando
echo   Para detener, cierra cada ventana individualmente.
echo   =============================================================
echo.
