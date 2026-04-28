import { Request, Response } from 'express';
import { syncInstagram, syncYouTube, syncTikTok, getSocialIntegrationStatus } from '../services/socialSync';

export const getSocialSyncStatus = async (req: Request, res: Response) => {
  const statusMap: any = await getSocialIntegrationStatus();
  // Transform object { instagram: { connected: true, label: 'Instagram' }, ... } 
  // into array [ { plataforma: 'Instagram', status: 'Sync' }, ... ]
  const statusArray = Object.values(statusMap).map((s: any) => ({
    plataforma: s.label,
    status: s.connected ? 'Sync' : 'Offline'
  }));
  res.status(200).json(statusArray);
};

export const syncSocialPlatform = async (req: Request, res: Response) => {
  const { platform } = req.params;

  let result;
  switch (platform) {
    case 'instagram':
      result = await syncInstagram();
      break;
    case 'youtube':
      result = await syncYouTube();
      break;
    case 'tiktok':
      result = await syncTikTok();
      break;
    default:
      return res.status(400).json({ error: `Plataforma '${platform}' não suportada para sincronização automática.` });
  }

  if (result.error) {
    return res.status(400).json({ success: false, ...result });
  }

  res.status(200).json({
    success: true,
    message: `${result.synced} posts de ${result.platform} sincronizados com sucesso.`,
    ...result
  });
};

export const syncAllSocial = async (req: Request, res: Response) => {
  const results = await Promise.allSettled([
    syncInstagram(),
    syncYouTube(),
    syncTikTok()
  ]);

  const summary = results.map((r, i) => {
    const platform = ['Instagram', 'YouTube', 'TikTok'][i];
    if (r.status === 'fulfilled') return { platform, ...r.value };
    return { platform, synced: 0, error: r.reason?.message };
  });

  res.status(200).json({ success: true, summary });
};
