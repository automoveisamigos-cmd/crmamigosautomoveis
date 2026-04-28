import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MOBIAUTO_TOKEN = '19149FAF8B5F8DCB5F65193413616D7A';
const NAPISTA_USER = '40100f732f72411b996f35167d68d667';
const NAPISTA_PASS = 'qWJcFZBk#pko32HTA97v';

async function testConnections() {
  console.log('🚀 Testando combinações de cabeçalhos...');

  const headersToTest = [
    { name: 'Authorization: Bearer', value: `Bearer ${MOBIAUTO_TOKEN}` },
    { name: 'x-api-key', value: MOBIAUTO_TOKEN },
    { name: 'api-key', value: MOBIAUTO_TOKEN },
    { name: 'Token', value: MOBIAUTO_TOKEN }
  ];

  for (const h of headersToTest) {
    try {
      console.log(`\n[MOBIAUTO] Testando cabeçalho ${h.name}...`);
      const headers: any = {};
      if (h.name.includes('Authorization')) headers['Authorization'] = h.value;
      else headers[h.name] = h.value;

      const res = await axios.get('https://open-api.mobiauto.com.br/api/dealer/v1.0', { headers });
      console.log(`[MOBIAUTO] ✅ SUCESSO com ${h.name}!`);
      break;
    } catch (e: any) {
      console.log(`[MOBIAUTO] ❌ Falha com ${h.name}: ${e.response?.status || e.message}`);
    }
  }

  // Teste Na Pista - Manobras Finais
  const ninjaTests = [
    { name: 'Basic Auth Padrão', headers: { 'Authorization': `Basic ${Buffer.from(`${NAPISTA_USER}:${NAPISTA_PASS}`).toString('base64')}` } },
    { name: 'Headers Custom', headers: { 'mcncompat-user': NAPISTA_USER, 'mcncompat-pass': NAPISTA_PASS } },
    { name: 'Integrador Scope', headers: { 'Authorization': NAPISTA_USER } }
  ];

  for (const test of ninjaTests) {
    try {
      console.log(`\n[NA PISTA] Testando ${test.name}...`);
      const res = await axios.get('https://api.napista.com.br/inventorycompat/meus-dados/anuncios', { headers: test.headers });
      console.log(`[NA PISTA] ✅ SUCESSO com ${test.name}!`);
      break;
    } catch (e: any) {
      console.log(`[NA PISTA] ❌ Falha com ${test.name}: ${e.response?.status || e.message}`);
    }
  }
}

testConnections();
