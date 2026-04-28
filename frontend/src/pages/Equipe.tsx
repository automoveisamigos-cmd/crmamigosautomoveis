import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Plus, User, Trash2, Edit3, MessageCircle, X } from 'lucide-react';
import { getVendedores, createVendedor, deleteVendedor, updateVendedor } from '../api';

const Equipe: React.FC = () => {
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', email: '', role: 'Vendedor' });

  const fetchVendedores = async () => {
    try {
      const response = await getVendedores();
      setVendedores(response.data);
    } catch (error) {
      console.error("Erro ao buscar equipe", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendedor) {
        await updateVendedor(editingVendedor.id, form);
      } else {
        await createVendedor({ ...form, senha: '123' });
      }
      setShowModal(false);
      setEditingVendedor(null);
      setForm({ nome: '', email: '', role: 'Vendedor' });
      fetchVendedores();
    } catch (error) {
      alert("Erro ao salvar vendedor");
    }
  };

  const handleEdit = (v: any) => {
    setEditingVendedor(v);
    setForm({ nome: v.nome, email: v.email, role: v.role });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este vendedor?")) {
      try {
        await deleteVendedor(id);
        fetchVendedores();
      } catch (error) {
        alert("Erro ao excluir");
      }
    }
  };

  return (
    <Layout activeTab="equipe">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Colaboradores</h1>
          <p className="text-gray-400">Gerencie sua equipe e acompanhe a performance individual.</p>
        </div>
        <button 
          onClick={() => { setEditingVendedor(null); setShowModal(true); }}
          className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus size={20} />
          Adicionar Colaborador
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500"></div></div>
        ) : vendedores.map((v) => (
          <div key={v.id} className="bg-[#171717] rounded-3xl border border-gray-800 overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                  <User size={32} />
                </div>
                <button onClick={() => handleDelete(v.id)} className="text-gray-600 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{v.nome}</h3>
              <p className="text-xs text-orange-500 font-bold uppercase tracking-widest mb-6">{v.role}</p>
              
              <div className="pt-6 border-t border-gray-800/50">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Email</p>
                <p className="text-sm font-medium text-white truncate">{v.email}</p>
              </div>
            </div>
            
            <div className="bg-black/40 px-8 py-4 flex justify-between items-center group-hover:bg-orange-500/5 transition-all">
              <button onClick={() => handleEdit(v)} className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-2">
                <Edit3 size={12} /> Editar
              </button>
              <button className="text-[10px] font-bold text-orange-500 hover:text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <MessageCircle size={12} /> Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Adicionar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#171717] w-full max-w-md rounded-3xl border border-gray-800 p-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold text-white">{editingVendedor ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
               <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nome Completo</label>
                <input required type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white focus:border-orange-500 outline-none" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">E-mail</label>
                <input required type="email" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white focus:border-orange-500 outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Cargo / Role</label>
                <select className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white focus:border-orange-500 outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Documentação">Documentação</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 text-white font-bold py-4 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 bg-orange-500 text-black font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Equipe;
