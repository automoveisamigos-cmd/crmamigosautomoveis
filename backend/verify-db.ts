import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const c = await p.lead.count();
  const u = await p.usuario.count();
  const v = await p.veiculo.count();
  const s = await p.postSocial.count();
  console.log({ leads: c, usuarios: u, veiculos: v, posts: s });
}
run().finally(() => p.$disconnect());
