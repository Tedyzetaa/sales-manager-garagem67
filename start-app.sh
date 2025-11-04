#!/bin/bash

echo "======================================"
echo "   Sales Manager - Garagem 67"
echo "======================================"

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Iniciar o backend
echo "Iniciando Backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Aguardar o backend inicializar
echo "Aguardando backend inicializar..."
sleep 5

# Iniciar o frontend
echo "Iniciando Frontend..."
cd frontend

# Verificar se estamos no Linux ou macOS e abrir terminal
if command_exists gnome-terminal; then
    gnome-terminal --title="Frontend" -- bash -c "npm start; exec bash"
elif command_exists xterm; then
    xterm -title "Frontend" -e "npm start; bash"
elif command_exists open; then
    # macOS - abrir novo terminal
    osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && npm start"'
else
    echo "Não foi possível abrir um novo terminal. Inicie o frontend manualmente:"
    echo "cd frontend && npm start"
fi

cd ..

echo ""
echo "Aplicação iniciada!"
echo "Backend: http://localhost:3002"
echo "Frontend: Electron em execução"
echo ""
echo "Pressione Ctrl+C para parar o backend"
wait $BACKEND_PID