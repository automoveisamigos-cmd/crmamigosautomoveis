import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function reset() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  
  await prisma.usuario.update({
    where: { email: 'admin@amigosauto.com.br' },
    data: { 
      senha: hash,
      role: 'Admin'
    }
  });
  
  console.log('Senha do Admin resetada para: admin123');
}

reset().finally(() => prisma.$disconnect());
