
const axios = require('axios');
const { parse } = require('csv-parse/sync');

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1coOsmpi55VVUpIJLQcDyNlZOMBeFCkJOCsz56-6g5AU/export?format=csv&gid=424572074';

async function main() {
  try {
    const response = await axios.get(SHEET_URL);
    const records = parse(response.data, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    if (records.length > 0) {
      console.log('Headers:', Object.keys(records[0]));
      const hb20 = records.find(r => r.Placa === 'TDF0J87');
      if (hb20) {
        console.log('HB20 encontrado!');
        console.log(JSON.stringify(hb20, null, 2));
      } else {
        console.log('TDF0J87 não encontrado.');
      }
    }
  } catch (e) {
    console.error(e);
  }
}

main();
