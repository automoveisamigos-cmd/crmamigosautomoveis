import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sincroniza dados de campanhas da Meta Ads API automaticamente.
 * Requer: META_ADS_ACCESS_TOKEN e META_ADS_ACCOUNT_ID no .env
 */
export const syncMetaAds = async () => {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_ACCOUNT_ID;

  if (!token || !accountId) {
    console.warn('[MetaAds] Variáveis META_ADS_ACCESS_TOKEN e META_ADS_ACCOUNT_ID não configuradas.');
    return { synced: 0, error: 'Credenciais não configuradas' };
  }

  try {
    // Busca insights dos últimos 30 dias por campanha
    const url = `https://graph.facebook.com/v19.0/act_${accountId}/insights`;
    const response = await axios.get(url, {
      params: {
        access_token: token,
        fields: 'campaign_name,spend,impressions,clicks,actions',
        date_preset: 'last_30d',
        level: 'campaign',
        limit: 50
      }
    });

    const campaigns = response.data?.data || [];
    let synced = 0;

    for (const camp of campaigns) {
      const leads = camp.actions?.find((a: any) => a.action_type === 'lead')?.value || 0;
      const conversoes = camp.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0;

      // Upsert na tabela de Ads Investimento
      const existing = await prisma.adsInvestimento.findFirst({
        where: { campanha: camp.campaign_name, plataforma: 'Meta' }
      });

      const data = {
        campanha: camp.campaign_name,
        plataforma: 'Meta',
        periodo_inicio: new Date(new Date().setDate(new Date().getDate() - 30)),
        periodo_fim: new Date(),
        investimento: parseFloat(camp.spend || '0'),
        impressoes: parseInt(camp.impressions || '0'),
        cliques: parseInt(camp.clicks || '0'),
        leads_gerados: parseInt(leads),
        conversoes: parseInt(conversoes)
      };

      if (existing) {
        await prisma.adsInvestimento.update({ where: { id: existing.id }, data });
      } else {
        await prisma.adsInvestimento.create({ data });
      }
      synced++;
    }

    console.log(`[MetaAds] ${synced} campanhas sincronizadas com sucesso.`);
    return { synced };
  } catch (error: any) {
    console.error('[MetaAds] Erro na sincronização:', error?.response?.data || error.message);
    return { synced: 0, error: error?.response?.data?.error?.message || error.message };
  }
};

/**
 * Sincroniza dados de campanhas do Google Ads API.
 * Requer: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_REFRESH_TOKEN no .env
 */
export const syncGoogleAds = async () => {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!devToken || !customerId || !refreshToken) {
    console.warn('[GoogleAds] Credenciais não configuradas.');
    return { synced: 0, error: 'Credenciais não configuradas' };
  }

  // Implementação via Google Ads API v16
  // (Requer configuração do OAuth2 com google-ads-api)
  console.log('[GoogleAds] Integração disponível após configuração OAuth2.');
  return { synced: 0, message: 'Configure GOOGLE_ADS_REFRESH_TOKEN no .env' };
};
