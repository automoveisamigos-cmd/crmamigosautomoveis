import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAds() {
  console.log('Seeding AdsInvestimento com dados de teste...');

  await prisma.adsInvestimento.deleteMany({});

  const campanhas = [
    {
      campanha: 'Captacao_Leads_SUV_Abril',
      plataforma: 'Meta',
      periodo_inicio: new Date(new Date().setDate(new Date().getDate() - 30)),
      periodo_fim: new Date(),
      investimento: 1500.50,
      impressoes: 45000,
      cliques: 1200,
      leads_gerados: 45,
      conversoes: 3
    },
    {
      campanha: 'Retargeting_Visitantes_Site',
      plataforma: 'Meta',
      periodo_inicio: new Date(new Date().setDate(new Date().getDate() - 15)),
      periodo_fim: new Date(),
      investimento: 500.00,
      impressoes: 15000,
      cliques: 800,
      leads_gerados: 12,
      conversoes: 1
    },
    {
      campanha: 'Pesquisa_HB20_Google',
      plataforma: 'Google',
      periodo_inicio: new Date(new Date().setDate(new Date().getDate() - 30)),
      periodo_fim: new Date(),
      investimento: 800.00,
      impressoes: 5000,
      cliques: 350,
      leads_gerados: 20,
      conversoes: 2
    }
  ];

  for (const ad of campanhas) {
    await prisma.adsInvestimento.create({ data: ad });
  }

  console.log('Dados de teste inseridos com sucesso!');
}

seedAds()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
