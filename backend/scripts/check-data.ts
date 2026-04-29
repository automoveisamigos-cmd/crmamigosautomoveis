import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const veiculos = await prisma.veiculo.count();
  const membros = await prisma.usuario.count();
  const atividades = await prisma.tarefa.count();
  const leads = await prisma.lead.count();

  console.log(`[DIAGNÓSTICO] Banco de dados: dev.db`);
  console.log(`- Veículos (Estoque): ${veiculos}`);
  console.log(`- Equipe (Usuários): ${membros}`);
  console.log(`- Atividades (Tarefas): ${atividades}`);
  console.log(`- Kanban (Leads): ${leads}`);

  const vAll = await prisma.veiculo.findMany();
  console.log(`Status dos veículos:`);
  vAll.forEach(v => console.log(`  ${v.placa}: ${v.status}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
