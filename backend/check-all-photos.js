
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const veiculos = await prisma.veiculo.findMany({
    take: 50,
    where: { status: { not: 'Vendido' } }
  });
  
  veiculos.forEach(v => {
    console.log(`ID ${v.id} (${v.placa}): ${v.fotos}`);
  });
}

main().finally(() => prisma.$disconnect());
