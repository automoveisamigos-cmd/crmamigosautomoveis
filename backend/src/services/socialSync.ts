import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: busca token do banco de dados (salvo via OAuth)
const getToken = async (platform: string) => {
  const record = await prisma.socialToken.findUnique({ where: { plataforma: platform } });
  if (!record) return null;
  const extra = record.extra_data ? JSON.parse(record.extra_data) : {};
  return { token: record.access_token, ...extra };
};

// ─────────────────────────────────────────────
// INSTAGRAM & FACEBOOK (Meta Graph API)
// Requer: META_ACCESS_TOKEN e META_IG_USER_ID no .env
// Token gerado em: developers.facebook.com → Graph API Explorer
// Permissões necessárias: instagram_basic, instagram_manage_insights, pages_read_engagement
// ─────────────────────────────────────────────
export const syncInstagram = async () => {
  // Prioridade: token OAuth do banco → variável de ambiente
  const dbToken = await getToken('instagram');
  const token = dbToken?.token || process.env.META_ACCESS_TOKEN;
  const igUserId = dbToken?.ig_user_id || process.env.META_IG_USER_ID;

  if (!token || !igUserId) {
    return { synced: 0, error: 'Conecte sua conta Instagram no painel de Sincronização.' };
  }

  try {
    // 1. Busca dados do perfil (seguidores)
    const profileRes = await axios.get(`https://graph.facebook.com/v19.0/${igUserId}`, {
      params: { fields: 'followers_count,media_count', access_token: token }
    });
    
    await prisma.statusSocial.create({
      data: { plataforma: 'Instagram', seguidores: profileRes.data.followers_count || 0, data: new Date() }
    });

    // 2. Busca posts recentes
    const mediaRes = await axios.get(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      params: {
        fields: 'id,caption,media_type,timestamp,permalink,thumbnail_url,media_url',
        limit: 20,
        access_token: token
      }
    });

    const posts = mediaRes.data?.data || [];
    let synced = 0;

    for (const post of posts) {
      // 3. Busca insights de cada post
      const insightsRes = await axios.get(`https://graph.facebook.com/v19.0/${post.id}/insights`, {
        params: {
          metric: 'impressions,reach,likes,comments,shares,saved,video_views',
          access_token: token
        }
      }).catch(() => ({ data: { data: [] } }));

      const metrics: Record<string, number> = {};
      for (const m of insightsRes.data?.data || []) {
        metrics[m.name] = m.values?.[0]?.value || 0;
      }

      // Verifica se já existe pelo link
      const existing = await prisma.postSocial.findFirst({
        where: { link: post.permalink || post.id }
      });

      const data = {
        plataforma: 'Instagram',
        link: post.permalink || post.id,
        titulo: post.caption?.substring(0, 100) || 'Post Instagram',
        thumbnail: post.thumbnail_url || post.media_url || null,
        visualizacoes: metrics.video_views || 0,
        likes: metrics.likes || 0,
        comentarios: metrics.comments || 0,
        compartilhamentos: metrics.shares || 0,
        salvamentos: metrics.saved || 0,
        alcance: metrics.reach || 0,
        retencao_media: 0,
        horas_assistidas: 0,
        data_postagem: new Date(post.timestamp)
      };

      if (existing) {
        await prisma.postSocial.update({ where: { id: existing.id }, data });
      } else {
        await prisma.postSocial.create({ data });
      }
      synced++;
    }

    return { synced, platform: 'Instagram' };
  } catch (error: any) {
    const msg = error?.response?.data?.error?.message || error.message;
    return { synced: 0, error: msg };
  }
};

