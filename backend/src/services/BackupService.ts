import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export class BackupService {
    private static BACKUP_DIR = path.join(process.cwd(), 'backups');

    /**
     * Gera um backup completo do banco de dados em formato JSON.
     */
    static async generateBackup() {
        try {
            console.log('[BACKUP] Iniciando backup de segurança...');
            
            if (!fs.existsSync(this.BACKUP_DIR)) {
                fs.mkdirSync(this.BACKUP_DIR);
            }

            const data = {
                veiculos: await prisma.veiculo.findMany(),
                leads: await prisma.lead.findMany(),
                usuarios: await prisma.usuario.findMany(),
                tarefas: await prisma.tarefa.findMany(),
                agendamentos: await prisma.agendamento.findMany(),
                posts: await prisma.postSocial.findMany(),
                statusSocial: await prisma.statusSocial.findMany(),
                ads: await prisma.adsInvestimento?.findMany() || [],
                timestamp: new Date().toISOString()
            };

            const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const filePath = path.join(this.BACKUP_DIR, fileName);

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            // Manter apenas os últimos 5 backups para não encher o disco
            this.cleanOldBackups();

            console.log(`[BACKUP] Backup concluído com sucesso: ${fileName}`);
            return filePath;
        } catch (error: any) {
            console.error('[BACKUP] Erro ao gerar backup:', error.message);
        }
    }

    private static cleanOldBackups() {
        const files = fs.readdirSync(this.BACKUP_DIR)
            .filter(f => f.startsWith('backup_'))
            .map(f => ({ name: f, time: fs.statSync(path.join(this.BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 5) {
            files.slice(5).forEach(f => {
                fs.unlinkSync(path.join(this.BACKUP_DIR, f.name));
            });
        }
    }
}
