const axios = require('axios');
const fs = require('fs');

async function test() {
  try {
    const url = 'https://postimg.cc/Y4wtTDwp';
    console.log(`Buscando: ${url}`);
    
    // 1. Baixar a página HTML
    const response = await axios.get(url);
    const html = response.data;
    
    // 2. Procurar a URL real da imagem no HTML
    // Geralmente está na tag meta og:image ou link rel="image_src"
    const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (match && match[1]) {
      const realImageUrl = match[1];
      console.log(`Imagem real encontrada: ${realImageUrl}`);
    } else {
      console.log('Não foi possível encontrar a imagem real no HTML.');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}
test();
