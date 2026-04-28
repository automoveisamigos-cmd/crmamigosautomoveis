import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const data = {
    usuarios: await prisma.usuario.findMany(),
    veiculos: await prisma.veiculo.findMany(),
    leads: await prisma.lead.findMany(),
    tarefas: await prisma.tarefa.findMany(),
    posts: await prisma.postSocial.findMany(),
    statusSocial: await prisma.statusSocial.findMany(),
  };

  fs.writeFileSync('prisma/backup_data.json', JSON.stringify(data, null, 2));
  console.log('Backup criado com sucesso em prisma/backup_data.json');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
