import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { 
  TrendingUp, Users, DollarSign, AlertCircle, 
  Instagram, Youtube, Music2, ArrowUpRight, ArrowDownRight,
  Zap, MessageCircle, BarChart3, ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getDashboardStats } from '../api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error("Erro ao buscar stats do dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout activeTab="dashboard">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  // Handle data mapping from backend
  const dashboardStats = {
    roi: stats?.roiEstimado || 0,
    ticketMedio: 85000, // Placeholder while not in backend
    leadsTotais: stats?.totalLeads || 0,
    urgencia: stats?.leadsIA || 0,
    social: (stats?.socialGrowth || []).map((s: any) => ({
      name: s.plataforma,
      val: s.atual,
      growth: s.percentual.toFixed(1) + '%'
    })).slice(0, 3),
    chartData: [
      { name: 'Seg', manual: 10, ai: 25 },
      { name: 'Ter', manual: 15, ai: 30 },
      { name: 'Qua', manual: 12, ai: 45 },
      { name: 'Qui', manual: 20, ai: 50 },
      { name: 'Sex', manual: 18, ai: 65 },
      { name: 'Sáb', manual: 30, ai: 85 },
      { name: 'Dom', manual: 25, ai: 70 },
    ]
  };

  return (
    <Layout activeTab="dashboard">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Painel de Performance</h1>
        <p className="text-gray-400">Bem-vindo de volta! Aqui está o resumo das suas vendas hoje.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {[
          { label: 'ROI (Retorno/Invest.)', value: `R$ ${dashboardStats.roi.toLocaleString('pt-BR')}`, sub: '+12.4% vs ontem', icon: TrendingUp, color: 'orange' },
          { label: 'Ticket Médio (Vendas)', value: `R$ ${dashboardStats.ticketMedio.toLocaleString('pt-BR')}`, sub: 'Estável', icon: DollarSign, color: 'orange' },
          { label: 'Leads Totais (Mês)', value: dashboardStats.leadsTotais, sub: '+42 novos hoje', icon: Users, color: 'blue' },
          { label: 'Urgência de Venda', value: dashboardStats.urgencia, sub: 'Leads não respondidos', icon: AlertCircle, color: 'red' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#171717] p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 bg-${stat.color}-500/10 rounded-xl text-${stat.color}-500`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-bold ${stat.sub.includes('+') ? 'text-green-500' : stat.sub.includes('-') ? 'text-red-500' : 'text-gray-500'}`}>
                {stat.sub}
              </span>
            </div>
            <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="col-span-2 bg-[#171717] p-10 rounded-3xl border border-gray-800">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-bold text-white">Impacto da IA no Funil</h3>
              <p className="text-sm text-gray-500 mt-1">Comparativo de agendamentos com e sem Assistente Digital</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-400">Com IA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                <span className="text-xs text-gray-400">Manual</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardStats.chartData}>
                <defs>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} />
                <Tooltip contentStyle={{backgroundColor: '#171717', border: '1px solid #374151', borderRadius: '12px'}} />
                <Area type="monotone" dataKey="ai" stroke="#f97316" fillOpacity={1} fill="url(#colorAi)" strokeWidth={4} />
                <Area type="monotone" dataKey="manual" stroke="#374151" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Social Growth */}
        <div className="bg-[#171717] p-10 rounded-3xl border border-gray-800">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-bold text-white">Crescimento Social</h3>
            <span className="text-[10px] text-orange-500 font-bold uppercase border border-orange-500/20 px-2 py-1 rounded">Mês Atual</span>
          </div>

          <div className="space-y-8">
            {dashboardStats.social.length > 0 ? dashboardStats.social.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl group-hover:bg-orange-500 transition-all duration-500">
                    {item.name === 'Instagram' && <Instagram size={20} className="text-pink-500 group-hover:text-white" />}
                    {item.name === 'YouTube' && <Youtube size={20} className="text-red-500 group-hover:text-white" />}
                    {item.name === 'TikTok' && <Music2 size={20} className="text-cyan-500 group-hover:text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.val.toLocaleString('pt-BR')} seguidores</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-green-500 flex items-center gap-1 justify-end">
                    <ArrowUpRight size={14} /> {item.growth}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 opacity-30 italic text-sm">Sem dados de redes sociais</div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800/50">
            <button className="w-full bg-gray-800/50 hover:bg-gray-800 text-gray-300 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all">
              Ver relatório completo
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;