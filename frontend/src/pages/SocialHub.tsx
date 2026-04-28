import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Plus, Instagram, Youtube, Music2, Radio, Share2, 
  TrendingUp, BarChart3, Users, Play, FileText, Globe, 
  Zap, Clock, ChevronRight, MessageCircle, Heart, Eye,
  ExternalLink, Bookmark, Send, Award, RefreshCw, Edit3, X,
  ArrowUpRight, ArrowDownRight, Video, Target, Info
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, AreaChart, Area } from 'recharts';
import { getSocialStats, getSocialPosts, syncSocialAll, getSocialSyncStatus } from '../api';

const SocialHub: React.FC = () => {
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Instagram');
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [form, setForm] = useState({ titulo: '', visualizacoes: 0, likes: 0, plataforma: 'Instagram' });

  const fetchData = async () => {
    try {
      const [sRes, pRes, syncRes] = await Promise.all([
        getSocialStats(),
        getSocialPosts(),
        getSocialSyncStatus()
      ]);
      setStats(sRes.data);
      setPosts(pRes.data);
      setSyncStatus(syncRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados sociais", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const api = (await import('../api')).default;
      if (editingPost) {
        await api.patch(`/social/posts/${editingPost.id}`, form);
      } else {
        await api.post('/social/posts', form);
      }
      setShowModal(false);
      setEditingPost(null);
      fetchData();
    } catch (error) {
      alert("Erro ao salvar post");
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setForm({ titulo: post.titulo, visualizacoes: post.visualizacoes, likes: post.likes, plataforma: post.plataforma });
    setShowModal(true);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await syncSocialAll();
      await fetchData();
    } catch (error) {
      alert("Erro na sincronização");
    } finally {
      setSyncing(false);
    }
  };

  const handlePlatformClick = (id: string) => {
    setSelectedPlatform(id);
    setViewMode('detail');
  };

  if (loading) {
    return <Layout activeTab="social"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div></div></Layout>;
  }

  const chartData = [
    { name: 'Instagram', value: stats?.find((s:any) => s.plataforma === 'Instagram')?.visualizacoes || 31542, color: '#e1306c' },
    { name: 'YouTube', value: stats?.find((s:any) => s.plataforma === 'YouTube')?.visualizacoes || 12000, color: '#ff0000' },
    { name: 'TikTok', value: stats?.find((s:any) => s.plataforma === 'TikTok')?.visualizacoes || 45000, color: '#00f2ea' },
    { name: 'Kwai', value: stats?.find((s:any) => s.plataforma === 'Kwai')?.visualizacoes || 0, color: '#ff8000' },
    { name: 'Facebook', value: stats?.find((s:any) => s.plataforma === 'Facebook')?.visualizacoes || 0, color: '#1877f2' },
  ];

  const platforms = [
    { id: 'Instagram', platform: 'Instagram', icon: Instagram, followers: '13.545', growth: '+2300', color: '#e1306c', views: '31.542', videos: '3' },
    { id: 'YouTube', platform: 'YouTube', icon: Youtube, followers: '13.144', growth: '-621', color: '#ff0000', views: '0', videos: '0' },
    { id: 'TikTok', platform: 'TikTok', icon: Music2, followers: '16.433', growth: '+3886', color: '#00f2ea', views: '45.000', videos: '1' },
    { id: 'Kwai', platform: 'Kwai', icon: Play, followers: '0', growth: '0', color: '#ff8000', views: '0', videos: '0' },
    { id: 'Facebook', platform: 'Facebook', icon: Share2, followers: '0', growth: '0', color: '#1877f2', views: '0', videos: '0' },
  ];

  const filteredPosts = posts.filter(p => p.plataforma.toLowerCase() === selectedPlatform.toLowerCase());
  const featuredPost = filteredPosts[0] || {
    titulo: 'Review Civic 2014 LXR',
    visualizacoes: 15400,
    likes: 1200,
    alcance: 18000,
    engajamento: '7.79%'
  };

  const performanceData = [
    { name: '20/04', val: 15400 },
    { name: '21/04', val: 12000 },
    { name: '21/04', val: 4142 },
  ];

  if (viewMode === 'detail') {
    return (
      <Layout activeTab="social">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-orange-500" size={24} />
              <h1 className="text-3xl font-bold text-white">
                Social Hub <span className="text-gray-600">/</span> <span className="text-orange-500">{selectedPlatform}</span>
              </h1>
            </div>
            <p className="text-gray-400">Análise detalhada de performance no {selectedPlatform}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setViewMode('summary')}
              className="bg-[#171717] hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl border border-gray-800 transition-all text-sm"
            >
              Voltar ao Resumo
            </button>
            <button onClick={() => setShowModal(true)} className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all text-sm shadow-lg shadow-orange-500/20">
              <Plus size={20} /> Registrar Post
            </button>
          </div>
        </div>

        {/* Featured Card */}
        <div className="bg-[#171717] p-8 rounded-3xl border border-gray-800 mb-8 flex gap-10 items-center relative overflow-hidden">
          <div className="w-80 h-96 bg-gray-900 rounded-3xl flex items-center justify-center relative overflow-hidden group shadow-2xl">
            <img src={featuredPost.thumbnail || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=400'} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
            <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-all cursor-pointer relative z-10">
              <Play size={28} fill="white" className="ml-1" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-orange-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-tighter">
                <Award size={14} /> Conteúdo em destaque
              </span>
            </div>
            <h2 className="text-5xl font-black text-white mb-10 tracking-tight">{featuredPost.titulo}</h2>
            
            <div className="grid grid-cols-4 gap-4 mb-10">
              {[
                { label: 'VISUALIZAÇÕES', value: (featuredPost.visualizacoes || 15400).toLocaleString('pt-BR') },
                { label: 'ENGAJAMENTO', value: '7.79%' },
                { label: 'WATCH TIME', value: '0.0h' },
                { label: 'RETENÇÃO', value: '0%' },
              ].map(stat => (
                <div key={stat.label} className="bg-black/40 p-6 rounded-2xl border border-gray-800/50">
                  <p className="text-[10px] text-gray-500 font-black mb-3 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <button className="bg-white text-black font-black py-4 px-10 rounded-xl flex items-center gap-3 hover:bg-gray-200 transition-all border-none text-sm uppercase">
              Ver Conteúdo Original <ExternalLink size={20} />
            </button>
          </div>
        </div>

        {/* Second Row Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {[
            { label: 'SEGUIDORES', value: '13.545', sub: '+2300 nos últimos 7d', icon: Users, color: 'cyan' },
            { label: 'ALCANCE', value: '36.142', sub: '', icon: TrendingUp, color: 'orange' },
            { label: 'SALVAMENTOS', value: '655', sub: '', icon: Bookmark, color: 'orange' },
            { label: 'COMPARTILHAMENTOS', value: '508', sub: '', icon: Send, color: 'orange' },
          ].map(s => (
            <div key={s.label} className="bg-[#171717] p-8 rounded-3xl border border-gray-800 flex flex-col items-center text-center group hover:border-orange-500/30 transition-all">
              <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-black transition-all">
                <s.icon size={24} />
              </div>
              <p className="text-3xl font-black text-white mb-2">{s.value}</p>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">{s.label}</p>
              {s.sub && <p className="text-[10px] font-bold text-green-500 uppercase">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Charts and Ranking */}
        <div className="grid grid-cols-3 gap-8 mb-10">
           <div className="col-span-2 bg-[#171717] p-10 rounded-3xl border border-gray-800">
              <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-xl font-bold text-white">Performance de Visualizações</h3>
                   <p className="text-xs text-gray-500 mt-1">Histórico de alcance dos últimos conteúdos</p>
                </div>
                <div className="bg-gray-800 px-4 py-1.5 rounded-full flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                   <span className="text-[10px] font-bold text-gray-400 uppercase">Views</span>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                    <Tooltip cursor={{fill: '#1f2937'}} contentStyle={{backgroundColor: '#171717', border: '1px solid #374151'}} />
                    <Bar dataKey="val" radius={[8, 8, 0, 0]}>
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#e1306c' : index === 1 ? '#e1306c' : '#e1306c'} fillOpacity={index === 2 ? 0.3 : 0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-[#171717] p-10 rounded-3xl border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-2">Ranking de Performance</h3>
              <p className="text-xs text-gray-500 mb-10">Top vídeos com mais impacto</p>
              
              <div className="space-y-6">
                {[
                  { id: 1, title: 'Review Civic 2014 LXR', views: '15.4k', reach: '18.0k', actions: '450', date: '20/04' },
                  { id: 2, title: 'Destaque da Semana: Corolla', views: '12.0k', reach: '14.0k', actions: '200', date: '21/04' },
                  { id: 3, title: 'Stilo', views: '4.1k', reach: '4.1k', actions: '5', date: '21/04' },
                ].map((item, idx) => (
                  <div key={item.id} className="bg-black/30 p-6 rounded-2xl border border-gray-800 relative group overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1"># {idx + 1} TOP CONTENT</p>
                        <h4 className="text-sm font-bold text-white group-hover:text-orange-500 transition-all">{item.title}</h4>
                      </div>
                      <span className="text-[10px] text-gray-600 font-bold">{item.date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 relative z-10">
                      <div>
                        <p className="text-[10px] font-bold text-white">{item.views}</p>
                        <p className="text-[8px] text-gray-600 uppercase font-black">Views</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white">{item.reach}</p>
                        <p className="text-[8px] text-gray-600 uppercase font-black">Alcance</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white">{item.actions}</p>
                        <p className="text-[8px] text-gray-600 uppercase font-black">Ações</p>
                      </div>
                    </div>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* History Table */}
        <div className="bg-[#171717] rounded-3xl border border-gray-800 overflow-hidden">
           <div className="p-6 border-b border-gray-800 bg-[#1c1c1c] uppercase text-[10px] font-black text-gray-500 tracking-widest">
              Histórico de Postagens - {selectedPlatform}
           </div>
           <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] text-gray-500 font-black uppercase tracking-widest bg-black/10">
                   <th className="px-8 py-5">Vídeo / Conteúdo</th>
                   <th className="px-8 py-5">Data</th>
                   <th className="px-8 py-5">Visualizações</th>
                   <th className="px-8 py-5">Likes</th>
                   <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {[
                  { id: 1, title: 'stilo', date: '21/04/2026', views: '4.142', likes: '63' },
                  { id: 2, title: 'Destaque da Semana: Corolla', date: '21/04/2026', views: '12.000', likes: '850' },
                  { id: 3, title: 'Review Civic 2014 LXR', date: '20/04/2026', views: '15.400', likes: '1.200' },
                ].map(post => (
                  <tr key={post.id} className="hover:bg-white/5 transition-all group">
                    <td className="px-8 py-6 flex items-center gap-4">
                       <div className="p-3 bg-gray-900 rounded-xl text-gray-600 group-hover:bg-orange-500 group-hover:text-black transition-all">
                          <Play size={14} fill="currentColor" />
                       </div>
                       <span className="text-sm font-bold text-gray-400 group-hover:text-white">{post.title}</span>
                    </td>
                    <td className="px-8 py-6 text-sm font-medium text-gray-600">{post.date}</td>
                    <td className="px-8 py-6 text-sm font-black text-white">{post.views}</td>
                    <td className="px-8 py-6 text-sm font-bold text-gray-600">{post.likes}</td>
                    <td className="px-8 py-6 text-right">
                       <button className="text-gray-600 hover:text-white transition-all"><ExternalLink size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </Layout>
    );
  }

  // SUMMARY VIEW
  return (
    <Layout activeTab="social">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <TrendingUp className="text-orange-500" size={24} />
             <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Social Hub</h1>
          </div>
          <p className="text-gray-500 text-sm">Resumo geral do seu alcance digital.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleSyncAll}
            disabled={syncing}
            className="bg-[#171717] hover:bg-gray-800 text-white font-bold py-3.5 px-8 rounded-xl flex items-center gap-3 border border-gray-800 transition-all text-sm"
          >
            {syncing ? <RefreshCw className="animate-spin" size={18} /> : <Radio size={18} />} Sync Tudo
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-black font-black py-3.5 px-8 rounded-xl flex items-center gap-3 transition-all text-sm shadow-lg shadow-orange-500/20">
            <Plus size={20} strokeWidth={3} /> Registrar Post
          </button>
        </div>
      </div>

      {/* Sync Banner */}
      <div className="bg-[#171717] p-8 rounded-3xl border border-gray-800 mb-10 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
           <Zap size={18} className="text-orange-500" fill="currentColor" />
           <h3 className="font-black text-xs text-white uppercase tracking-widest">Sincronização Automática de Posts</h3>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {['Instagram', 'YouTube', 'TikTok', 'Kwai'].map(p => {
             const status = syncStatus?.find(s => s.plataforma === p);
             return (
               <div key={p} className="bg-black/40 p-5 rounded-2xl border border-gray-800/50 flex items-center justify-between group cursor-help">
                  <div className="flex items-center gap-3">
                     <Info size={14} className="text-gray-600 group-hover:text-orange-500 transition-all" />
                     <span className="text-xs font-bold text-gray-400 uppercase">{p}</span>
                  </div>
                  {status?.status === 'Sync' ? (
                    <span className="flex items-center gap-2 text-[9px] font-black text-red-500 uppercase tracking-widest">
                       <RefreshCw size={10} className="animate-spin" /> Sync
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">Sem API</span>
                  )}
               </div>
             );
          })}
        </div>
        <p className="mt-6 text-[9px] text-gray-700 font-bold uppercase tracking-widest">
           Configure as variáveis de ambiente no backend: META_ACCESS_TOKEN, META_IG_USER_ID, YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID, TIKTOK_ACCESS_TOKEN
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6 mb-10">
        {platforms.map((item) => (
          <button 
            key={item.id} 
            onClick={() => handlePlatformClick(item.id)}
            className="bg-[#171717] p-8 rounded-3xl border border-gray-800 hover:border-orange-500/30 transition-all text-left relative group overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-white group-hover:opacity-[0.1] transition-all"><item.icon size={120} /></div>
            <div className={`p-3 bg-white/5 rounded-2xl text-gray-500 group-hover:bg-orange-500 group-hover:text-black transition-all inline-block mb-8`}>
               <item.icon size={22} />
            </div>
            <h4 className="text-sm font-black text-white mb-1 uppercase tracking-tight">{item.platform}</h4>
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-6">Últimos 7 dias</p>
            
            <div className="flex items-end gap-3 mb-1">
               <p className="text-2xl font-black text-white">{item.followers}</p>
               <span className={`text-[10px] font-black mb-1 ${item.growth.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{item.growth}</span>
            </div>
            <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest mb-8">Seguidores Totais</p>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-800/50">
               <div>
                  <p className="text-sm font-black text-white">{item.views}</p>
                  <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Views</p>
               </div>
               <div>
                  <p className="text-sm font-black text-white">{item.videos}</p>
                  <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Vídeos</p>
               </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8 items-start">
         <div className="col-span-2 bg-[#171717] p-10 rounded-3xl border border-gray-800">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-10">Alcance Global</h3>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                    <Tooltip cursor={{fill: '#1f2937'}} contentStyle={{backgroundColor: '#171717', border: '1px solid #374151'}} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={index > 2 ? 0.2 : 0.8} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-[#171717] p-10 rounded-3xl border border-gray-800 flex flex-col items-center justify-center text-center">
            <div className="p-5 bg-orange-500/10 rounded-3xl text-orange-500 mb-8">
               <BarChart3 size={40} />
            </div>
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">Total de Visualizações</p>
            <p className="text-6xl font-black text-white mb-10 tracking-tighter">85.042</p>
            
            <div className="grid grid-cols-2 gap-10 w-full pt-10 border-t border-gray-800/50">
               <div>
                  <p className="text-2xl font-black text-white">5</p>
                  <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Posts</p>
               </div>
               <div>
                  <p className="text-2xl font-black text-white">5</p>
                  <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Canais</p>
               </div>
            </div>
         </div>
      </div>

      <div className="mt-10 flex justify-center">
         <button className="bg-[#171717] hover:bg-gray-800 text-gray-400 font-bold py-4 px-10 rounded-2xl flex items-center gap-3 border border-gray-800 transition-all text-xs uppercase tracking-widest">
            <TrendingUp size={16} /> Atualizar Contador de Seguidores das Redes
         </button>
      </div>

      {/* Modal - Same logic as before */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#171717] w-full max-w-md rounded-3xl border border-gray-800 p-10">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold text-white">Registrar Post</h2>
               <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
               <input type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" placeholder="Título" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
               <select className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.plataforma} onChange={e => setForm({...form, plataforma: e.target.value})}>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
               </select>
               <input type="number" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" placeholder="Visualizações" value={form.visualizacoes} onChange={e => setForm({...form, visualizacoes: parseInt(e.target.value)})} />
               <button type="submit" className="w-full bg-orange-500 text-black font-black py-4 rounded-xl shadow-lg shadow-orange-500/20">Salvar Post</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SocialHub;
