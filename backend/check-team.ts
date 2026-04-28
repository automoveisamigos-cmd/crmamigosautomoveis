import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const v = await p.usuario.findMany({ 
    where: { role: 'Vendedor' }, 
    include: { tarefas: true } 
  });
  console.log(v.map(item => ({ id: item.id, tasks: item.tarefas.length })));
}
run().finally(() => p.$disconnect());
