#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_color() {
    echo -e "${2}${1}${NC}"
}

# Função para verificar comando
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_color "❌ ERRO: $1 não encontrado!" $RED
        print_color "Por favor, instale $1 para continuar." $YELLOW
        exit 1
    fi
}

clear
print_color "=======================================================" $BLUE
print_color "              SALES MANAGER - GARAGEM 67" $BLUE
print_color "=======================================================" $BLUE
echo

# Verificar se Node.js está instalado
print_color "🔍 Verificando dependências..." $BLUE
check_command node
check_command npm

print_color "✅ Node.js e npm verificados" $GREEN
echo

# Verificar se as pastas existem
if [ ! -d "backend" ]; then
    print_color "❌ ERRO: Pasta 'backend' não encontrada!" $RED
    exit 1
fi

if [ ! -d "frontend" ]; then
    print_color "❌ ERRO: Pasta 'frontend' não encontrada!" $RED
    exit 1
fi

print_color "✅ Estrutura de pastas verificada" $GREEN
echo

# Inicializar banco de dados se não existir
if [ ! -d "backend/database" ]; then
    print_color "📦 Inicializando banco de dados..." $BLUE
    cd backend
    npm run init-db
    if [ $? -ne 0 ]; then
        print_color "❌ Erro ao inicializar banco de dados" $RED
        exit 1
    fi
    cd ..
fi

# Verificar dependências do backend
if [ ! -d "backend/node_modules" ]; then
    print_color "📦 Instalando dependências do backend..." $BLUE
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        print_color "❌ Erro ao instalar dependências do backend" $RED
        exit 1
    fi
    cd ..
fi

# Verificar dependências do frontend
if [ ! -d "frontend/node_modules" ]; then
    print_color "📦 Instalando dependências do frontend..." $BLUE
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        print_color "❌ Erro ao instalar dependências do frontend" $RED
        exit 1
    fi
    cd ..
fi

print_color "✅ Dependências verificadas" $GREEN
echo

# Verificar arquivo .env
if [ ! -f "backend/.env" ]; then
    print_color "⚠️  AVISO: Arquivo .env não encontrado no backend" $YELLOW
    echo
    print_color "Criando arquivo .env de exemplo..." $BLUE
    
    cat > backend/.env << EOF
# Servidor
PORT=3002
NODE_ENV=development

# Segurança
JWT_SECRET=seu_jwt_secret_aqui_2025_sales_manager

# Firebase (Garagem67)
FIREBASE_PROJECT_ID=garagem67-c38cf
FIREBASE_PRIVATE_KEY_ID=sua_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@garagem67-c38cf.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=105355846483629887329
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40garagem67-c38cf.iam.gserviceaccount.com

# URLs dos Sistemas
GARAGEM67_URL=https://garagem67.vercel.app
ENTREGADOR67_URL=https://entregador67-production.up.railway.app

# Banco de Dados
DB_PATH=./database/sales_manager.db
EOF
    
    print_color "⚠️  Configure o arquivo backend/.env com suas credenciais do Firebase" $YELLOW
    echo
fi

print_color "🚀 Iniciando Sales Manager..." $BLUE
echo

# Iniciar backend em background
print_color "📡 Iniciando Backend (Porta 3002)..." $BLUE
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
print_color "⏳ Aguardando backend inicializar..." $BLUE
sleep 8

# Verificar se backend está rodando
if curl -s http://localhost:3002/api/health > /dev/null; then
    print_color "✅ Backend inicializado com sucesso" $GREEN
else
    print_color "❌ Erro: Backend não responde na porta 3002" $RED
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Iniciar frontend
print_color "🖥️  Iniciando Frontend (Electron)..." $BLUE
cd frontend

# Detectar sistema operacional para abrir Electron
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    npm start &
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    npm start &
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows (via WSL)
    print_color "⚠️  Execute o inicializador .bat para Windows" $YELLOW
else
    npm start &
fi

FRONTEND_PID=$!
cd ..

echo
print_color "=======================================================" $GREEN
print_color "✅ SISTEMA INICIADO COM SUCESSO!" $GREEN
echo
print_color "📊 Backend:  http://localhost:3002" $BLUE
print_color "🖥️  Frontend: Aplicação Electron" $BLUE
echo
print_color "🔑 Credenciais padrão:" $YELLOW
print_color "   Usuário: admin" $YELLOW
print_color "   Senha:  admin123" $YELLOW
echo
print_color "⚡ PIDs dos processos:" $BLUE
print_color "   Backend:  $BACKEND_PID" $BLUE
print_color "   Frontend: $FRONTEND_PID" $BLUE
echo
print_color "🛑 Para parar o sistema, use: Ctrl+C" $YELLOW
print_color "=======================================================" $GREEN
echo

# Função para limpeza ao sair
cleanup() {
    print_color "\n🛑 Parando Sales Manager..." $YELLOW
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    print_color "✅ Sistema finalizado" $GREEN
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Manter script rodando
print_color "⏳ Pressione Ctrl+C para parar o sistema..." $BLUE
wait