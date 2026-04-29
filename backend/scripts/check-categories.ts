import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const veiculos = await prisma.veiculo.findMany({
    where: { status: { not: 'Vendido' } },
    select: { id: true, marca: true, modelo: true, categoria: true, cilindrada: true }
  });

  // Known moto keywords
  const motoKeywords = ['fan', 'cg', 'biz', 'pop', 'titan', 'bros', 'xre', 'cb ', 'cb1', 'cb3', 'cb5',
    'crosser', 'factor', 'ybr', 'fazer', 'lander', 'nmax', 'pcx', 'ninja', 'z400', 'mt-', 'duke',
    'twister', 'hornet', 'falcon', 'tenere', 'sahara', 'trail', 'scrambler', 'vespa', 'burgman'];

  const misclassified = veiculos.filter(v => {
    const nome = `${v.marca} ${v.modelo}`.toLowerCase();
    const isMotoByName = motoKeywords.some(k => nome.includes(k));
    const isMotoByCC = v.cilindrada?.includes('cc');
    return (isMotoByName || isMotoByCC) && v.categoria !== 'Moto';
  });

  console.log(`\nTotal veículos em estoque: ${veiculos.length}`);
  console.log(`Carros: ${veiculos.filter(v => v.categoria === 'Carro').length}`);
  console.log(`Motos: ${veiculos.filter(v => v.categoria === 'Moto').length}`);
  console.log(`\nMotos classificadas ERRADO como Carro (${misclassified.length}):`);
  misclassified.forEach(v => console.log(`  ID ${v.id}: ${v.marca} ${v.modelo} | cilindrada: ${v.cilindrada} | categoria atual: ${v.categoria}`));
}

main().catch(console.error).finally(() => prisma['$disconnect']());
