@echo off
REM ============================================================================
REM SETUP LOCAL CHROME - Windows
REM ============================================================================
REM Ejecutar en tu ordenador Windows para conectar Chrome con el servidor.
REM
REM Uso:
REM   setup-local-chrome.bat USUARIO@IP_SERVIDOR [PUERTO]
REM ============================================================================

set SERVER=%1
set PORT=%2

if "%SERVER%"=="" (
    echo Error: Debes especificar el servidor.
    echo Uso: %0 USUARIO@IP_SERVIDOR [PUERTO]
    echo Ejemplo: %0 root@157.180.119.236
    exit /b 1
)

if "%PORT%"=="" set PORT=9222

echo ============================================
echo   Setup Local Chrome + SSH Tunnel (Windows)
echo ============================================
echo.
echo Servidor: %SERVER%
echo Puerto Chrome: %PORT%
echo.

echo Paso 1: Cerrando Chrome existente...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 >nul

echo Paso 2: Abriendo Chrome con remote debugging...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=%PORT% --user-data-dir="%USERPROFILE%\.chrome-debug-profile"

timeout /t 3 >nul

echo Paso 3: Creando tunel SSH reverso...
echo   Local :%PORT% -^> Servidor :%PORT%
echo.
echo Manten esta ventana abierta mientras uses Claude Chrome.
echo.

ssh -R %PORT%:localhost:%PORT% -N %SERVER%
