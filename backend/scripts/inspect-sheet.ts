
import axios from 'axios';
import { parse } from 'csv-parse/sync';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1coOsmpi55VVUpIJLQcDyNlZOMBeFCkJOCsz56-6g5AU/export?format=csv&gid=424572074';

async function main() {
  const response = await axios.get(SHEET_URL);
  const csvContent = response.data;
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  if (records.length > 0) {
    console.log('Headers:', Object.keys(records[0]));
    const hb20 = records.find((r: any) => r.Placa === 'TDF0J87');
    if (hb20) {
      console.log('HB20 encontrado!');
      for (const key in hb20) {
        if (hb20[key]) console.log(`${key}: ${hb20[key]}`);
      }
    } else {
      console.log('TDF0J87 não encontrado. Placas disponíveis:', records.map((r: any) => r.Placa).slice(0, 10));
    }
  } else {
    console.log('Nenhum registro encontrado na planilha.');
  }
}

main().catch(console.error);
