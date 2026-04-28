const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('https://placafipe.com.br/assets/index.2ac19901.js');
    const matches = res.data.match(/https?:\/\/[^\s"'`]+/g);
    const unique = [...new Set(matches)];
    console.log('URLs encontradas no JS:');
    unique.forEach(u => console.log(u));
  } catch(e) {
    console.error(e.message);
  }
}
test();
