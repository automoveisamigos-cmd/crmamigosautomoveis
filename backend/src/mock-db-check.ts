import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
  console.log("Inicializando verificação simulada do banco de dados (Autônoma)...");
  try {
    // Attempting a simple query to verify client initialization
    const leadsCount = await prisma.lead.count();
    console.log(`Conexão com o banco de dados OK. Simulador finalizado. Encontrados ${leadsCount} leads.`);
  } catch (error) {
    console.error("Falha na conexão com o banco de dados. O Prisma necessita do banco gerado.", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
