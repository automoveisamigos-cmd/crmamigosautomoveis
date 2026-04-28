import axios from 'axios';
import fs from 'fs';

async function test() {
    const url = 'https://docs.google.com/spreadsheets/d/1coOsmpi55VVUpIJLQcDyNlZOMBeFCkJOCsz56-6g5AU/export?format=html&gid=424572074';
    const response = await axios.get(url);
    fs.writeFileSync('sheet.html', response.data);
    console.log('HTML saved to sheet.html');
}

test();
