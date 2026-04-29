import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adicionando colunas: categoria, cilindrada, proprietario...');

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Veiculo" ADD COLUMN IF NOT EXISTS "categoria" TEXT NOT NULL DEFAULT 'Carro'`);
    console.log('✅ categoria adicionada');
  } catch (e: any) { console.log('categoria:', e.message); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Veiculo" ADD COLUMN IF NOT EXISTS "cilindrada" TEXT`);
    console.log('✅ cilindrada adicionada');
  } catch (e: any) { console.log('cilindrada:', e.message); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Veiculo" ADD COLUMN IF NOT EXISTS "proprietario" TEXT`);
    console.log('✅ proprietario adicionada');
  } catch (e: any) { console.log('proprietario:', e.message); }

  console.log('Migração manual concluída!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
