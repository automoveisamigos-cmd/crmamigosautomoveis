import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Plus, MoreHorizontal, User, Car, Clock, AlertCircle, Search, X, Edit3, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getLeads, updateLeadStatus, updateLead, getVendedores } from '../api';

const Kanban: React.FC = () => {
  const [columns, setColumns] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', whatsapp: '', veiculo_interesse: '', vendedor_id: '' });

  const fetchData = async () => {
    try {
      const [lRes, vRes] = await Promise.all([getLeads(), getVendedores()]);
      const allLeads = lRes.data;
      setVendedores(vRes.data);
      
      const stages = [
        { id: 'Novo Lead', title: 'NOVO LEAD' },
        { id: 'Em Atendimento', title: 'EM ATENDIMENTO' },
        { id: 'Qualificado', title: 'QUALIFICADO' },
        { id: 'Interesse', title: 'INTERESSE' },
        { id: 'Negociacao', title: 'NEGOCIAÇÃO' },
        { id: 'Fechado', title: 'FECHADO' },
        { id: 'Perdido', title: 'PERDIDO' },
      ];

      const formattedCols = stages.map(stage => ({
        ...stage,
        leads: allLeads.filter((l: any) => l.status === stage.id)
      }));

      setColumns(formattedCols);
    } catch (error) {
      console.error("Erro ao buscar dados", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColIndex = columns.findIndex(c => c.id === source.droppableId);
      const destColIndex = columns.findIndex(c => c.id === destination.droppableId);
      const sourceCol = columns[sourceColIndex];
      const destCol = columns[destColIndex];

      const sourceLeads = [...sourceCol.leads];
      const destLeads = [...destCol.leads];
      const [removed] = sourceLeads.splice(source.index, 1);
      
      try {
        await updateLeadStatus(parseInt(draggableId), destination.droppableId);
        removed.status = destination.droppableId;
        destLeads.splice(destination.index, 0, removed);
        const newCols = [...columns];
        newCols[sourceColIndex] = { ...sourceCol, leads: sourceLeads };
        newCols[destColIndex] = { ...destCol, leads: destLeads };
        setColumns(newCols);
      } catch (error) {
        alert("Erro ao mover lead");
        fetchData();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const api = (await import('../api')).default;
      if (editingLead) {
        await updateLead(editingLead.id, form);
      } else {
        await api.post('/leads/upsert', form);
      }
      setShowModal(false);
      setEditingLead(null);
      fetchData();
    } catch (error) {
      alert("Erro ao salvar lead");
    }
  };

  const handleEdit = (lead: any) => {
    setEditingLead(lead);
    setForm({
      nome: lead.nome,
      whatsapp: lead.whatsapp,
      veiculo_interesse: lead.veiculo_interesse || '',
      vendedor_id: lead.vendedor_id?.toString() || ''
    });
    setShowModal(true);
  };

  return (
    <Layout activeTab="kanban">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Funil de Vendas</h1>
          <p className="text-gray-400">Gerencie seus leads e negociações em tempo real</p>
        </div>
        <button 
          onClick={() => { setEditingLead(null); setForm({nome:'', whatsapp:'', veiculo_interesse:'', vendedor_id:''}); setShowModal(true); }}
          className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus size={20} />
          Novo Lead
        </button>
      </div>

      <div className="overflow-x-auto pb-6 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div></div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 min-w-max">
              {columns.map((column) => (
                <Droppable droppableId={column.id} key={column.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="w-80 bg-black/20 rounded-3xl p-5 border border-gray-800/50 flex flex-col min-h-[65vh]"
                    >
                      <div className="flex justify-between items-center mb-8 px-2">
                        <h3 className="text-[10px] font-black text-gray-500 tracking-widest uppercase">{column.title}</h3>
                        <span className="w-6 h-6 bg-orange-500/10 rounded-full flex items-center justify-center text-[10px] font-bold text-orange-500">
                          {column.leads.length}
                        </span>
                      </div>

                      <div className="space-y-4 flex-1">
                        {column.leads.map((lead: any, index: number) => (
                          <Draggable key={lead.id.toString()} draggableId={lead.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-[#171717] p-6 rounded-2xl border transition-all group ${
                                  snapshot.isDragging ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-gray-800 hover:border-gray-700'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-5">
                                  <h4 className="font-bold text-white text-sm group-hover:text-orange-500 transition-all">{lead.nome}</h4>
                                  <button onClick={() => handleEdit(lead)} className="text-gray-600 hover:text-white transition-all"><Edit3 size={14} /></button>
                                </div>

                                <div className="space-y-4 mb-6">
                                  <div className="flex items-center justify-between bg-black/40 px-4 py-2.5 rounded-xl border border-gray-800/50">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                      <User size={12} className="text-gray-500" />
                                      {lead.vendedor?.nome || 'Sem Vendedor'}
                                    </div>
                                    {lead.utm_source && (
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                        lead.utm_source.toLowerCase().includes('meta') ? 'bg-blue-500/20 text-blue-500' : 
                                        lead.utm_source.toLowerCase().includes('google') ? 'bg-red-500/20 text-red-500' : 
                                        'bg-purple-500/20 text-purple-500'
                                      }`}>
                                        {lead.utm_source}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 px-1 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                                    <Car size={14} className="text-orange-500" />
                                    {lead.veiculo_interesse || 'Geral'}
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-5 border-t border-gray-800/50 text-gray-500 text-[10px] font-bold">
                                  <div className="flex items-center gap-2"><Clock size={12} /> {new Date(lead.criado_em).toLocaleDateString('pt-BR')}</div>
                                  {lead.score > 70 && <div className="text-red-500 animate-pulse">QUENTE</div>}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Modal Adicionar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#171717] w-full max-w-md rounded-3xl border border-gray-800 p-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold text-white">{editingLead ? 'Editar Lead' : 'Novo Lead'}</h2>
               <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nome</label>
                <input required type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">WhatsApp</label>
                <input required type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Vendedor</label>
                <select className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white outline-none focus:border-orange-500" value={form.vendedor_id} onChange={e => setForm({...form, vendedor_id: e.target.value})}>
                  <option value="">Selecione...</option>
                  {vendedores.map(v => <option key={v.id} value={v.id.toString()}>{v.nome}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-4">
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

export default Kanban;