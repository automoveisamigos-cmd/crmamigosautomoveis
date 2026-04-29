
const axios = require('axios');

async function main() {
  const url = 'https://postimg.cc/F1NywK7Y';
  try {
    const res = await axios.get(url);
    const html = res.data;
    const match = html.match(/<meta property="og:image" content="(.*?)"/);
    if (match) {
      console.log('Direct Link:', match[1]);
    } else {
      console.log('Direct Link not found');
    }
  } catch (e) {
    console.error(e);
  }
}

main();
