import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Assegurar que a pasta uploads existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function extractRealImageUrl(url: string): Promise<string | null> {
  // Se já for uma imagem direta, retornar ela mesma
  if (url.match(/\.(jpeg|jpg|gif|png)$/i) || url.includes('i.postimg.cc')) {
    return url;
  }

  // Se for página do postimg
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const html = response.data;
    const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (match && match[1]) {
      return match[1];
    }
  } catch (error: any) {
    console.log(`Erro ao extrair de ${url}: ${error.message}`);
  }
  return null;
}

async function downloadImage(url: string, prefix: string): Promise<string | null> {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 15000
    });

    // Pega a extensão original ou usa .jpg
    let ext = '.jpg';
    if (url.includes('.png')) ext = '.png';
    else if (url.includes('.jpeg')) ext = '.jpeg';

    const filename = `${prefix}-${Date.now()}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/uploads/${filename}`));
      writer.on('error', reject);
    });
  } catch (error: any) {
    console.log(`Falha ao baixar ${url}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('Iniciando varredura de fotos no banco...');
  const veiculos = await prisma.veiculo.findMany();
  let fotosBaixadas = 0;
  let fotosComErro = 0;

  for (const veiculo of veiculos) {
    if (!veiculo.fotos) continue;

    let urls: string[];
    try {
      urls = JSON.parse(veiculo.fotos);
    } catch {
      continue;
    }

    if (urls.length === 0) continue;
    
    // Pula se já tiver sido processado e usar caminhos locais
    if (urls[0].startsWith('/uploads/')) continue;

    console.log(`Processando ${veiculo.marca} ${veiculo.modelo} (${urls.length} fotos)...`);
    const novasFotos = [];

    for (let i = 0; i < urls.length; i++) {
      let originalUrl = urls[i];
      if (originalUrl.includes('postimg.cc')) {
        let directUrl = await extractRealImageUrl(originalUrl);
        if (directUrl) {
          let localPath = await downloadImage(directUrl, `veiculo_${veiculo.id}_foto_${i}`);
          if (localPath) {
            novasFotos.push(localPath);
            fotosBaixadas++;
          } else {
            fotosComErro++;
          }
        } else {
          fotosComErro++;
        }
      } else if (originalUrl.startsWith('http')) {
         // Baixa link direto se for de outro site (como o unsplash)
         let localPath = await downloadImage(originalUrl, `veiculo_${veiculo.id}_foto_${i}`);
         if (localPath) {
           novasFotos.push(localPath);
           fotosBaixadas++;
         } else {
           fotosComErro++;
         }
      }
    }

    // Atualiza o banco com os novos caminhos
    if (novasFotos.length > 0) {
      await prisma.veiculo.update({
        where: { id: veiculo.id },
        data: { fotos: JSON.stringify(novasFotos) }
      });
      console.log(`[OK] ${veiculo.modelo} atualizado com ${novasFotos.length} fotos locais.`);
    }
  }

  console.log('\n==================================');
  console.log('Processamento concluído!');
  console.log(`Fotos baixadas com sucesso: ${fotosBaixadas}`);
  console.log(`Fotos com erro: ${fotosComErro}`);
  console.log('==================================\n');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
