
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const veiculos = await prisma.veiculo.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log('Status dos Veículos:', veiculos);
  
  const leads = await prisma.lead.count();
  console.log('Total Leads:', leads);
  
  const usuarios = await prisma.usuario.count();
  console.log('Total Usuários:', usuarios);
  
  const tarefas = await prisma.tarefa.count();
  console.log('Total Tarefas:', tarefas);
}

main().catch(console.error).finally(() => prisma.$disconnect());
