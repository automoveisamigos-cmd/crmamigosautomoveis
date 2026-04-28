import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPostsSocial = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.postSocial.findMany({
      orderBy: { data_postagem: 'desc' }
    });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createPostSocial = async (req: Request, res: Response) => {
  try {
    const { 
      plataforma, link, titulo, thumbnail, visualizacoes, likes, comentarios, 
      compartilhamentos, salvamentos, alcance, retencao_media, horas_assistidas, data_postagem 
    } = req.body;
    
    const parseNumber = (val: any) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    const post = await prisma.postSocial.create({
      data: {
        plataforma,
        link,
        titulo,
        thumbnail,
        visualizacoes: Math.floor(parseNumber(visualizacoes)),
        likes: Math.floor(parseNumber(likes)),
        comentarios: Math.floor(parseNumber(comentarios)),
        compartilhamentos: Math.floor(parseNumber(compartilhamentos)),
        salvamentos: Math.floor(parseNumber(salvamentos)),
        alcance: Math.floor(parseNumber(alcance)),
        retencao_media: parseNumber(retencao_media),
        horas_assistidas: parseNumber(horas_assistidas),
        data_postagem: data_postagem ? new Date(data_postagem) : new Date()
      }
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deletePostSocial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.postSocial.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSocialStats = async (req: Request, res: Response) => {
  try {
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    // Stats gerais por plataforma
    const stats = await prisma.postSocial.groupBy({
      by: ['plataforma'],
      _sum: { 
        visualizacoes: true, 
        likes: true, 
        comentarios: true, 
        horas_assistidas: true,
        compartilhamentos: true,
        salvamentos: true,
        alcance: true
      },
      _count: { id: true }
    });

    // Views e contagem dos últimos 7 dias por plataforma
    const activity7d = await prisma.postSocial.groupBy({
      by: ['plataforma'],
      where: { data_postagem: { gte: seteDiasAtras } },
      _sum: { visualizacoes: true, horas_assistidas: true },
      _count: { id: true }
    });

    // Seguidores (atual vs 7 dias atrás)
    const plataformas = ['Instagram', 'YouTube', 'TikTok', 'Kwai', 'Facebook'];
    const followerStats = await Promise.all(plataformas.map(async (plat) => {
      const atual = await prisma.statusSocial.findFirst({
        where: { plataforma: plat },
        orderBy: { data: 'desc' }
      });
      const passado = await prisma.statusSocial.findFirst({
        where: { plataforma: plat, data: { lte: seteDiasAtras } },
        orderBy: { data: 'desc' }
      });
      return {
        plataforma: plat,
        seguidores_atuais: atual?.seguidores || 0,
        crescimento_seguidores: (atual?.seguidores || 0) - (passado?.seguidores || 0)
      };
    }));

    const finalStats = stats.map(s => {
      const act7 = activity7d.find(v => v.plataforma === s.plataforma);
      const fs = followerStats.find(f => f.plataforma === s.plataforma);
      return {
        ...s,
        views_7d: act7?._sum.visualizacoes || 0,
        horas_7d: act7?._sum.horas_assistidas || 0,
        posts_7d: act7?._count.id || 0,
        seguidores: fs?.seguidores_atuais || 0,
        crescimento_seguidores: fs?.crescimento_seguidores || 0,
        total_comentarios: s._sum.comentarios || 0,
        total_horas: s._sum.horas_assistidas || 0,
        total_compartilhamentos: s._sum.compartilhamentos || 0,
        total_salvamentos: s._sum.salvamentos || 0,
        total_alcance: s._sum.alcance || 0
      };
    });

    res.status(200).json(finalStats);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createStatusSocial = async (req: Request, res: Response) => {
  try {
    const { plataforma, seguidores } = req.body;
    const status = await prisma.statusSocial.create({
      data: {
        plataforma,
        seguidores: parseInt(seguidores) || 0,
        data: new Date()
      }
    });
    res.status(201).json(status);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePostSocial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      plataforma, link, titulo, thumbnail, visualizacoes, likes, comentarios, 
      compartilhamentos, salvamentos, alcance, retencao_media, horas_assistidas, data_postagem 
    } = req.body;
    
    const parseNumber = (val: any) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    const post = await prisma.postSocial.update({
      where: { id: parseInt(id) },
      data: {
        plataforma,
        link,
        titulo,
        thumbnail,
        visualizacoes: Math.floor(parseNumber(visualizacoes)),
        likes: Math.floor(parseNumber(likes)),
        comentarios: Math.floor(parseNumber(comentarios)),
        compartilhamentos: Math.floor(parseNumber(compartilhamentos)),
        salvamentos: Math.floor(parseNumber(salvamentos)),
        alcance: Math.floor(parseNumber(alcance)),
        retencao_media: parseNumber(retencao_media),
        horas_assistidas: parseNumber(horas_assistidas),
        data_postagem: data_postagem ? new Date(data_postagem) : undefined
      }
    });

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
