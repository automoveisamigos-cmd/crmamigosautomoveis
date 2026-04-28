import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────
// Helper: lê o CRM_URL base para montar o callback URL
// ─────────────────────────────────────────────────────
const getCallbackBase = (req: Request) => {
  const crmUrl = process.env.CRM_PUBLIC_URL || `http://localhost:3000`;
  return `${crmUrl}/api/social/oauth/callback`;
};

// ─────────────────────────────────────────────────────
// GET /api/social/oauth/status
// Retorna quais plataformas estão conectadas (com token salvo no DB)
// ─────────────────────────────────────────────────────
export const getOAuthStatus = async (req: Request, res: Response) => {
  const tokens = await prisma.socialToken.findMany();
  const status: Record<string, any> = {
    instagram: { connected: false, label: 'Instagram' },
    youtube: { connected: false, label: 'YouTube' },
    tiktok: { connected: false, label: 'TikTok' },
  };

  for (const t of tokens) {
    const plat = t.plataforma.toLowerCase();
    if (status[plat]) {
      const extra = t.extra_data ? JSON.parse(t.extra_data) : {};
      status[plat] = {
        connected: true,
        label: status[plat].label,
        expires_at: t.expires_at,
        username: extra.username || extra.channel_title || null,
        atualizado_em: t.atualizado_em
      };
    }
  }

  res.status(200).json(status);
};

// ─────────────────────────────────────────────────────
// GET /api/social/oauth/connect/instagram
// Redireciona para o login do Instagram (Meta OAuth)
// Precisa: META_APP_ID, META_APP_SECRET no .env
// ─────────────────────────────────────────────────────
export const connectInstagram = (req: Request, res: Response) => {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    return res.status(400).json({
      error: 'META_APP_ID não configurado no .env',
      howTo: 'Acesse developers.facebook.com → Meus Apps → Criar App → ID do App'
    });
  }

  const callbackUrl = `${getCallbackBase(req)}/instagram`;
  const scopes = 'instagram_basic,instagram_manage_insights,pages_read_engagement,pages_show_list';
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scopes}&response_type=code`;

  res.redirect(url);
};

// ─────────────────────────────────────────────────────
// GET /api/social/oauth/callback/instagram
// ─────────────────────────────────────────────────────
export const callbackInstagram = async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error || !code) {
    return res.redirect(`${frontendUrl}/social?oauth=error&platform=instagram&reason=${error || 'no_code'}`);
  }

  try {
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const callbackUrl = `${getCallbackBase(req)}/instagram`;

    // 1. Troca o code por access_token
    const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: { client_id: appId, client_secret: appSecret, redirect_uri: callbackUrl, code }
    });
    const shortToken = tokenRes.data.access_token;

    // 2. Troca por long-lived token (válido por 60 dias)
    const longTokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: { grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: shortToken }
    });
    const longToken = longTokenRes.data.access_token;
    const expiresIn = longTokenRes.data.expires_in || 5184000; // 60 dias em segundos

    // 3. Busca ID e nome do usuário IG
    const meRes = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: { access_token: longToken, fields: 'instagram_business_account,name' }
    });

    const page = meRes.data?.data?.[0];
    const igUserId = page?.instagram_business_account?.id;

    // 4. Busca username
    let username = null;
    if (igUserId) {
      const igRes = await axios.get(`https://graph.facebook.com/v19.0/${igUserId}`, {
        params: { fields: 'username,followers_count', access_token: longToken }
      });
      username = igRes.data?.username;
    }

    // 5. Salva no banco
    await prisma.socialToken.upsert({
      where: { plataforma: 'instagram' },
      update: {
        access_token: longToken,
        expires_at: new Date(Date.now() + expiresIn * 1000),
        extra_data: JSON.stringify({ ig_user_id: igUserId, username }),
        atualizado_em: new Date()
      },
      create: {
        plataforma: 'instagram',
        access_token: longToken,
        expires_at: new Date(Date.now() + expiresIn * 1000),
        extra_data: JSON.stringify({ ig_user_id: igUserId, username })
      }
    });

    res.redirect(`${frontendUrl}/social?oauth=success&platform=instagram`);
  } catch (err: any) {
    console.error('[OAuth Instagram]', err?.response?.data || err.message);
    res.redirect(`${frontendUrl}/social?oauth=error&platform=instagram`);
  }
};

