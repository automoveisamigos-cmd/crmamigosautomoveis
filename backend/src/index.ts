import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/api';
import { AutoSyncService } from './services/AutoSyncService';

dotenv.config();

import cron from 'node-cron';
import { syncMetaAds } from './services/adsSync';

// Inicializar sincronização automática com Google Sheets
AutoSyncService.init();

// Sincronização de Ads (a cada 1 hora)
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Iniciando sincronização automática de Meta Ads...');
  await syncMetaAds();
});

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
