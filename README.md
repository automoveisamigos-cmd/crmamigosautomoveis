# CRM Amigos Automóveis

## Stack
Backend: Node.js + Prisma + SQLite (dev) / Postgres (prod) | Porta 3000  
Frontend: React + Vite + Tailwind | VITE_API_URL → backend /api

## Endpoints relevantes para IA
| Rota | Controller | Função |
|---|---|---|
| POST /api/leads/upsert | LeadController | Cria/atualiza lead + score |
| GET /api/veiculos | VeiculoController | Retorna estoque + urgencia |

## Regras de negócio (não altere sem alinhamento)
- Score: +20 veiculo_interesse preenchido, +30 tipo_compra preenchido
- Urgência Alta → campo `urgencia: "Alta"` no retorno do GET /api/veiculos
- Flag fora de horário: 18:00–08:00 → `flag_fora_horario: true` no upsert

## Integrações externas
- n8n webhook: N8N_WEBHOOK_URL no .env
- Portais: Mobiauto, Napista, Webmotors (tokens no .env do Render)
