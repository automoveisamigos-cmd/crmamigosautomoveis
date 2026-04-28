import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAds = async (req: Request, res: Response) => {
  try {
    const ads = await prisma.adsInvestimento.findMany({
      orderBy: { criado_em: 'desc' }
    });
    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createAd = async (req: Request, res: Response) => {
  try {
    const { campanha, plataforma, periodo_inicio, periodo_fim, investimento, impressoes, cliques, leads_gerados, conversoes } = req.body;

    const parse = (v: any, float = false) => {
      const n = float ? parseFloat(v) : parseInt(v);
      return isNaN(n) ? 0 : n;
    };

    const ad = await prisma.adsInvestimento.create({
      data: {
        campanha,
        plataforma,
        periodo_inicio: new Date(periodo_inicio),
        periodo_fim: new Date(periodo_fim),
        investimento: parse(investimento, true),
        impressoes: parse(impressoes),
        cliques: parse(cliques),
        leads_gerados: parse(leads_gerados),
        conversoes: parse(conversoes)
      }
    });

    res.status(201).json(ad);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAd = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { campanha, plataforma, periodo_inicio, periodo_fim, investimento, impressoes, cliques, leads_gerados, conversoes } = req.body;

    const parse = (v: any, float = false) => {
      const n = float ? parseFloat(v) : parseInt(v);
      return isNaN(n) ? 0 : n;
    };

    const ad = await prisma.adsInvestimento.update({
      where: { id: parseInt(id) },
      data: {
        campanha,
        plataforma,
        periodo_inicio: new Date(periodo_inicio),
        periodo_fim: new Date(periodo_fim),
        investimento: parse(investimento, true),
        impressoes: parse(impressoes),
        cliques: parse(cliques),
        leads_gerados: parse(leads_gerados),
        conversoes: parse(conversoes)
      }
    });

    res.status(200).json(ad);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAd = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.adsInvestimento.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAdStats = async (req: Request, res: Response) => {
  try {
    const ads = await prisma.adsInvestimento.findMany();

    const totalInvestimento = ads.reduce((s, a) => s + a.investimento, 0);
    const totalLeads = ads.reduce((s, a) => s + a.leads_gerados, 0);
    const totalConversoes = ads.reduce((s, a) => s + a.conversoes, 0);
    const totalCliques = ads.reduce((s, a) => s + a.cliques, 0);
    const totalImpressoes = ads.reduce((s, a) => s + a.impressoes, 0);

    const cpl = totalLeads > 0 ? totalInvestimento / totalLeads : 0;
    const cpc = totalCliques > 0 ? totalInvestimento / totalCliques : 0;
    const taxaConversao = totalLeads > 0 ? (totalConversoes / totalLeads) * 100 : 0;
    const ctr = totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0;
    const roas = totalInvestimento > 0 ? (totalConversoes * 84500) / totalInvestimento : 0; // ticket médio estimado

    // Breakdown por plataforma
    const byPlataforma: Record<string, any> = {};
    for (const ad of ads) {
      if (!byPlataforma[ad.plataforma]) {
        byPlataforma[ad.plataforma] = { investimento: 0, leads: 0, conversoes: 0, cliques: 0 };
      }
      byPlataforma[ad.plataforma].investimento += ad.investimento;
      byPlataforma[ad.plataforma].leads += ad.leads_gerados;
      byPlataforma[ad.plataforma].conversoes += ad.conversoes;
      byPlataforma[ad.plataforma].cliques += ad.cliques;
    }

    const plataformaStats = Object.entries(byPlataforma).map(([plat, data]: [string, any]) => ({
      plataforma: plat,
      ...data,
      cpl: data.leads > 0 ? data.investimento / data.leads : 0,
      taxaConversao: data.leads > 0 ? (data.conversoes / data.leads) * 100 : 0
    }));

    res.status(200).json({
      totalInvestimento, totalLeads, totalConversoes, totalCliques, totalImpressoes,
      cpl, cpc, taxaConversao, ctr, roas, plataformaStats
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
