import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { dispatchWebhook } from '../services/webhook';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const upsertLead = async (req: Request, res: Response) => {
  try {
    const { 
      nome, whatsapp, cidade, veiculo_interesse, veiculo_id, vendedor_id, tipo_compra, status, score,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      fbclid, gclid, src, sck, landing_page, referrer
    } = req.body;

    if (!whatsapp) {
      return res.status(400).json({ error: "O campo 'whatsapp' é obrigatório." });
    }

    const parsedVeiculoId = veiculo_id ? parseInt(veiculo_id as string) : null;
    let finalVendedorId = vendedor_id ? parseInt(vendedor_id as string) : null;

    // Higienização do WhatsApp (remover caracteres não numéricos e garantir 55)
    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    const safeWhatsapp = cleanWhatsapp.startsWith('55') ? cleanWhatsapp : `55${cleanWhatsapp}`;
    const safeNome = nome || "Interessado";

    const agora = new Date();
    const hora = agora.getHours();
    const foraHorario = hora < 8 || hora >= 19;
    const scoreToAdd = score ? parseInt(score as string) : 10;

    const existingLead = await prisma.lead.findUnique({
      where: { whatsapp: safeWhatsapp },
    });

    // Lógica de Atribuição Automática (Round-Robin) para Novos Leads
    if (!finalVendedorId && !existingLead) {
      const vendedores = await prisma.usuario.findMany({
        where: { role: 'Vendedor' },
        select: { id: true }
      });
      
      if (vendedores.length > 0) {
        const counts = await Promise.all(vendedores.map(async (v) => {
          const count = await prisma.lead.count({ where: { vendedor_id: v.id } });
          return { id: v.id, count };
        }));
        
        counts.sort((a, b) => a.count - b.count);
        finalVendedorId = counts[0].id;
      }
    }

    let lead;

    const trackingData = {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
      gclid,
      src,
      sck,
      landing_page,
      referrer
    };

    if (existingLead) {
      // Update existing lead
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          nome: safeNome,
          cidade: cidade || existingLead.cidade,
          veiculo_interesse: veiculo_interesse || existingLead.veiculo_interesse,
          veiculo_id: parsedVeiculoId || existingLead.veiculo_id,
          vendedor_id: finalVendedorId || existingLead.vendedor_id,
          tipo_compra: tipo_compra || existingLead.tipo_compra,
          score: { increment: scoreToAdd },
          ultima_interacao: agora,
          status: status || existingLead.status,
          ...trackingData
        },
      });
    } else {
      // Create new lead
      lead = await prisma.lead.create({
        data: {
          nome: safeNome,
          whatsapp: safeWhatsapp,
          cidade: cidade || null,
          veiculo_interesse: veiculo_interesse || null,
          veiculo_id: parsedVeiculoId,
          vendedor_id: finalVendedorId,
          tipo_compra: tipo_compra || null,
          score: scoreToAdd,
          flag_fora_horario: foraHorario,
          ultima_interacao: agora,
          status: status || "Novo Lead",
          ...trackingData
        },
      });
    }

    // Não damos await travante no Webhook. O .catch evita erros 500 no endpoint caso a requisição externa falhe.
    dispatchWebhook('lead_upsert', {
        id: lead.id,
        nome: lead.nome,
        whatsapp: lead.whatsapp,
        score: lead.score,
        urgencia: lead.score >= 50 ? 'Alta' : 'Normal',
        status: lead.status
    }).catch(err => console.error("Falha silenciosa no Webhook:", err));

    res.status(200).json(lead);
  } catch (error) {
    console.error("Error upserting lead:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const where: any = {};
    
    if (user.role !== 'Admin') {
      where.vendedor_id = user.id;
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        vendedor: {
          select: { id: true, nome: true }
        }
      },
      orderBy: { ultima_interacao: 'desc' }
    });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        ultima_interacao: new Date()
      }
    });

    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const assignVendedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vendedor_id } = req.body;
    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: { vendedor_id: vendedor_id ? parseInt(vendedor_id) : null }
    });
    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalLeads = await prisma.lead.count();
    const leadsIA = await prisma.lead.count({ where: { flag_fora_horario: true } });
    
    // Social Growth (30 days)
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const plataformas = ['Instagram', 'YouTube', 'TikTok', 'Kwai', 'Facebook'];
    
    const socialGrowth = await Promise.all(plataformas.map(async (plat) => {
      const atual = await prisma.statusSocial.findFirst({
        where: { plataforma: plat },
        orderBy: { data: 'desc' }
      });
      const passado = await prisma.statusSocial.findFirst({
        where: { plataforma: plat, data: { lte: trintaDiasAtras } },
        orderBy: { data: 'desc' }
      });
      const followersNow = atual?.seguidores || 0;
      const followersThen = passado?.seguidores || 0;
      return {
        plataforma: plat,
        atual: followersNow,
        crescimento: followersNow - followersThen,
        percentual: followersThen > 0 ? ((followersNow - followersThen) / followersThen) * 100 : 0
      };
    }));

    const stats = {
      totalLeads,
      leadsIA,
      roiEstimado: leadsIA * 0.05 * 80000,
      recentActivity: [
        { name: 'Hoje', totais: totalLeads, foraHorario: leadsIA }
      ],
      socialGrowth
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      nome, whatsapp, cidade, veiculo_interesse, veiculo_id, tipo_compra, status, score,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      fbclid, gclid, src, sck, landing_page, referrer
    } = req.body;

    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        whatsapp,
        cidade,
        veiculo_interesse,
        veiculo_id: veiculo_id ? parseInt(veiculo_id) : null,
        tipo_compra,
        status,
        score: score ? parseInt(score) : undefined,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        fbclid,
        gclid,
        src,
        sck,
        landing_page,
        referrer,
        ultima_interacao: new Date()
      }
    });

    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
