import { AutoSyncService } from './services/AutoSyncService';

async function main() {
    console.log('--- Iniciando Sincronização Manual ---');
    await AutoSyncService.sync();
    console.log('--- Sincronização Manual Finalizada ---');
    process.exit(0);
}

main().catch(err => {
    console.error('Erro na sincronização manual:', err);
    process.exit(1);
});
