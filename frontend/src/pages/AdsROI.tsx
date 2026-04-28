import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Facebook, Globe, Link2, Zap, TrendingUp, DollarSign, MousePointer2, Target, Award, EyeOff, Clock, Users, RefreshCw } from 'lucide-react';
import { getAds, getAdStats, syncAdsMeta } from '../api';

const AdsROI: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, adsRes] = await Promise.all([getAdStats(), getAds()]);
      setStats(statsRes.data);
      setAds(adsRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados de ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncMeta = async () => {
    setSyncing(true);
    try {
      const res = await syncAdsMeta();
      alert(res.data.message || 'Sincronização concluída com sucesso!');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao sincronizar com Meta Ads. Verifique suas credenciais.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Layout activeTab="ads">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Investimento em Ads</h1>
          <p className="text-gray-400">Analise o ROI das suas campanhas e descubra onde cada lead veio.</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all">
          <Plus size={20} />
          Nova Campanha
        </button>
      </div>

      {/* Integrations Section */}
      <div className="bg-[#171717] p-6 rounded-2xl border border-gray-800 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Zap size={18} className="text-orange-500" />
          <h3 className="font-bold">Integrações Automáticas</h3>
          <span className="bg-orange-500/20 text-orange-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Beta</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-black/40 p-5 rounded-xl border border-gray-800 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Facebook size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Meta Ads</p>
                <p className="text-[10px] text-gray-500">Facebook & Instagram</p>
              </div>
            </div>
            <button onClick={handleSyncMeta} disabled={syncing} className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:underline disabled:opacity-50">
              {syncing ? <RefreshCw size={12} className="animate-spin" /> : <TrendingUp size={12} />} Sincronizar
            </button>
          </div>

          <div className="bg-black/40 p-5 rounded-xl border border-gray-800 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Google Ads</p>
                <p className="text-[10px] text-gray-500">Search & Display</p>
              </div>
            </div>
            <button className="text-[10px] font-bold text-red-500 flex items-center gap-1 hover:underline">
              <TrendingUp size={12} /> Sincronizar
            </button>
          </div>

          <div className="bg-black/40 p-5 rounded-xl border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                <Link2 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">UTM Tracking</p>
                <p className="text-[10px] text-gray-500">Rastreio por link</p>
              </div>
            </div>
            <div className="text-[10px] font-bold text-green-500 flex items-center gap-1">
              <Award size={12} /> Ativo
            </div>
          </div>
        </div>
        <p className="mt-6 text-[10px] text-gray-600 flex items-center gap-2">
          <Clock size={12} /> Para ativar Meta/Google: adicione META_ADS_ACCESS_TOKEN e GOOGLE_ADS_DEVELOPER_TOKEN no arquivo .env do backend.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'TOTAL INVESTIDO', value: `R$ ${stats?.totalInvestimento?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, sub: `${stats?.totalLeads || 0} leads gerados`, icon: DollarSign, color: 'orange' },
          { label: 'CPL (CUSTO/LEAD)', value: `R$ ${stats?.cpl?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, sub: `${stats?.totalLeads || 0} leads no total`, icon: Target, color: 'orange' },
          { label: 'CPC (CUSTO/CLIQUE)', value: `R$ ${stats?.cpc?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, sub: `CTR: ${stats?.ctr?.toFixed(2) || '0.00'}%`, icon: MousePointer2, color: 'blue' },
          { label: 'TAXA DE CONVERSÃO', value: `${stats?.taxaConversao?.toFixed(1) || '0.0'}%`, sub: `${stats?.totalConversoes || 0} vendas fechadas`, icon: Users, color: 'green' },
          { label: 'ROAS ESTIMADO', value: `${stats?.roas?.toFixed(1) || '0.0'}x`, sub: 'Abaixo do ideal', icon: Award, color: 'red' },
        ].map((item) => (
          <div key={item.label} className="bg-[#171717] p-6 rounded-2xl border border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{item.label}</p>
              <item.icon size={16} className={`text-${item.color}-500/50`} />
            </div>
            <p className={`text-xl font-bold ${item.label === 'ROAS ESTIMADO' ? 'text-red-500' : 'text-white'}`}>{item.value}</p>
            <p className="text-[10px] text-gray-600 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Campaigns Section */}
      <div className="bg-[#171717] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-white">Campanhas Cadastradas</h3>
          <span className="text-[10px] text-gray-500 font-bold uppercase">{ads.length} campanha(s)</span>
        </div>
        
        {loading ? (
           <div className="p-20 flex justify-center"><RefreshCw className="animate-spin text-orange-500" /></div>
        ) : ads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/40 border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-500">
                <tr>
                  <th className="p-4 font-bold">Campanha</th>
                  <th className="p-4 font-bold">Plataforma</th>
                  <th className="p-4 font-bold">Investimento</th>
                  <th className="p-4 font-bold">Cliques</th>
                  <th className="p-4 font-bold">Leads</th>
                  <th className="p-4 font-bold">CPL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-800/20 transition-all">
                    <td className="p-4 font-medium text-white">{ad.campanha}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${ad.plataforma === 'Meta' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'}`}>
                        {ad.plataforma}
                      </span>
                    </td>
                    <td className="p-4 text-orange-500 font-bold">R$ {ad.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-white">{ad.cliques.toLocaleString()}</td>
                    <td className="p-4 text-white font-bold">{ad.leads_gerados}</td>
                    <td className="p-4 text-gray-400">R$ {(ad.leads_gerados > 0 ? ad.investimento / ad.leads_gerados : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <EyeOff size={32} />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Nenhuma campanha cadastrada ainda.</p>
            <p className="text-xs text-gray-600">Clique em "Sincronizar" no Meta Ads para puxar seus dados reais.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdsROI;