// ─────────────────────────────────────────────────────
// GET /api/social/oauth/connect/youtube
// Redireciona para Google OAuth
// Precisa: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET no .env
// ─────────────────────────────────────────────────────
export const connectYouTube = (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({
      error: 'GOOGLE_CLIENT_ID não configurado no .env',
      howTo: 'Acesse console.cloud.google.com → APIs → Credenciais → Criar ID OAuth2'
    });
  }

  const callbackUrl = `${getCallbackBase(req)}/youtube`;
  const scopes = encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`;

  res.redirect(url);
};

// ─────────────────────────────────────────────────────
// GET /api/social/oauth/callback/youtube
// ─────────────────────────────────────────────────────
export const callbackYouTube = async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error || !code) {
    return res.redirect(`${frontendUrl}/social?oauth=error&platform=youtube`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const callbackUrl = `${getCallbackBase(req)}/youtube`;

    // Troca code por tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: callbackUrl, grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Busca dados do canal
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet,statistics', mine: true },
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const channel = channelRes.data?.items?.[0];
    const channelId = channel?.id;
    const channelTitle = channel?.snippet?.title;

    await prisma.socialToken.upsert({
      where: { plataforma: 'youtube' },
      update: {
        access_token, refresh_token,
        expires_at: new Date(Date.now() + (expires_in || 3600) * 1000),
        extra_data: JSON.stringify({ channel_id: channelId, channel_title: channelTitle }),
        atualizado_em: new Date()
      },
      create: {
        plataforma: 'youtube',
        access_token, refresh_token,
        expires_at: new Date(Date.now() + (expires_in || 3600) * 1000),
        extra_data: JSON.stringify({ channel_id: channelId, channel_title: channelTitle })
      }
    });

    res.redirect(`${frontendUrl}/social?oauth=success&platform=youtube`);
  } catch (err: any) {
    console.error('[OAuth YouTube]', err?.response?.data || err.message);
    res.redirect(`${frontendUrl}/social?oauth=error&platform=youtube`);
  }
};

// ─────────────────────────────────────────────────────
// GET /api/social/oauth/connect/tiktok
// Redireciona para TikTok OAuth
// Precisa: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET no .env
// ─────────────────────────────────────────────────────
export const connectTikTok = (req: Request, res: Response) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) {
    return res.status(400).json({
      error: 'TIKTOK_CLIENT_KEY não configurado no .env',
      howTo: 'Acesse developers.tiktok.com → Manage Apps → Client Key'
    });
  }

  const callbackUrl = `${getCallbackBase(req)}/tiktok`;
  const state = Math.random().toString(36).substring(7); // CSRF protection
  const url = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=user.info.basic,video.list&state=${state}`;

  res.redirect(url);
};

// ─────────────────────────────────────────────────────
// GET /api/social/oauth/callback/tiktok
// ─────────────────────────────────────────────────────
export const callbackTikTok = async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error || !code) {
    return res.redirect(`${frontendUrl}/social?oauth=error&platform=tiktok`);
  }

  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY!;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
    const callbackUrl = `${getCallbackBase(req)}/tiktok`;

    const tokenRes = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
      client_key: clientKey, client_secret: clientSecret,
      code, grant_type: 'authorization_code', redirect_uri: callbackUrl
    }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token, refresh_token, expires_in, open_id } = tokenRes.data;

    // Busca info do usuário
    const userRes = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { fields: 'display_name,follower_count,avatar_url' }
    }).catch(() => null);

    const username = userRes?.data?.data?.user?.display_name;

    await prisma.socialToken.upsert({
      where: { plataforma: 'tiktok' },
      update: {
        access_token, refresh_token,
        expires_at: new Date(Date.now() + (expires_in || 86400) * 1000),
        extra_data: JSON.stringify({ open_id, username }),
        atualizado_em: new Date()
      },
      create: {
        plataforma: 'tiktok',
        access_token, refresh_token,
        expires_at: new Date(Date.now() + (expires_in || 86400) * 1000),
        extra_data: JSON.stringify({ open_id, username })
      }
    });

    res.redirect(`${frontendUrl}/social?oauth=success&platform=tiktok`);
  } catch (err: any) {
    console.error('[OAuth TikTok]', err?.response?.data || err.message);
    res.redirect(`${frontendUrl}/social?oauth=error&platform=tiktok`);
  }
};

// ─────────────────────────────────────────────────────
// DELETE /api/social/oauth/disconnect/:platform
// ─────────────────────────────────────────────────────
export const disconnectPlatform = async (req: Request, res: Response) => {
  const { platform } = req.params;
  try {
    await prisma.socialToken.delete({ where: { plataforma: platform.toLowerCase() } });
    res.status(200).json({ success: true, message: `${platform} desconectado com sucesso.` });
  } catch {
    res.status(404).json({ error: 'Plataforma não estava conectada.' });
  }
};
