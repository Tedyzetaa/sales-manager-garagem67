#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Parando Sales Manager...${NC}"

# Encontrar e matar processos do Sales Manager
pids=$(ps aux | grep -E "(npm start|node.*server.js|electron)" | grep -v grep | awk '{print $2}')

if [ -z "$pids" ]; then
    echo -e "${GREEN}✅ Nenhum processo do Sales Manager encontrado${NC}"
else
    echo -e "${YELLOW}📋 Processos encontrados:${NC}"
    ps aux | grep -E "(npm start|node.*server.js|electron)" | grep -v grep
    
    echo -e "${YELLOW}⏳ Parando processos...${NC}"
    echo "$pids" | xargs kill -9
    
    echo -e "${GREEN}✅ Todos os processos do Sales Manager foram parados${NC}"
fi

# Limpar portas se necessário
if lsof -ti:3002 > /dev/null 2>&1; then
    echo -e "${YELLOW}🔧 Limpando porta 3002...${NC}"
    lsof -ti:3002 | xargs kill -9
    echo -e "${GREEN}✅ Porta 3002 liberada${NC}"
fi

echo -e "${GREEN}🎯 Sistema completamente parado${NC}"