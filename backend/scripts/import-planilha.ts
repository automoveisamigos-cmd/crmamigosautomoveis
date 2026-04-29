import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando importação de Estoque...");

  // 1. Limpar banco atual
  await prisma.veiculo.deleteMany();
  console.log("🧹 Estoque antigo limpo.");

  // 2. Ler o arquivo CSV extraído da planilha
  const contentPath = 'C:\\Users\\Coringa\\.gemini\\antigravity\\brain\\6748f83c-ae4d-4bad-8cbe-30c996544f36\\.system_generated\\steps\\298\\content.md';
  const fileContent = fs.readFileSync(contentPath, 'utf-8');
  
  // Pegar do cabeçalho em diante (ignorar os primeiros metadados do markdown)
  const csvLines = fileContent.split('\n').slice(4).join('\n');

  // Parse do CSV
  const records = parse(csvLines, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  let countCarros = 0;
  let countMotos = 0;

  for (const row of records as any[]) {
    if (!row.Marca || !row.MODELO) continue; // Pular linhas vazias

    // Descobrir categoria pela linha (se passou da linha 59, é moto na planilha)
    // Mas vamos usar a cilindrada/colunas como base tbm
    const cilindrada = row.Cilindrada || '';
    const isMoto = cilindrada.toLowerCase().includes('cc');
    const categoria = isMoto ? 'Moto' : 'Carro';

    // Limpar o preço
    let preco = 0;
    if (row['Preço']) {
      let pStr = row['Preço'].replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      preco = parseFloat(pStr) || 0;
    }

    // Identificar proprietario
    const proprietarioRaw = row.Propriedade || row.DONO || '';
    let tipo_estoque = proprietarioRaw ? 'Consignado' : 'Proprio';
    let proprietario = proprietarioRaw || null;

    // Coletar fotos de todas as colunas
    const fotos = [];
    for (const key of Object.keys(row)) {
      if (key.includes('Column') || key === 'WHATS?') {
        let f = row[key].trim();
        if (f.startsWith('http')) {
           fotos.push(f);
        }
      }
    }

    // Status: Polo 2003 (laranja na planilha) -> Reservado
    let status = 'Disponivel';
    if (row.Marca.toLowerCase().includes('volkswagen') && row.MODELO.toLowerCase().includes('polo') && row['Ano '] == '2003') {
      status = 'Reservado';
    }

    const data = {
      categoria,
      marca: row.Marca,
      modelo: row.MODELO,
      ano: parseInt(row['Ano ']) || new Date().getFullYear(),
      preco,
      cor: row.Cor || null,
      placa: row.Placa || null,
      combustivel: row.Combustivel || null,
      km: row.KM ? parseInt(row.KM.replace('.', '')) : null,
      cilindrada: cilindrada || null,
      proprietario,
      tipo_estoque,
      status,
      fotos: JSON.stringify(fotos)
    };

    await prisma.veiculo.create({ data });

    if (categoria === 'Moto') countMotos++;
    else countCarros++;
  }

  console.log(`✅ Importação concluída: ${countCarros} carros e ${countMotos} motos cadastrados.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
