FROM node:18-alpine

WORKDIR /app

# Instalar dependências de compilação (incluindo Python)
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Copiar arquivos de dependências
COPY package*.json ./
COPY .env.docker .env

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Criar diretório do banco de dados
RUN mkdir -p database

# Expor porta
EXPOSE 3002

# Comando de inicialização
CMD ["npm", "start"]