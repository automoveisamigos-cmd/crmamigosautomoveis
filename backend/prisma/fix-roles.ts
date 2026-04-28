import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const users = await prisma.usuario.findMany();
  console.log('Usuarios no banco:', users.map(u => ({ email: u.email, role: u.role })));

  await prisma.usuario.updateMany({
    where: { email: 'admin@amigosauto.com.br' },
    data: { role: 'Admin' }
  });
  
  // Se houver apenas um usuário e ele não for o admin@..., promove ele também para teste
  if (users.length === 1) {
    await prisma.usuario.update({
      where: { id: users[0].id },
      data: { role: 'Admin' }
    });
  }
  
  console.log('Admin role fix applied');
}

fix().finally(() => prisma.$disconnect());
