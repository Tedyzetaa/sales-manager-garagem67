#!/bin/bash

echo "🚀 Iniciando Sales Manager - Garagem 67"
echo "========================================"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18 ou superior."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "📁 Criando arquivo .env..."
    cp .env .env
fi

# Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Criar diretórios necessários
mkdir -p database logs

echo "🔄 Inicializando banco de dados..."
npm run init-db

echo "🎉 Configuração concluída!"
echo ""
echo "📝 Para iniciar o servidor:"
echo "   npm run dev    (desenvolvimento)"
echo "   npm start      (produção)"
echo ""
echo "📍 Servidor estará disponível em: http://localhost:3002"
echo "❤️  Health check: http://localhost:3002/api/health"