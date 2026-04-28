import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Apaga os usuários antigos que possam estar corrompidos
    await prisma.usuario.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash("123", salt);

    await prisma.usuario.create({
      data: {
        email: "admin@amigosauto.com.br",
        senha: senhaHash,
        nome: "CEO Amigos"
      }
    });
    console.log("SUCESSO: Administrador RE-CRIADO! Pode fazer login.");
  } catch (error) {
    console.error("ERRO ao criar usuário:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
