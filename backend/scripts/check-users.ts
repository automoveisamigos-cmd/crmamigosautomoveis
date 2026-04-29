
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany();
  console.log('Usuários no Banco:', users.map(u => ({ id: u.id, nome: u.nome, email: u.email, role: u.role })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
