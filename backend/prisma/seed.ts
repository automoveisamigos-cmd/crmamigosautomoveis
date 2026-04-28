import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Garantir Admin
  const adminEmail = 'admin@amigosauto.com.br';
  const existingAdmin = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.usuario.create({
      data: {
        nome: 'CEO Amigos',
        email: adminEmail,
        senha: hashedPassword,
        role: 'Admin'
      }
    });
    console.log('Admin criado.');
  }

  // Restaurar Civic
  const civic = await prisma.veiculo.findFirst({
    where: { modelo: { contains: 'Civic' } }
  });

  if (!civic) {
    await prisma.veiculo.create({
      data: {
        marca: 'Honda',
        modelo: 'Civic LXR 2.0',
        ano: 2014,
        preco: 60900,
        fipe: 62500,
        km: 98000,
        cor: 'Prata',
        placa: 'ABC-1234',
        tipo_estoque: 'Proprio',
        status: 'Disponivel',
        data_entrada: new Date(new Date().setDate(new Date().getDate() - 15)), // 15 dias no pátio
        fotos: JSON.stringify(['https://images.unsplash.com/photo-1623945417835-18182747184a?q=80&w=800']) // Placeholder fixo bonito
      }
    });
    console.log('Civic restaurado.');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
