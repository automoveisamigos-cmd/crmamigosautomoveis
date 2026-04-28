import puppeteer from 'puppeteer';

async function test() {
    console.log('Starting Puppeteer...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    console.log('Navigating to Google Sheet...');
    await page.goto('https://docs.google.com/spreadsheets/d/1coOsmpi55VVUpIJLQcDyNlZOMBeFCkJOCsz56-6g5AU/edit#gid=424572074', { waitUntil: 'networkidle2' });
    
    console.log('Extracting colors...');
    const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('tr'));
        return rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length < 5) return null;
            const placa = cells[4]?.innerText?.trim(); // Placa is usually col E (index 4)
            const bgColor = window.getComputedStyle(row).backgroundColor;
            return { placa, bgColor };
        }).filter(r => r && r.placa);
    });

    console.log('Data sample:', data.slice(0, 5));
    await browser.close();
}

test().catch(console.error);
