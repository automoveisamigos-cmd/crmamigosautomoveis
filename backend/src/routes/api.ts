import { Router } from 'express';
import { upsertLead, getLeads, updateLeadStatus, assignVendedor, getDashboardStats, updateLead } from '../controllers/LeadController';
import { getEstoque, createVeiculo, updateVeiculo, deleteVeiculo, searchVeiculos, getStockStats } from '../controllers/VeiculoController';
import { getTarefas, createTarefa, toggleTarefa, deleteTarefa, updateTarefa } from '../controllers/TarefaController';
import { getVendedores, createVendedor, deleteVendedor, updateVendedor } from '../controllers/VendedorController';
import { createAgendamento } from '../controllers/AgendamentoController';
import { getPostsSocial, createPostSocial, deletePostSocial, getSocialStats, createStatusSocial, updatePostSocial } from '../controllers/SocialController';
import { login, setupAdmin } from '../controllers/AuthController';
import { getAds, createAd, updateAd, deleteAd, getAdStats } from '../controllers/AdsController';
import { syncAdsFromMeta, syncAdsFromGoogle, getAdsIntegrationStatus } from '../controllers/AdsSyncController';
import { getSocialSyncStatus, syncSocialPlatform, syncAllSocial } from '../controllers/SocialSyncController';
import { getOAuthStatus, connectInstagram, callbackInstagram, connectYouTube, callbackYouTube, connectTikTok, callbackTikTok, disconnectPlatform } from '../controllers/SocialOAuthController';
import { authMiddleware } from '../middlewares/auth';
import { upload } from '../config/multer';

const router = Router();

// Upload
router.post('/upload', authMiddleware, upload.array('fotos', 10), (req, res) => {
  const files = req.files as Express.Multer.File[];
  const urls = files.map(file => `/uploads/${file.filename}`);
  res.json({ urls });
});

// Auth Routes
router.post('/auth/login', login);
router.post('/auth/setup', setupAdmin);

// Protected Routes (Dashboard/CRM access)
router.get('/leads', authMiddleware, getLeads);
router.patch('/leads/:id', authMiddleware, updateLead);
router.patch('/leads/:id/status', authMiddleware, updateLeadStatus);
router.patch('/leads/:id/assign', authMiddleware, assignVendedor);
router.get('/dashboard/stats', authMiddleware, getDashboardStats);

// Estoque
router.get('/veiculos/stats', authMiddleware, getStockStats);
router.get('/veiculos', authMiddleware, getEstoque);
router.post('/veiculos', authMiddleware, createVeiculo);
router.patch('/veiculos/:id', authMiddleware, updateVeiculo);
router.delete('/veiculos/:id', authMiddleware, deleteVeiculo);
router.get('/veiculos/search', authMiddleware, searchVeiculos);

// Tarefas
router.get('/tarefas', authMiddleware, getTarefas);
router.post('/tarefas', authMiddleware, createTarefa);
router.patch('/tarefas/:id', authMiddleware, updateTarefa);
router.patch('/tarefas/:id/toggle', authMiddleware, toggleTarefa);
router.delete('/tarefas/:id', authMiddleware, deleteTarefa);

// Equipe
router.get('/vendedores', authMiddleware, getVendedores);
router.post('/vendedores', authMiddleware, createVendedor);
router.patch('/vendedores/:id', authMiddleware, updateVendedor);
router.delete('/vendedores/:id', authMiddleware, deleteVendedor);

// Redes Sociais
router.get('/social/posts', authMiddleware, getPostsSocial);
router.post('/social/posts', authMiddleware, createPostSocial);
router.patch('/social/posts/:id', authMiddleware, updatePostSocial);
router.delete('/social/posts/:id', authMiddleware, deletePostSocial);
router.get('/social/stats', authMiddleware, getSocialStats);
router.post('/social/status', authMiddleware, createStatusSocial);

// Sincronização Automática de Redes Sociais
router.get('/social/sync/status', authMiddleware, getSocialSyncStatus);
router.post('/social/sync/all', authMiddleware, syncAllSocial);
router.post('/social/sync/:platform', authMiddleware, syncSocialPlatform);

// Webhook / AI Endpoint (No auth required to create leads from WhatsApp)
router.post('/leads/upsert', upsertLead);

// Protected Routes
router.get('/veiculos/search', authMiddleware, searchVeiculos);
router.post('/agendamentos', authMiddleware, createAgendamento);

// Ads / Investimentos
router.get('/ads/stats', authMiddleware, getAdStats);
router.get('/ads/integration/status', authMiddleware, getAdsIntegrationStatus);
router.post('/ads/sync/meta', authMiddleware, syncAdsFromMeta);
router.post('/ads/sync/google', authMiddleware, syncAdsFromGoogle);
router.get('/ads', authMiddleware, getAds);
router.post('/ads', authMiddleware, createAd);
router.patch('/ads/:id', authMiddleware, updateAd);
router.delete('/ads/:id', authMiddleware, deleteAd);

export default router;
