import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { Plus, Search, Filter, MoreVertical, Trash2, Edit3, X, Car, TrendingUp, Camera, Check, Bike } from 'lucide-react';
import { getVeiculos, getStockStats, createVeiculo, deleteVeiculo, updateVeiculo } from '../api';
import api from '../api';

const Veiculos: React.FC = () => {
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'Todos' | 'Carro' | 'Moto'>('Todos');
  const [activeStatus, setActiveStatus] = useState<'Estoque' | 'Vendido'>('Estoque');
  const [draggedPhotoIdx, setDraggedPhotoIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    categoria: 'Carro',
    marca: '', 
    modelo: '', 
    ano: new Date().getFullYear(), 
    tipo_estoque: 'Proprio',
    preco: 0, 
    fipe: 0, 
    placa: '', 
    km: 0,
    cor: '',
    status: 'Disponivel',
    cilindrada: '',
    proprietario: '',
    fotos: [] as string[],
    integra_webmotors: false,
    integra_mobiauto: false,
    integra_napista: false,
    webmotors_id: '',
    mobiauto_id: '',
    napista_id: ''
  });

  const fetchData = async () => {
    try {
      const [vRes, sRes] = await Promise.all([getVeiculos(), getStockStats()]);
      setVeiculos(vRes.data);
      setStats(sRes.data);
    } catch (error) {
      console.error("Erro ao buscar estoque", error);
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
      const payload = {
        ...form,
        fotos: JSON.stringify(form.fotos)
      };

      if (editingCar) {
        await updateVeiculo(editingCar.id, payload);
      } else {
        await createVeiculo(payload);
      }
      setShowModal(false);
      setEditingCar(null);
      resetForm();
      fetchData();
    } catch (error) {
      alert("Erro ao salvar veículo");
    }
  };

  const resetForm = () => {
    setForm({
      categoria: 'Carro', marca: '', modelo: '', ano: new Date().getFullYear(), tipo_estoque: 'Proprio',
      preco: 0, fipe: 0, placa: '', km: 0, cor: '', status: 'Disponivel', cilindrada: '', proprietario: '', fotos: [],
      integra_webmotors: false, integra_mobiauto: false, integra_napista: false, webmotors_id: '', mobiauto_id: '', napista_id: ''
    });
  };

  const handleEdit = (v: any) => {
    setEditingCar(v);
    setForm({
      categoria: v.categoria || 'Carro',
      marca: v.marca,
      modelo: v.modelo,
      ano: v.ano,
      tipo_estoque: v.tipo_estoque || 'Proprio',
      preco: v.preco,
      fipe: v.fipe,
      placa: v.placa,
      km: v.km,
      cor: v.cor || '',
      status: v.status,
      cilindrada: v.cilindrada || '',
      proprietario: v.proprietario || '',
      fotos: v.fotos ? JSON.parse(v.fotos) : [],
      integra_webmotors: !!v.integra_webmotors,
      integra_mobiauto: !!v.integra_mobiauto,
      integra_napista: !!v.integra_napista,
      webmotors_id: v.webmotors_id || '',
      mobiauto_id: v.mobiauto_id || '',
      napista_id: v.napista_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Excluir este veículo?")) {
      try {
        await deleteVeiculo(id);
        fetchData();
      } catch (error) {
        alert("Erro ao excluir");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('fotos', files[i]);
    }

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, fotos: [...prev.fotos, ...response.data.urls] }));
    } catch (error) {
      alert("Erro no upload das fotos");
    } finally {
      setUploading(false);
    }
  };

  const handleDragStart = (idx: number) => {
    setDraggedPhotoIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault(); // Allow dropping
  };

  const handleDrop = (idx: number) => {
    if (draggedPhotoIdx === null || draggedPhotoIdx === idx) return;

    setForm(prev => {
      const newFotos = [...prev.fotos];
      const draggedFoto = newFotos[draggedPhotoIdx];
      newFotos.splice(draggedPhotoIdx, 1);
      newFotos.splice(idx, 0, draggedFoto);
      return { ...prev, fotos: newFotos };
    });
    setDraggedPhotoIdx(null);
  };

  return (
    <Layout activeTab="estoque">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Estoque</h1>
          <p className="text-gray-400">Controle total dos seus veículos e tempo de pátio</p>
        </div>
        <button 
          onClick={() => { setEditingCar(null); resetForm(); setShowModal(true); }}
          className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus size={20} />
          Adicionar Veículo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Capital Imobilizado', value: `R$ ${(stats?.capital || 0).toLocaleString('pt-BR')}`, sub: `${veiculos.length} VEÍCULOS`, color: 'orange' },
          { label: 'Giro Médio (Pátio)', value: `${stats?.giroMedio || 0} dias`, sub: 'Giro Saudável', color: 'green' },
          { label: 'Disponibilidade', value: `${stats?.disponibilidade || 0}%`, sub: 'Pronto p/ venda', color: 'purple' },
          { label: 'Potencial de Margem', value: `R$ ${(stats?.margemTotal || 0).toLocaleString('pt-BR')}`, sub: 'vs Tabela FIPE', color: 'green' },
        ].map((s) => (
          <div key={s.label} className="bg-[#171717] p-6 rounded-2xl border border-gray-800">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">{s.label}</p>
            <p className={`text-2xl font-bold ${s.label.includes('Margem') ? 'text-green-500' : 'text-white'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
           <button onClick={() => setActiveCategory('Todos')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeCategory === 'Todos' ? 'bg-orange-500 text-black' : 'bg-[#171717] text-white hover:bg-gray-800 border border-gray-800'}`}>Todos</button>
           <button onClick={() => setActiveCategory('Carro')} className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${activeCategory === 'Carro' ? 'bg-orange-500 text-black' : 'bg-[#171717] text-white hover:bg-gray-800 border border-gray-800'}`}><Car size={16}/> Carros</button>
           <button onClick={() => setActiveCategory('Moto')} className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${activeCategory === 'Moto' ? 'bg-orange-500 text-black' : 'bg-[#171717] text-white hover:bg-gray-800 border border-gray-800'}`}><Bike size={16}/> Motos</button>
        </div>
        
        <div className="bg-[#171717] p-1 rounded-xl border border-gray-800 flex gap-1">
           <button 
             onClick={() => setActiveStatus('Estoque')} 
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeStatus === 'Estoque' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
           >
             EM ESTOQUE
           </button>
           <button 
             onClick={() => setActiveStatus('Vendido')} 
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeStatus === 'Vendido' ? 'bg-green-500/20 text-green-500' : 'text-gray-500 hover:text-white'}`}
           >
             VENDIDOS
           </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500"></div></div>
        ) : veiculos
            .filter(v => activeStatus === 'Estoque' ? v.status !== 'Vendido' : v.status === 'Vendido')
            .filter(v => activeCategory === 'Todos' || (activeCategory === 'Carro' && v.categoria !== 'Moto') || v.categoria === activeCategory)
            .map((v) => (
          <div key={v.id} className="bg-[#171717] rounded-2xl border border-gray-800 overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="relative h-48 overflow-hidden bg-gray-900">
              <img 
                src={v.fotos && JSON.parse(v.fotos).length > 0 
                  ? (JSON.parse(v.fotos)[0].startsWith('http') ? JSON.parse(v.fotos)[0] : `http://${window.location.hostname}:3000${JSON.parse(v.fotos)[0]}`)
                  : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400'} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" 
                alt="" 
              />
              <div className="absolute top-4 right-4 flex gap-2">
                 <button onClick={() => handleEdit(v)} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-orange-500 transition-all"><Edit3 size={14} /></button>
                 <button onClick={() => handleDelete(v.id)} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-all"><Trash2 size={14} /></button>
              </div>
              <div className="absolute bottom-4 left-4">
                 <span className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${v.tipo_estoque === 'Proprio' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}`}>
                    {v.tipo_estoque === 'Proprio' ? 'Próprio' : 'Consignado'}
                 </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-1">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {v.categoria === 'Moto' ? <Bike size={18} className="text-orange-500"/> : <Car size={18} className="text-orange-500"/>}
                    {v.marca} {v.modelo}
                 </h3>
              </div>
              <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-2">{v.ano} • {v.cor || 'Cor não definida'}</p>
              
              <div className="flex gap-2 flex-wrap mb-4">
                 {v.cilindrada && <span className="bg-gray-800 px-2 py-1 rounded text-[10px] text-gray-300 font-bold">{v.cilindrada}</span>}
                 {v.proprietario && <span className="bg-gray-800 px-2 py-1 rounded text-[10px] text-gray-300 font-bold uppercase">Dono: {v.proprietario}</span>}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 p-3 rounded-xl border border-gray-800/50">
                   <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase">Placa</p>
                   <p className="text-sm font-bold text-white uppercase">{v.placa}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-gray-800/50">
                   <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase">KM</p>
                   <p className="text-sm font-bold text-white">{v.km?.toLocaleString()} KM</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-800/50 flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black text-white">R$ {v.preco.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-gray-600 mt-1">FIPE: R$ {v.fipe?.toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${v.status === 'Disponivel' ? 'text-green-500' : 'text-red-500'}`}>
                    {v.status}
                  </span>
                  <div className="flex gap-1">
                    {v.integra_webmotors && <span className="bg-red-500/20 text-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-500/30">WM</span>}
                    {v.integra_mobiauto && <span className="bg-blue-500/20 text-blue-500 text-[8px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">MA</span>}
                    {v.integra_napista && <span className="bg-green-500/20 text-green-500 text-[8px] font-bold px-1.5 py-0.5 rounded border border-green-500/30">NP</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Adicionar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-[#171717] w-full max-w-2xl rounded-3xl border border-gray-800 p-10 my-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold text-white">{editingCar ? 'Editar Veículo' : 'Cadastrar Veículo'}</h2>
               <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              {/* Fotos Section */}
              <div className="col-span-2">
                 <div className="flex justify-between items-end mb-4">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Fotos do Veículo</label>
                    <span className="text-[10px] text-gray-500">Arraste as fotos para reordenar. A primeira será a capa.</span>
                 </div>
                 <div className="grid grid-cols-5 gap-4">
                    {form.fotos.map((foto, idx) => (
                       <div 
                         key={idx} 
                         draggable
                         onDragStart={() => handleDragStart(idx)}
                         onDragOver={(e) => handleDragOver(e, idx)}
                         onDrop={() => handleDrop(idx)}
                         className={`relative aspect-square bg-black rounded-xl overflow-hidden border ${idx === 0 ? 'border-orange-500' : 'border-gray-800'} ${draggedPhotoIdx === idx ? 'opacity-50' : 'opacity-100'} cursor-grab active:cursor-grabbing hover:shadow-lg transition-all`}
                       >
                          {idx === 0 && <div className="absolute top-0 left-0 bg-orange-500 text-black text-[9px] font-bold px-2 py-1 rounded-br-xl z-10">CAPA</div>}
                          <img src={foto.startsWith('http') ? foto : `http://${window.location.hostname}:3000${foto}`} className="w-full h-full object-cover pointer-events-none" alt="" />
                          <button 
                            type="button"
                            onClick={() => setForm(prev => ({...prev, fotos: prev.fotos.filter((_, i) => i !== idx)}))}
                            className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white z-10 hover:bg-red-600 transition-all"
                          >
                             <X size={10} />
                          </button>
                       </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square bg-black/40 border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-orange-500 hover:border-orange-500/50 transition-all"
                    >
                       {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-orange-500"></div> : <><Camera size={24} className="mb-2" /><span className="text-[9px] font-bold">ADD FOTO</span></>}
                    </button>
                    <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                 </div>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Categoria</label>
                <select className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                  <option value="Carro">Carro</option>
                  <option value="Moto">Moto</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Marca</label>
                <input required type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} placeholder="Ex: Toyota" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Modelo</label>
                <input required type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value})} placeholder="Ex: Corolla" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Ano</label>
                <input required type="number" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.ano} onChange={e => setForm({...form, ano: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Tipo de Estoque</label>
                <select className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.tipo_estoque} onChange={e => setForm({...form, tipo_estoque: e.target.value})}>
                  <option value="Proprio">Próprio</option>
                  <option value="Consignado">Consignado</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Preço de Venda</label>
                <input required type="number" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.preco} onChange={e => setForm({...form, preco: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Preço da FIPE</label>
                <input type="number" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.fipe} onChange={e => setForm({...form, fipe: parseFloat(e.target.value)})} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Placa</label>
                <input required type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.placa} onChange={e => setForm({...form, placa: e.target.value.toUpperCase()})} placeholder="ABC1234" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Quilometragem (KM)</label>
                <input type="number" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.km} onChange={e => setForm({...form, km: parseInt(e.target.value)})} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Cilindrada / Motor</label>
                <input type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.cilindrada} onChange={e => setForm({...form, cilindrada: e.target.value})} placeholder="Ex: 160cc ou 1.0" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Nome do Proprietário (Consignado)</label>
                <input type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.proprietario} onChange={e => setForm({...form, proprietario: e.target.value})} placeholder="Ex: Yuri" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-widest border-b border-gray-800 pb-2">Integração com Portais</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'integra_webmotors', label: 'Webmotors', color: 'bg-red-500' },
                    { id: 'integra_mobiauto', label: 'Mobiauto', color: 'bg-blue-500' },
                    { id: 'integra_napista', label: 'Na Pista', color: 'bg-green-500' }
                  ].map(portal => (
                    <div key={portal.id} className="bg-black/30 p-4 rounded-xl border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white uppercase">{portal.label}</span>
                        <input 
                          type="checkbox" 
                          checked={(form as any)[portal.id]} 
                          onChange={e => setForm({...form, [portal.id]: e.target.checked})}
                          className="w-4 h-4 accent-orange-500"
                        />
                      </div>
                      <p className="text-[9px] text-gray-500">Status: {(form as any)[portal.id] ? 'Ativo' : 'Inativo'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 pt-6 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 text-white font-bold py-4 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 bg-orange-500 text-black font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20">Salvar Veículo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Veiculos;