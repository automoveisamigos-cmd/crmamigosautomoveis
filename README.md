# CRM Amigos Automóveis

Este é o repositório do CRM "Amigos Automóveis", focado na gestão de leads, inventário e produtividade, com integrações IA via webhooks n8n.

## Requisitos

- Node.js (v18 ou superior)
- NPM ou Yarn

## Estrutura Pronta para Boot

O sistema foi arquitetado de forma autônoma e as seguintes funcionalidades foram distribuídas:

1. **Inteligência de Vendas (Backend)**
   - **Score de Leads:** Lógica implementada em `backend/src/controllers/LeadController.ts` que aumenta o score do Lead quando ele preenche `veiculo_interesse` (+20) e `tipo_compra` (+30).
   - **Gatilho de Venda/Urgência:** Endpoint em `backend/src/controllers/VeiculoController.ts` que retorna dicas de urgência para a IA quando a demanda do veículo for 'Alta'.
   - **Flag de Horário:** Validação para marcar `flag_fora_horario` entre 18:00 e 08:00 no upsert do Lead.

2. **Dashboard Avançado (Frontend)**
   - **ROI de Disponibilidade:** Cálculo estimando conversão x ticket médio (R$ 80k) em `frontend/src/pages/Dashboard.tsx`.
   - **Gráficos Recharts:** Impacto da IA (totais vs fora horário) e Veículos Mais Procurados inseridos no Dashboard.

3. **Kanban & UI UX (Frontend)**
   - **Visual Dark Mode:** Cores brand e fundo escuro implementadas em `frontend/tailwind.config.js` e `frontend/src/index.css`.
   - **Drag-and-Drop e Cores de Alerta:** Utilizando `@hello-pangea/dnd` em `frontend/src/components/KanbanBoard.tsx`, incluindo lógica de borda "pulsante" vermelha quando o lead passa > 12h sem interação (`border-pulse-danger`).

## Configuração de Ambiente

Na raiz do projeto (`/crm-amigos-automoveis`), crie ou edite o arquivo `.env` com:

```env
DATABASE_URL="file:./dev.db"
N8N_WEBHOOK_URL="https://seu-n8n.com/webhook/amigos"
PORT=3000
```

## Como Rodar o Projeto Localmente

### 1. Iniciar o Backend

Abra um terminal e acesse a pasta `backend`:

```bash
cd backend
npm install

# Rodar a migração do banco de dados (SQLite) para gerar as tabelas
npx prisma migrate dev --name init

# Iniciar o servidor de desenvolvimento
npm run dev
```

O backend estará rodando em `http://localhost:3000`.

### 2. Iniciar o Frontend

Abra **outro** terminal e acesse a pasta `frontend`:

```bash
cd frontend
npm install

# Iniciar o Vite
npm run dev
```

O frontend estará rodando normalmente em `http://localhost:5173`. Todas as requisições para `/api` serão direcionadas para o backend via proxy configurado no Vite.

---

**Fim das Instruções de Deploy.**
