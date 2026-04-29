import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Corrigindo os anos dos veículos...");

  const contentPath = 'C:\\Users\\Coringa\\.gemini\\antigravity\\brain\\6748f83c-ae4d-4bad-8cbe-30c996544f36\\.system_generated\\steps\\298\\content.md';
  const fileContent = fs.readFileSync(contentPath, 'utf-8');
  const csvLines = fileContent.split('\n').slice(4).join('\n');

  const records = parse(csvLines, {
    columns: true,
    skip_empty_lines: true,
    trim: true, // Isso transforma "Ano " em "Ano"
    relax_column_count: true
  });

  let totalAtualizado = 0;

  for (const row of records as any[]) {
    const placa = row.Placa;
    const anoReal = parseInt(row['Ano']) || parseInt(row['Ano ']);

    if (placa && anoReal) {
      const result = await prisma.veiculo.updateMany({
        where: { placa: placa },
        data: { ano: anoReal }
      });
      
      if (result.count > 0) {
        console.log(`[OK] Placa ${placa}: Ano corrigido para ${anoReal}`);
        totalAtualizado++;
      }
    }
  }

  console.log(`\n✅ Sucesso! ${totalAtualizado} veículos tiveram seus anos corrigidos.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
