const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Semeando dados sociais...');

  const plataformas = ['Instagram', 'YouTube', 'TikTok', 'Kwai', 'Facebook'];
  
  // 1. Limpar dados antigos (opcional, mas bom para demo)
  await prisma.postSocial.deleteMany({});
  await prisma.statusSocial.deleteMany({});

  // 2. Criar status de seguidores
  for (const plat of plataformas) {
    await prisma.statusSocial.create({
      data: {
        plataforma: plat,
        seguidores: Math.floor(Math.random() * 20000) + 5000,
        data: new Date()
      }
    });
  }

  // 3. Criar posts de exemplo para cada rede
  const posts = [
    {
      plataforma: 'Instagram',
      titulo: 'Review Civic 2014 LXR - Vale a pena em 2024?',
      visualizacoes: 45000,
      likes: 3200,
      alcance: 120000,
      thumbnail: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=400',
      data_postagem: new Date()
    },
    {
      plataforma: 'Instagram',
      titulo: 'Dica: Como cuidar do couro do seu carro',
      visualizacoes: 12000,
      likes: 850,
      alcance: 35000,
      data_postagem: new Date(Date.now() - 86400000)
    },
    {
      plataforma: 'YouTube',
      titulo: 'AMIGOS AUTO - O maior estoque da região!',
      visualizacoes: 85000,
      likes: 5400,
      alcance: 200000,
      thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=400',
      data_postagem: new Date()
    },
    {
      plataforma: 'TikTok',
      titulo: 'POV: Você comprou seu primeiro carro na Amigos',
      visualizacoes: 150000,
      likes: 12000,
      alcance: 500000,
      thumbnail: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=400',
      data_postagem: new Date()
    },
    {
      plataforma: 'Kwai',
      titulo: 'Promoção Relâmpago: Onix 2021!',
      visualizacoes: 32000,
      likes: 1500,
      alcance: 80000,
      data_postagem: new Date()
    },
    {
      plataforma: 'Facebook',
      titulo: 'Feirão Amigos Automóveis - Este Domingo!',
      visualizacoes: 5000,
      likes: 450,
      alcance: 15000,
      data_postagem: new Date()
    }
  ];

  for (const post of posts) {
    await prisma.postSocial.create({
      data: {
        ...post,
        link: `https://${post.plataforma.toLowerCase()}.com/demo-${Math.random()}`,
        comentarios: Math.floor(post.likes / 10),
        compartilhamentos: Math.floor(post.visualizacoes / 100),
        salvamentos: Math.floor(post.likes / 5),
        retencao_media: 45.5,
        horas_assistidas: (post.visualizacoes * 0.5) / 60
      }
    });
  }

  console.log('Dados sociais semeados com sucesso!');
}

seed()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
