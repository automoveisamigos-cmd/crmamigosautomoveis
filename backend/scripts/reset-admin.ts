import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = "admin@amigosauto.com.br";
    const senha = "123";
    
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const usuario = await prisma.usuario.upsert({
      where: { email },
      update: { senha: senhaHash },
      create: {
        email,
        senha: senhaHash,
        nome: "CEO Amigos",
        role: "Admin"
      },
    });

    console.log(`SUCESSO: Usuário ${usuario.email} configurado com a senha: ${senha}`);
  } catch (error) {
    console.error("ERRO ao configurar usuário:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
