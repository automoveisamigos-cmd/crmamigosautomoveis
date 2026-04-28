const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.$queryRaw`SELECT 1 as ok`
  .then(r => console.log('CONECTADO:', JSON.stringify(r)))
  .catch(e => console.error('ERRO:', e.message))
  .finally(() => p.$disconnect());
