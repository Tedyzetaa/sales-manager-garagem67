@echo off
chcp 65001 >nul
title Sales Manager - Garagem 67
color 0A

echo.
echo =======================================================
echo              SALES MANAGER - GARAGEM 67
echo =======================================================
echo.

:: Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js 16+ em:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Verificar se npm está disponível
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: npm não encontrado!
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js e npm verificados
echo.

:: Verificar se as pastas existem
if not exist "backend" (
    echo ❌ ERRO: Pasta 'backend' não encontrada!
    echo.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ ERRO: Pasta 'frontend' não encontrada!
    echo.
    pause
    exit /b 1
)

echo ✅ Estrutura de pastas verificada
echo.

:: Inicializar banco de dados se não existir
if not exist "backend\database" (
    echo 📦 Inicializando banco de dados...
    cd backend
    call npm run init-db
    if errorlevel 1 (
        echo ❌ Erro ao inicializar banco de dados
        echo.
        pause
        exit /b 1
    )
    cd ..
)

:: Verificar dependências do backend
if not exist "backend\node_modules" (
    echo 📦 Instalando dependências do backend...
    cd backend
    call npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências do backend
        echo.
        pause
        exit /b 1
    )
    cd ..
)

:: Verificar dependências do frontend
if not exist "frontend\node_modules" (
    echo 📦 Instalando dependências do frontend...
    cd frontend
    call npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências do frontend
        echo.
        pause
        exit /b 1
    )
    cd ..
)

echo ✅ Dependências verificadas
echo.

:: Verificar arquivo .env
if not exist "backend\.env" (
    echo ⚠️  AVISO: Arquivo .env não encontrado no backend
    echo.
    echo Criando arquivo .env de exemplo...
    echo.
    
    (
        echo # Servidor
        echo PORT=3002
        echo NODE_ENV=development
        echo.
        echo # Segurança
        echo JWT_SECRET=seu_jwt_secret_aqui_2025_sales_manager
        echo.
        echo # Firebase (Garagem67)
        echo FIREBASE_PROJECT_ID=garagem67-c38cf
        echo FIREBASE_PRIVATE_KEY_ID=sua_private_key_id
        echo FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua_private_key\n-----END PRIVATE KEY-----\n"
        echo FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@garagem67-c38cf.iam.gserviceaccount.com
        echo FIREBASE_CLIENT_ID=105355846483629887329
        echo FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%%40garagem67-c38cf.iam.gserviceaccount.com
        echo.
        echo # URLs dos Sistemas
        echo GARAGEM67_URL=https://garagem67.vercel.app
        echo ENTREGADOR67_URL=https://entregador67-production.up.railway.app
        echo.
        echo # Banco de Dados
        echo DB_PATH=./database/sales_manager.db
    ) > "backend\.env"
    
    echo ⚠️  Configure o arquivo backend\.env com suas credenciais do Firebase
    echo.
)

echo 🚀 Iniciando Sales Manager...
echo.

:: Iniciar backend em uma nova janela
echo 📡 Iniciando Backend (Porta 3002)...
start "Sales Manager - Backend" cmd /k "cd backend && npm start"

:: Aguardar backend inicializar
echo ⏳ Aguardando backend inicializar...
timeout /t 5 /nobreak >nul

:: Iniciar frontend em uma nova janela
echo 🖥️  Iniciando Frontend (Electron)...
start "Sales Manager - Frontend" cmd /k "cd frontend && npm start"

echo.
echo =======================================================
echo ✅ SISTEMA INICIADO COM SUCESSO!
echo.
echo 📊 Backend:  http://localhost:3002
echo 🖥️  Frontend: Aplicação Electron
echo.
echo 🔑 Credenciais padrão:
echo    Usuário: admin
echo    Senha:  admin123
echo.
echo ⏳ Aguarde alguns segundos para ambas as janelas carregarem
echo =======================================================
echo.

:: Manter janela principal aberta
echo Pressione qualquer tecla para fechar este inicializador...
pause >nul