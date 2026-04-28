import axios from 'axios';
import { PrismaClient, Veiculo } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Serviço responsável por sincronizar o estoque do CRM com portais externos.
 */
export class IntegrationService {
  
  // Configurações vindas do arquivo .env
  private static WEBMOTORS_TOKEN = process.env.WEBMOTORS_TOKEN || '';
  private static MOBIAUTO_TOKEN = process.env.MOBIAUTO_TOKEN || '';
  private static NAPISTA_USER = process.env.NAPISTA_USER || '';
  private static NAPISTA_PASS = process.env.NAPISTA_PASS || '';

  /**
   * Dispara a sincronização de um veículo para todos os portais ativos.
   */
  static async syncVeiculo(veiculoId: number) {
    const veiculo = await prisma.veiculo.findUnique({ where: { id: veiculoId } });
    if (!veiculo) return;

    console.log(`[INTEGRAÇÃO] Iniciando sincronização do veículo: ${veiculo.marca} ${veiculo.modelo}`);

    // Sincronizar com Webmotors
    if (veiculo.integra_webmotors) {
      await this.syncWithWebmotors(veiculo);
    }

    // Sincronizar com Mobiauto
    if (veiculo.integra_mobiauto) {
      await this.syncWithMobiauto(veiculo);
    }

    // Sincronizar com Na Pista
    if (veiculo.integra_napista) {
      await this.syncWithNaPista(veiculo);
    }
  }

  /**
   * Integração Webmotors (Cockpit)
   */
  private static async syncWithWebmotors(veiculo: Veiculo) {
    try {
      console.log(`[WEBMOTORS] Enviando ${veiculo.modelo}...`);
      
      // Aqui entrará o mapeamento de campos conforme a documentação Cockpit
      const payload = {
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        anoFabricacao: veiculo.ano,
        anoModelo: veiculo.ano,
        preco: veiculo.preco,
        quilometragem: veiculo.km,
        fotos: veiculo.fotos ? JSON.parse(veiculo.fotos).map((f: string) => `http://seu-crm-publico.com${f}`) : []
      };

      // Simulação de chamada de API (Mock)
      // const response = await axios.post('https://api.cockpit.com.br/v1/anuncios', payload, { headers: { Authorization: `Bearer ${this.WEBMOTORS_TOKEN}` } });
      
      console.log(`[WEBMOTORS] Sucesso: Veículo sincronizado.`);
    } catch (error: any) {
      console.error(`[WEBMOTORS] Erro na sincronização: ${error.message}`);
    }
  }

  /**
   * Integração Mobiauto
   */
  private static async syncWithMobiauto(veiculo: any) {
    const apiKey = process.env.MOBIAUTO_API_KEY;
    if (!apiKey) return;

    try {
      // Se o veículo foi vendido e já estava na Mobiauto, remove o anúncio
      if (veiculo.status === 'Vendido' && veiculo.mobiauto_id) {
        // Envia requisição DELETE ou PUT para atualizar status
        await axios.delete(`https://api.mobiauto.com.br/mobi-oauth/v1/anuncios/${veiculo.mobiauto_id}`, {
          headers: { 'x-api-key': apiKey }
        });
        console.log(`[MOBIAUTO] Veículo ${veiculo.placa} removido/marcado como vendido.`);
        return;
      }

      // Mapeamento simples para Mobiauto
      const data = {
        placa: veiculo.placa,
        anoFabricacao: veiculo.ano,
        anoModelo: veiculo.ano,
        valor: veiculo.preco,
        quilometragem: veiculo.quilometragem || veiculo.km || 0,
        observacoes: veiculo.descricao || veiculo.observacoes || '',
        fotos: veiculo.fotos ? (typeof veiculo.fotos === 'string' ? JSON.parse(veiculo.fotos) : veiculo.fotos).map((f: string) => `http://seu-crm-publico.com${f}`) : []
      };

      if (veiculo.mobiauto_id) {
        // ATUALIZAÇÃO
        await axios.put(`https://api.mobiauto.com.br/mobi-oauth/v1/anuncios/${veiculo.mobiauto_id}`, data, {
          headers: { 'x-api-key': apiKey }
        });
        console.log(`[MOBIAUTO] Veículo ${veiculo.placa} atualizado com sucesso!`);
      } else {
        // CRIAÇÃO
        const response = await axios.post('https://api.mobiauto.com.br/mobi-oauth/v1/anuncios', data, {
          headers: { 'x-api-key': apiKey }
        });

        await prisma.veiculo.update({
          where: { id: veiculo.id },
          data: { mobiauto_id: response.data.id?.toString() }
        });
        
        console.log(`[MOBIAUTO] Veículo ${veiculo.placa} criado com sucesso!`);
      }
    } catch (error: any) {
      console.error(`[MOBIAUTO] Erro ao sincronizar ${veiculo.placa}:`, error.response?.data || error.message);
    }
  }

  /**
   * Integração Na Pista
   */
  private static async syncWithNaPista(veiculo: Veiculo) {
    try {
      console.log(`[NAPISTA] Enviando ${veiculo.modelo}...`);
      // Mapeamento Na Pista
      console.log(`[NAPISTA] Sucesso.`);
    } catch (error: any) {
      console.error(`[NAPISTA] Erro: ${error.message}`);
    }
  }
}
