const axios = require('axios');

async function testPlaca() {
  const placa = 'SVK6F31'; // Placa do Polo Track da planilha
  try {
    console.log(`Consultando placa ${placa}...`);
    const response = await axios.get(`https://placafipe.com.br/placa/${placa}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = response.data;
    
    // Buscar o preço da FIPE no HTML usando regex simples (teste rápido)
    // Ex: "R$ 77.000,00"
    const fs = require('fs');
    fs.writeFileSync('fipe-test.html', html);
    console.log('HTML salvo em fipe-test.html para análise.');
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  }
}
testPlaca();
