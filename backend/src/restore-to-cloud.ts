import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const backupDir = path.join(process.cwd(), 'backups');
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('backup_')).sort().reverse();
    
    if (files.length === 0) {
        console.error('Nenhum backup encontrado!');
        return;
    }

    const latestBackup = path.join(backupDir, files[0]);
    console.log(`Restaurando do backup: ${files[0]}`);
    
    const data = JSON.parse(fs.readFileSync(latestBackup, 'utf-8'));

    console.log('--- Limpando Tabelas no Supabase ---');
    // Ordem importa por causa de FKs
    await prisma.tarefa.deleteMany();
    await prisma.agendamento.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.veiculo.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.postSocial.deleteMany();
    await prisma.statusSocial.deleteMany();
    await prisma.adsInvestimento.deleteMany();

    console.log('--- Restaurando Usuários ---');
    for (const item of data.usuarios) {
        await prisma.usuario.create({ data: { ...item, criado_em: new Date(item.criado_em) } });
    }

    console.log('--- Restaurando Veículos ---');
    for (const item of data.veiculos) {
        const { id, ...rest } = item; // Remover ID se for autoincrement e quisermos novos IDs, ou manter se quisermos manter integridade
        // No Supabase, se quisermos manter os mesmos IDs (para FKs), usamos create com ID explícito
        await prisma.veiculo.create({ data: { ...item, data_entrada: new Date(item.data_entrada) } });
    }

    console.log('--- Restaurando Leads ---');
    for (const item of data.leads) {
        await prisma.lead.create({ data: { ...item, ultima_interacao: new Date(item.ultima_interacao), criado_em: new Date(item.criado_em) } });
    }

    console.log('--- Restaurando Tarefas ---');
    for (const item of data.tarefas) {
        await prisma.tarefa.create({ data: { ...item, vencimento: new Date(item.vencimento), criado_em: new Date(item.criado_em) } });
    }

    console.log('--- Restaurando Agendamentos ---');
    for (const item of data.agendamentos) {
        await prisma.agendamento.create({ data: { ...item, data: new Date(item.data) } });
    }

    console.log('--- Restaurando Redes Sociais ---');
    for (const item of data.posts) {
        await prisma.postSocial.create({ data: { ...item, data_postagem: new Date(item.data_postagem), criado_em: new Date(item.criado_em) } });
    }
    for (const item of data.statusSocial) {
        await prisma.statusSocial.create({ data: { ...item, data: new Date(item.data) } });
    }

    console.log('--- Migração Local -> Nuvem Concluída com Sucesso! ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
