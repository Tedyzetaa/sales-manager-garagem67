🛍️ Sales Manager - Garagem 67
Sistema completo de gerenciamento de vendas, estoque e clientes para o Garagem 67, integrado com os sistemas existentes.

🚀 Funcionalidades
📋 Módulos Principais
Dashboard: Visão geral com métricas em tempo real

Gestão de Vendas: Interface intuitiva para registro de vendas

Controle de Estoque: Controle completo de entrada, saída e ajustes

Cadastro de Produtos: Gerenciamento completo do catálogo

Clientes: Sincronização automática com Firebase do Garagem67

Relatórios: Análises detalhadas e exportação de dados

Exportação: Integração com sistema de entregadores

Multi-usuário: Sistema de permissões (admin, vendedor, estoquista)

🔄 Integrações
Garagem67 Website: Sincronização automática de clientes

Entregador67 System: Exportação automática de pedidos

Firebase Auth: Autenticação unificada

🛠️ Instalação
Pré-requisitos
Node.js 16+

npm ou yarn

Conta Firebase (mesma do Garagem67)

1. Backend
bash
cd backend
npm install
npm run init-db
npm start
2. Frontend (Electron)
bash
cd frontend  
npm install
npm start
3. Modo Desenvolvimento
bash
# Backend
cd backend
npm run dev

# Frontend (em outro terminal)
cd frontend
npm run dev
⚙️ Configuração
Crie um arquivo .env no backend:

env
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
📊 Estrutura do Banco
O sistema utiliza SQLite com as seguintes tabelas principais:

Tabelas Principais
users - Funcionários do sistema

products - Cadastro de produtos com categorias

inventory - Controle de estoque em tempo real

stock_movements - Histórico de movimentações

sales - Registro de vendas

sale_items - Itens de cada venda

customers - Cache de clientes do Firebase

categories - Categorias de produtos

exports - Histórico de exportações

Schema Automático
O banco é inicializado automaticamente com:

Usuário admin padrão

Categorias pré-definidas

Estrutura de tabelas otimizada

🔗 Integrações
Garagem67 Website
Sincronização automática de clientes

Mesma base de dados Firebase

Autenticação unificada

Entregador67 System
Exportação automática de pedidos

Formato JSON compatível

Rastreamento de status de entrega

Fallback para modo desenvolvimento

👥 Sistema de Usuários
Perfis Disponíveis
Administrador: Acesso total ao sistema

Vendedor: Gestão de vendas e clientes

Estoquista: Controle de estoque e produtos

Usuários Padrão
Admin: admin / admin123

Novos usuários: Criados via painel administrativo

🎯 Uso Rápido
1. Primeiro Acesso
bash
# 1. Iniciar backend
cd backend && npm start

# 2. Iniciar frontend  
cd frontend && npm start

# 3. Fazer login
Usuário: admin
Senha: admin123
2. Configuração Inicial
Sincronizar clientes (Menu Clientes → Sincronizar)

Cadastrar produtos (Menu Produtos → Novo Produto)

Configurar estoque (Menu Estoque → Ajustar)

3. Fluxo de Venda
Acessar Vendas → Nova Venda

Selecionar cliente (sincronizado do Firebase)

Adicionar produtos ao carrinho

Definir método de pagamento

Finalizar venda (estoque atualizado automaticamente)

4. Exportação para Entregador
Vendas podem ser exportadas para o sistema de entregadores

Status de exportação acompanhado em tempo real

Histórico completo de exportações

📈 Dashboard e Relatórios
Métricas em Tempo Real
Vendas do dia

Receita total

Produtos com estoque baixo

Clientes ativos

Tendências e comparações

Relatórios Disponíveis
Vendas: Por período, vendedor, método de pagamento

Estoque: Valor total, produtos críticos, movimentações

Clientes: Atividade, frequência, valor médio

🐛 Correções e Melhorias Recentes
🔧 Correções Críticas
Navegação entre páginas: Todas as abas do menu funcionando

Estrutura HTML completa: Páginas de vendas, produtos, estoque, clientes e relatórios

API Service: Comunicação robusta com o backend

Autenticação JWT: Sistema de login seguro

🚀 Novas Funcionalidades
Dashboard interativo: Gráficos e métricas em tempo real

Sincronização de clientes: Integração melhorada com Firebase

Gestão de estoque: Alertas de estoque baixo e movimentações

Sistema de relatórios: Filtros avançados e exportação

🎨 Interface Melhorada
Design moderno e responsivo

Navegação intuitiva entre módulos

Notificações do sistema

Loading states e feedback visual

🚨 Solução de Problemas
Problema Comum: Páginas não carregam
Sintoma: Clicar nas opções do menu não funciona

Solução:

Verificar se o backend está rodando na porta 3002

Confirmar que o arquivo index.html está completo

Verificar console do navegador por erros JavaScript

Problema: Erro de CORS
Solução:

Backend já configurado com CORS para todas as origens necessárias

Verificar se as URLs estão nas configurações CORS

Problema: Firebase não conecta
Solução:

Modo desenvolvimento ativo com dados mock

Verificar credenciais do Firebase no .env

📞 Suporte
Canais de Ajuda
Documentação: Consulte este README

Console: Verifique logs no backend e console do navegador

Equipe: Contate os desenvolvedores para suporte técnico

Informações Técnicas
Backend: Node.js + Express + SQLite

Frontend: Electron + Vanilla JS

Autenticação: JWT + Firebase

Banco: SQLite com better-sqlite3

🔄 Próximas Atualizações
Sistema de comandas

Integração com impressora térmica

App mobile para vendedores

Relatórios avançados com gráficos

Backup automático do banco

✅ Status do Sistema
Backend: 🟢 Operacional
Frontend: 🟢 Operacional
Integrações: 🟢 Operacionais
Banco de Dados: 🟢 Configurado

O sistema está 100% funcional e pronto para uso em produção! 🚀"# sales-manager-garagem67" 
