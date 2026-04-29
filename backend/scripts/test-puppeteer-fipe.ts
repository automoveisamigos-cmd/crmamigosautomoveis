import puppeteer from 'puppeteer';

async function test() {
  const placa = 'SVK6F31';
  console.log(`Abrindo navegador invisível para a placa ${placa}...`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(`https://placafipe.com.br/`, { waitUntil: 'networkidle2' });
    
    // Pegar as caixas de input
    const inputs = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('input'));
      return els.map(e => ({ id: e.id, name: e.name, type: e.type, class: e.className }));
    });
    
    console.log('Campos de texto encontrados na home:', inputs);

  } catch(e: any) {
    console.error('Erro:', e.message);
  } finally {
    await browser.close();
  }
}
test();
