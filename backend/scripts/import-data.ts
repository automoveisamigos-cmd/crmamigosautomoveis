import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const rawData = fs.readFileSync('prisma/backup_data.json', 'utf-8');
  const data = JSON.parse(rawData);

  console.log('--- Limpando banco atual para evitar duplicatas ---');
  await prisma.tarefa.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.postSocial.deleteMany();
  await prisma.statusSocial.deleteMany();

  console.log('--- Importando Usuários ---');
  for (const u of data.usuarios) {
    await prisma.usuario.create({
      data: {
        id: u.id,
        email: u.email,
        senha: u.senha,
        nome: u.nome,
        role: u.role,
        criado_em: new Date(u.criado_em)
      }
    });
  }

  console.log('--- Importando Veículos ---');
  for (const v of data.veiculos) {
    await prisma.veiculo.create({
      data: {
        id: v.id,
        marca: v.marca,
        modelo: v.modelo,
        ano: v.ano,
        preco: v.preco,
        fipe: v.fipe,
        demanda: v.demanda,
        status: v.status,
        tipo_estoque: v.tipo_estoque,
        data_entrada: new Date(v.data_entrada),
        placa: v.placa,
        km: v.km,
        cor: v.cor,
        combustivel: v.combustivel,
        cambio: v.cambio,
        fotos: v.fotos,
        observacoes: v.observacoes
      }
    });
  }

  console.log('--- Importando Leads ---');
  for (const l of data.leads) {
    await prisma.lead.create({
      data: {
        id: l.id,
        nome: l.nome,
        whatsapp: l.whatsapp,
        cidade: l.cidade,
        score: l.score,
        status: l.status,
        flag_fora_horario: l.flag_fora_horario,
        ultima_interacao: new Date(l.ultima_interacao),
        veiculo_interesse: l.veiculo_interesse,
        tipo_compra: l.tipo_compra,
        veiculo_id: l.veiculo_id,
        vendedor_id: l.vendedor_id,
        criado_em: new Date(l.criado_em),
        utm_source: l.utm_source,
        utm_medium: l.utm_medium,
        utm_campaign: l.utm_campaign,
        utm_content: l.utm_content
      }
    });
  }

  console.log('--- Importando Tarefas ---');
  for (const t of data.tarefas) {
    await prisma.tarefa.create({
      data: {
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao,
        vencimento: new Date(t.vencimento),
        concluida: t.concluida,
        lead_id: t.lead_id,
        usuario_id: t.usuario_id,
        criado_em: new Date(t.criado_em)
      }
    });
  }

  console.log('--- Importando Posts e Status ---');
  for (const p of data.posts) {
    await prisma.postSocial.create({ data: { ...p, data_postagem: new Date(p.data_postagem), criado_em: new Date(p.criado_em) } });
  }
  for (const s of data.statusSocial) {
    await prisma.statusSocial.create({ data: { ...s, data: new Date(s.data) } });
  }

  console.log('--- Restauração concluída no Supabase! ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
