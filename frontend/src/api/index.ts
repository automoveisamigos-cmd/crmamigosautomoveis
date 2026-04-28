import axios from 'axios';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:3000/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (credentials: any) => api.post('/auth/login', credentials);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Leads / Kanban
export const getLeads = () => api.get('/leads');
export const updateLeadStatus = (id: number, status: string) => api.patch(`/leads/${id}/status`, { status });
export const updateLead = (id: number, data: any) => api.patch(`/leads/${id}`, data);

// Estoque
export const getVeiculos = (categoria?: string) => api.get('/veiculos', { params: { categoria } });
export const getStockStats = () => api.get('/veiculos/stats');
export const createVeiculo = (data: any) => api.post('/veiculos', data);
export const updateVeiculo = (id: number, data: any) => api.patch(`/veiculos/${id}`, data);
export const deleteVeiculo = (id: number) => api.delete(`/veiculos/${id}`);

// Equipe
export const getVendedores = () => api.get('/vendedores');
export const createVendedor = (data: any) => api.post('/vendedores', data);
export const updateVendedor = (id: number, data: any) => api.patch(`/vendedores/${id}`, data);
export const deleteVendedor = (id: number) => api.delete(`/vendedores/${id}`);

// Tarefas
export const getTarefas = () => api.get('/tarefas');
export const createTarefa = (data: any) => api.post('/tarefas', data);
export const updateTarefa = (id: number, data: any) => api.patch(`/tarefas/${id}`, data);
export const toggleTarefa = (id: number) => api.patch(`/tarefas/${id}/toggle`);
export const deleteTarefa = (id: number) => api.delete(`/tarefas/${id}`);

// Social Hub
export const getSocialStats = () => api.get('/social/stats');
export const getSocialPosts = () => api.get('/social/posts');
export const syncSocialAll = () => api.post('/social/sync/all');
export const syncSocialPlatform = (platform: string) => api.post(`/social/sync/${platform}`);
export const getSocialSyncStatus = () => api.get('/social/sync/status');

// Ads / ROI
export const getAds = () => api.get('/ads');
export const getAdStats = () => api.get('/ads/stats');
export const syncAdsMeta = () => api.post('/ads/sync/meta');
export const syncAdsGoogle = () => api.post('/ads/sync/google');

export default api;
