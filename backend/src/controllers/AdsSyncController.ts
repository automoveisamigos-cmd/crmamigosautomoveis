import { Request, Response } from 'express';
import { syncMetaAds, syncGoogleAds } from '../services/adsSync';

export const syncAdsFromMeta = async (req: Request, res: Response) => {
  const result = await syncMetaAds();
  if (result.error) {
    return res.status(400).json({ success: false, ...result });
  }
  res.status(200).json({ success: true, message: `${result.synced} campanhas sincronizadas da Meta Ads`, ...result });
};

export const syncAdsFromGoogle = async (req: Request, res: Response) => {
  const result = await syncGoogleAds();
  res.status(200).json({ success: true, ...result });
};

export const getAdsIntegrationStatus = async (req: Request, res: Response) => {
  const meta = !!(process.env.META_ADS_ACCESS_TOKEN && process.env.META_ADS_ACCOUNT_ID);
  const google = !!(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CUSTOMER_ID);

  res.status(200).json({
    meta: { connected: meta, label: 'Meta Ads (Facebook/Instagram)' },
    google: { connected: google, label: 'Google Ads' },
    tiktok: { connected: false, label: 'TikTok Ads (Em breve)' }
  });
};
