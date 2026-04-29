import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const greenPlates = [
    'KNY8163', 'SJH5J60', 'LRD7A01', 'TDF0J87', 'HIV3C45', 'LRW9438', 'LQO1164', 'KWQ3E64', 
    'ISY4482', 'TCE3D29', 'RUV0A22', 'RNK9D92', 'RTU6B66', 'LTF4C11', 'LTO3A06', 'PYT0B79', 
    'KYT9H46', 'RMU7C27', 'KZL7C51', 'TCC0F98', 'LSE7E06', 'QWL9D93', 'RJH7H27', 'SRF3D23', 
    'TUT0B81', 'SRJ4J02', 'RKL4B83', 'RKK4B86', 'LUC6C53', 'SQV1I42', 'TTC7G32', 'LMP1H26', 
    'TTM0H93', 'RKD6J40'
];

async function main() {
    console.log('--- Atualizando Integração Webmotors (Placas Verdes) ---');
    
    const result = await prisma.veiculo.updateMany({
        where: {
            placa: { in: greenPlates }
        },
        data: {
            integra_webmotors: true
        }
    });

    console.log(`Sucesso: ${result.count} veículos marcados como integrados ao Webmotors.`);
    
    // Marcar os outros como falso para garantir consistência (Cinzas)
    const resultGrey = await prisma.veiculo.updateMany({
        where: {
            placa: { notIn: greenPlates },
            status: { not: 'Vendido' }
        },
        data: {
            integra_webmotors: false
        }
    });
    
    console.log(`Sucesso: ${resultGrey.count} veículos marcados como PENDENTES.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
