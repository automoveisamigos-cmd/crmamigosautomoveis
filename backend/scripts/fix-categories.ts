import axios from 'axios';

async function main() {
  // Login
  const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
    email: 'admin@amigosauto.com.br',
    senha: '123'
  });
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  // Get all vehicles
  const res = await axios.get('http://localhost:3000/api/veiculos', { headers });
  const veiculos = res.data;

  const motoKeywords = ['fan', 'cg ', 'biz', 'pop', 'titan', 'bros', 'xre', 'crosser', 
    'factor', 'ybr', 'fazer', 'lander', 'nmax', 'pcx', 'ninja', 'z400', 'mt-', 'duke',
    'twister', 'hornet', 'falcon', 'tenere', 'sahara', 'trail', 'scrambler', 'vespa', 'burgman',
    'cb ', 'cb1', 'cb3', 'cb5', 'crf', 'nxr', 'xtz', 'xt ', 'start', 'hunter', 'intruder'];

  const active = veiculos.filter((v: any) => v.status !== 'Vendido');

  const misclassified = active.filter((v: any) => {
    const nome = ` ${v.marca} ${v.modelo} `.toLowerCase();
    const isMotoByName = motoKeywords.some(k => nome.includes(k));
    const isMotoByCC = v.cilindrada?.includes('cc');
    return (isMotoByName || isMotoByCC) && v.categoria !== 'Moto';
  });

  console.log(`\nTotal veículos em estoque: ${active.length}`);
  console.log(`Carros: ${active.filter((v: any) => v.categoria === 'Carro').length}`);
  console.log(`Motos: ${active.filter((v: any) => v.categoria === 'Moto').length}`);
  console.log(`\nMotos classificadas ERRADO como Carro (${misclassified.length}):`);
  misclassified.forEach((v: any) => console.log(`  ID ${v.id}: ${v.marca} ${v.modelo} | cilindrada: ${v.cilindrada} | cat: ${v.categoria}`));

  // Fix them
  if (misclassified.length > 0) {
    console.log(`\nCorrigindo ${misclassified.length} veículos...`);
    for (const v of misclassified) {
      await axios.patch(`http://localhost:3000/api/veiculos/${v.id}`, { categoria: 'Moto' }, { headers });
      console.log(`  ✅ ID ${v.id}: ${v.marca} ${v.modelo} -> Moto`);
    }
    console.log('\nTodas as categorias foram corrigidas!');
  }
}

main().catch(console.error);