// ─────────────────────────────────────────────
// YOUTUBE
// Requer: YOUTUBE_API_KEY e YOUTUBE_CHANNEL_ID no .env
// API Key gratuita em: console.cloud.google.com → YouTube Data API v3
// ─────────────────────────────────────────────
export const syncYouTube = async () => {
  // Prioridade: token OAuth do banco → API Key do .env
  const dbToken = await getToken('youtube');
  const accessToken = dbToken?.token;
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = dbToken?.channel_id || process.env.YOUTUBE_CHANNEL_ID;

  if (!channelId || (!accessToken && !apiKey)) {
    return { synced: 0, error: 'Conecte sua conta YouTube no painel de Sincronização.' };
  }

  const authParam = accessToken 
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : { params: { key: apiKey } };

  try {
    // 1. Busca dados do canal (subscribers)
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: accessToken 
        ? { part: 'statistics,snippet', mine: true } 
        : { part: 'statistics', id: channelId, key: apiKey },
      ...authParam
    });

    const channelStats = channelRes.data?.items?.[0]?.statistics;
    if (channelStats) {
      await prisma.statusSocial.create({
        data: { plataforma: 'YouTube', seguidores: parseInt(channelStats.subscriberCount || '0'), data: new Date() }
      });
    }

    // 2. Busca vídeos recentes
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        channelId,
        type: 'video',
        order: 'date',
        maxResults: 20,
        ...(apiKey ? { key: apiKey } : {})
      },
      ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {})
    });

    const videoIds = searchRes.data?.items?.map((v: any) => v.id.videoId).join(',');
    if (!videoIds) return { synced: 0, platform: 'YouTube' };

    // 3. Busca estatísticas de cada vídeo
    const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'statistics,snippet,contentDetails',
        id: videoIds,
        key: apiKey
      }
    });

    let synced = 0;
    for (const video of statsRes.data?.items || []) {
      const s = video.statistics;
      const link = `https://youtube.com/watch?v=${video.id}`;
      const existing = await prisma.postSocial.findFirst({ where: { link } });

      // Parse duração ISO 8601 para horas
      const dur = video.contentDetails?.duration || 'PT0S';
      const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const durationSeconds = parseInt(match?.[1] || '0') * 3600 + parseInt(match?.[2] || '0') * 60 + parseInt(match?.[3] || '0');

      const views = parseInt(s.viewCount || '0');
      const retencaoEstimada = 40; // YouTube médio é 40%
      const horasAssistidas = (views * (durationSeconds * retencaoEstimada / 100)) / 3600;

      const data = {
        plataforma: 'YouTube',
        link,
        titulo: video.snippet.title,
        thumbnail: video.snippet.thumbnails?.medium?.url || null,
        visualizacoes: views,
        likes: parseInt(s.likeCount || '0'),
        comentarios: parseInt(s.commentCount || '0'),
        compartilhamentos: 0,
        salvamentos: 0,
        alcance: views,
        retencao_media: retencaoEstimada,
        horas_assistidas: Math.round(horasAssistidas * 10) / 10,
        data_postagem: new Date(video.snippet.publishedAt)
      };

      if (existing) {
        await prisma.postSocial.update({ where: { id: existing.id }, data });
      } else {
        await prisma.postSocial.create({ data });
      }
      synced++;
    }

    return { synced, platform: 'YouTube' };
  } catch (error: any) {
    return { synced: 0, error: error?.response?.data?.error?.message || error.message };
  }
};

// ─────────────────────────────────────────────
// TIKTOK
// Requer: TIKTOK_ACCESS_TOKEN no .env
// Token gerado via TikTok for Business → Developer → Content Posting API
// Permissão necessária: video.list, user.info.basic
// ─────────────────────────────────────────────
export const syncTikTok = async () => {
  const dbToken = await getToken('tiktok');
  const token = dbToken?.token || process.env.TIKTOK_ACCESS_TOKEN;

  if (!token) {
    return { synced: 0, error: 'Conecte sua conta TikTok no painel de Sincronização.' };
  }

  try {
    // TikTok Content Posting API v2
    const res = await axios.post('https://open.tiktokapis.com/v2/video/list/', {
      max_count: 20
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        fields: 'id,title,create_time,cover_image_url,share_url,view_count,like_count,comment_count,share_count,duration'
      }
    });

    const videos = res.data?.data?.videos || [];
    
    // Busca seguidores do perfil
    const profileRes = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { fields: 'follower_count,following_count' }
    }).catch(() => null);

    if (profileRes?.data?.data?.user?.follower_count) {
      await prisma.statusSocial.create({
        data: { plataforma: 'TikTok', seguidores: profileRes.data.data.user.follower_count, data: new Date() }
      });
    }

    let synced = 0;
    for (const video of videos) {
      const link = video.share_url || `https://tiktok.com/@user/video/${video.id}`;
      const existing = await prisma.postSocial.findFirst({ where: { link } });

      const views = video.view_count || 0;
      const durSec = video.duration || 30;
      const retencaoEstimada = 65; // TikTok tem retenção alta (~65%)
      const horasAssistidas = (views * (durSec * retencaoEstimada / 100)) / 3600;

      const data = {
        plataforma: 'TikTok',
        link,
        titulo: video.title || 'Vídeo TikTok',
        thumbnail: video.cover_image_url || null,
        visualizacoes: views,
        likes: video.like_count || 0,
        comentarios: video.comment_count || 0,
        compartilhamentos: video.share_count || 0,
        salvamentos: 0,
        alcance: views,
        retencao_media: retencaoEstimada,
        horas_assistidas: Math.round(horasAssistidas * 10) / 10,
        data_postagem: new Date(video.create_time * 1000)
      };

      if (existing) {
        await prisma.postSocial.update({ where: { id: existing.id }, data });
      } else {
        await prisma.postSocial.create({ data });
      }
      synced++;
    }

    return { synced, platform: 'TikTok' };
  } catch (error: any) {
    return { synced: 0, error: error?.response?.data?.error?.message || error.message };
  }
};

// ─────────────────────────────────────────────
// KWAI
// Sem API pública disponível. 
// Solução: Exportação manual de relatório CSV + webhook do n8n para processar
// ─────────────────────────────────────────────
export const getSocialIntegrationStatus = async () => {
  const tokens = await prisma.socialToken.findMany();
  const connected = (plat: string) => tokens.some(t => t.plataforma === plat);
  return {
    instagram: { connected: connected('instagram') || !!(process.env.META_ACCESS_TOKEN), label: 'Instagram' },
    facebook: { connected: connected('instagram') || !!(process.env.META_ACCESS_TOKEN), label: 'Facebook' },
    youtube: { connected: connected('youtube') || !!(process.env.YOUTUBE_API_KEY), label: 'YouTube' },
    tiktok: { connected: connected('tiktok') || !!(process.env.TIKTOK_ACCESS_TOKEN), label: 'TikTok' },
    kwai: { connected: false, label: 'Kwai' }
  };
};
