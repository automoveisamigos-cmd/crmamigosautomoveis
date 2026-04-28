import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Restauração de Dados (Full CRM) ---');

  // 1. Limpar dados existentes (opcional, mas garante consistência para esta restauração)
  // await prisma.tarefa.deleteMany();
  // await prisma.lead.deleteMany();
  // await prisma.postSocial.deleteMany();
  // await prisma.statusSocial.deleteMany();
  // await prisma.veiculo.deleteMany();
  // await prisma.usuario.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash('123', salt);

  // 2. Colaboradores
  console.log('Criando Colaboradores...');
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@amigosauto.com.br' },
    update: {},
    create: {
      email: 'admin@amigosauto.com.br',
      senha: await bcrypt.hash('admin123', 10),
      nome: 'CEO Amigos',
      role: 'Admin'
    }
  });

  const vend1 = await prisma.usuario.upsert({
    where: { email: 'thiago@amigosauto.com.br' },
    update: {},
    create: {
      email: 'thiago@amigosauto.com.br',
      senha: hashedPass,
      nome: 'Thiago Martins',
      role: 'Vendedor'
    }
  });

  const vend2 = await prisma.usuario.upsert({
    where: { email: 'aline@amigosauto.com.br' },
    update: {},
    create: {
      email: 'aline@amigosauto.com.br',
      senha: hashedPass,
      nome: 'Aline Souza',
      role: 'Vendedor'
    }
  });

  // 3. Veículos (Estoque)
  console.log('Criando Estoque...');
  const v1 = await prisma.veiculo.create({
    data: {
      marca: 'Honda',
      modelo: 'Civic LXR 2.0',
      ano: 2014,
      preco: 60900,
      fipe: 62500,
      km: 98000,
      cor: 'Prata',
      placa: 'ABC-1234',
      status: 'Disponivel',
      fotos: JSON.stringify(['https://images.unsplash.com/photo-1623945417835-18182747184a?q=80&w=800']),
      data_entrada: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    }
  });

  const v2 = await prisma.veiculo.create({
    data: {
      marca: 'Toyota',
      modelo: 'Corolla XEI',
      ano: 2019,
      preco: 98000,
      fipe: 95000,
      km: 55000,
      cor: 'Branco Pérola',
      placa: 'DEF-5678',
      status: 'Disponivel',
      fotos: JSON.stringify(['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800']),
      data_entrada: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  });

  const v3 = await prisma.veiculo.create({
    data: {
      marca: 'Jeep',
      modelo: 'Renegade Longitude',
      ano: 2021,
      preco: 105000,
      fipe: 102000,
      km: 32000,
      cor: 'Cinza',
      placa: 'GHI-9012',
      status: 'Reservado',
      fotos: JSON.stringify(['https://images.unsplash.com/photo-1590362891175-3794ec169ec3?q=80&w=800']),
      data_entrada: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    }
  });

  // 4. Leads
  console.log('Criando Leads...');
  await prisma.lead.createMany({
    data: [
      { nome: 'João Silva', whatsapp: '5511999999999', cidade: 'São Paulo', status: 'Novo Lead', veiculo_interesse: 'Civic', vendedor_id: vend1.id },
      { nome: 'Maria Oliveira', whatsapp: '5511888888888', cidade: 'Campinas', status: 'Em Atendimento', veiculo_interesse: 'Corolla', vendedor_id: vend2.id },
      { nome: 'Ricardo Santos', whatsapp: '5511777777777', cidade: 'Santos', status: 'Negociação', veiculo_interesse: 'Renegade', vendedor_id: admin.id },
      { nome: 'Ana Costa', whatsapp: '5511666666666', cidade: 'Curitiba', status: 'Venda Concluída', veiculo_interesse: 'Civic', vendedor_id: vend1.id }
    ]
  });

  // 5. Conteúdo Social
  console.log('Criando Posts Sociais...');
  await prisma.postSocial.createMany({
    data: [
      { plataforma: 'Instagram', titulo: 'Review Civic 2014 LXR', visualizacoes: 15400, likes: 1200, alcance: 18000, salvamentos: 450, compartilhamentos: 320, link: 'https://instagram.com', data_postagem: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { plataforma: 'TikTok', titulo: 'Dicas de Financiamento', visualizacoes: 45000, likes: 3800, retencao_media: 65, link: 'https://tiktok.com', data_postagem: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { plataforma: 'YouTube', titulo: 'Como avaliar um carro usado', visualizacoes: 8500, likes: 900, horas_assistidas: 450, retencao_media: 42, link: 'https://youtube.com', data_postagem: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { plataforma: 'Instagram', titulo: 'Destaque da Semana: Corolla', visualizacoes: 12000, likes: 850, alcance: 14000, salvamentos: 200, compartilhamentos: 150, link: 'https://instagram.com', data_postagem: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
    ]
  });

  // 6. Status das Redes (Seguidores)
  console.log('Criando Status das Redes...');
  const plataformas = ['Instagram', 'YouTube', 'TikTok', 'Kwai', 'Facebook'];
  for (const plat of plataformas) {
    // Registro de 7 dias atrás
    await prisma.statusSocial.create({
      data: { plataforma: plat, seguidores: 10000 + Math.floor(Math.random() * 5000), data: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }
    });
    // Registro atual
    await prisma.statusSocial.create({
      data: { plataforma: plat, seguidores: 12000 + Math.floor(Math.random() * 5000), data: new Date() }
    });
  }

  console.log('--- Restauração Concluída com Sucesso! ---');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
