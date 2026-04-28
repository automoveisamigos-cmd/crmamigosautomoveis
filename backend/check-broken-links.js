
const axios = require('axios');
const { parse } = require('csv-parse/sync');

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1coOsmpi55VVUpIJLQcDyNlZOMBeFCkJOCsz56-6g5AU/export?format=csv&gid=424572074';

async function main() {
  const response = await axios.get(SHEET_URL);
  const records = parse(response.data, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  const sample = records.filter(r => r.Placa === 'SRF3D23' || r.Placa === 'TUT0B81');
  console.log(JSON.stringify(sample, null, 2));
}

main();
