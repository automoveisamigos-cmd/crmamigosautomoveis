import axios from 'axios';

async function test() {
  try {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBhbWlnb3NhdXRvLmNvbS5iciIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTc3NzMwNjMzOCwiZXhwIjoxNzc3OTExMTM4fQ.VM63crGUBNGPXCr5RD4Qurfpa8F5hOTk4wVDCX7jEbQ";
    const res = await axios.get('http://localhost:3000/api/vendedores', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('TIPO DE DADO:', Array.isArray(res.data) ? 'ARRAY' : typeof res.data);
    console.log('CONTEÚDO:', JSON.stringify(res.data).substring(0, 200));
  } catch (e) {
    console.error('ERRO:', e.message);
  }
}
test();
