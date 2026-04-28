import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { 
  Plus, CheckCircle2, Circle, Trash2, Calendar, 
  User, Search, Clock, Edit3, X, LayoutGrid, List,
  MoreVertical, ChevronRight, AlertCircle, Users
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  getTarefas, createTarefa, toggleTarefa, 
  deleteTarefa, getVendedores, updateTarefa 
} from '../api';

const Atividades: React.FC = () => {
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('kanban');
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({ 
    titulo: '', 
    descricao: '',
    vencimento: new Date().toISOString().split('T')[0],
    colaboradores_ids: [] as string[],
    status: 'Pendente'
  });

  const fetchData = async () => {
    try {
      const [tRes, vRes] = await Promise.all([getTarefas(), getVendedores()]);
      setTarefas(tRes.data);
      setVendedores(vRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      await toggleTarefa(id);
      fetchData();
    } catch (error) {
      alert("Erro ao atualizar tarefa");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Excluir tarefa?")) {
      try {
        await deleteTarefa(id);
        fetchData();
      } catch (error) {
        alert("Erro ao excluir");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...taskForm,
        colaboradores_ids: taskForm.colaboradores_ids.map(id => parseInt(id))
      };

      if (editingTask) {
        await updateTarefa(editingTask.id, payload);
      } else {
        await createTarefa(payload);
      }
      setShowModal(false);
      setEditingTask(null);
      setTaskForm({ 
        titulo: '', 
        descricao: '',
        vencimento: new Date().toISOString().split('T')[0], 
        colaboradores_ids: [],
        status: 'Pendente'
      });
      fetchData();
    } catch (error) {
      alert("Erro ao salvar tarefa");
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      titulo: task.titulo,
      descricao: task.descricao || '',
      vencimento: new Date(task.vencimento).toISOString().split('T')[0],
      colaboradores_ids: (task.colaboradores || []).map((c: any) => c.id.toString()),
      status: task.status || 'Pendente'
    });
    setShowModal(true);
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      const taskId = parseInt(draggableId);
      const newColId = destination.droppableId;

      let newStatus = newColId;
      let newVencimento = undefined;

      const task = tarefas.find(t => t.id === taskId);
      
      // Lógica especial para Entregar Hoje e Pendente
      if (newColId === 'Entregar Hoje') {
        newStatus = 'Pendente';
        newVencimento = new Date().toISOString().split('T')[0]; // Muda data para hoje
      } else if (newColId === 'Pendente') {
        newStatus = 'Pendente';
        // Se era para hoje e voltou para pendente, joga para amanhã para sair da coluna "Entregar Hoje"
        if (task && isToday(task.vencimento)) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          newVencimento = tomorrow.toISOString().split('T')[0];
        }
      }

      // Atualiza estado local para feedback imediato
      setTarefas(prev => prev.map(t => {
        if (t.id === taskId) {
          return { 
            ...t, 
            status: newStatus,
            vencimento: newVencimento ? new Date(newVencimento).toISOString() : t.vencimento
          };
        }
        return t;
      }));

      try {
        await updateTarefa(taskId, { 
          status: newStatus,
          ...(newVencimento ? { vencimento: newVencimento } : {})
        });
      } catch (error) {
        alert("Erro ao mover tarefa");
        fetchData();
      }
    }
  };

  const toggleColaborador = (id: string) => {
    setTaskForm(prev => {
      const ids = [...prev.colaboradores_ids];
      if (ids.includes(id)) {
        return { ...prev, colaboradores_ids: ids.filter(i => i !== id) };
      } else {
        return { ...prev, colaboradores_ids: [...ids, id] };
      }
    });
  };

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    const taskDate = dateString.split('T')[0];
    return taskDate === getLocalDateString();
  };

  const isExpired = (dateString: string) => {
    if (!dateString) return false;
    const taskDate = dateString.split('T')[0];
    return taskDate < getLocalDateString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const columns = [
    { id: 'Entregar Hoje', title: 'ENTREGAR HOJE', color: 'red' },
    { id: 'Pendente', title: 'PENDENTE', color: 'orange' },
    { id: 'Em Andamento', title: 'EM ANDAMENTO', color: 'blue' },
    { id: 'Concluido', title: 'CONCLUÍDO', color: 'green' },
  ];

  const getTasksForColumn = (colId: string) => {
    if (colId === 'Entregar Hoje') {
      return tarefas.filter(t => t.status === 'Pendente' && isToday(t.vencimento));
    }
    if (colId === 'Pendente') {
      return tarefas.filter(t => t.status === 'Pendente' && !isToday(t.vencimento));
    }
    return tarefas.filter(t => t.status === colId);
  };

  return (
    <Layout activeTab="atividades">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fluxo de Atividades</h1>
          <p className="text-gray-400">Gerencie tarefas em equipe e acompanhe o progresso.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#171717] p-1 rounded-xl border border-gray-800 flex gap-1">
            <button 
              onClick={() => setViewMode('lista')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'lista' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          <button 
            onClick={() => { setEditingTask(null); setTaskForm({ titulo: '', descricao: '', vencimento: new Date().toISOString().split('T')[0], colaboradores_ids: [], status: 'Pendente' }); setShowModal(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus size={20} />
            Nova Tarefa
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div></div>
      ) : viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-4 gap-6 h-[70vh]">
            {columns.map(col => (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-black/20 rounded-3xl p-6 border border-gray-800/50 flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-8 px-2">
                       <h3 className="text-[10px] font-black text-gray-500 tracking-widest uppercase">{col.title}</h3>
                       <span className={`w-6 h-6 bg-${col.color}-500/10 rounded-full flex items-center justify-center text-[10px] font-bold text-${col.color}-500`}>
                         {getTasksForColumn(col.id).length}
                       </span>
                    </div>

                    <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
                      {getTasksForColumn(col.id).map((t, index) => (
                        <Draggable key={t.id.toString()} draggableId={t.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-[#171717] p-5 rounded-2xl border transition-all group ${
                                snapshot.isDragging ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-gray-800 hover:border-gray-700'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-white text-sm group-hover:text-orange-500 transition-all">{t.titulo}</h4>
                                <div className="flex gap-1">
                                  <button onClick={() => handleEdit(t)} className="text-gray-600 hover:text-white"><Edit3 size={12} /></button>
                                  <button onClick={() => handleDelete(t.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={12} /></button>
                                </div>
                              </div>

                              {t.descricao && <p className="text-[11px] text-gray-500 mb-4 line-clamp-2">{t.descricao}</p>}

                              <div className="flex justify-between items-center pt-4 border-t border-gray-800/50">
                                <div className="flex -space-x-2">
                                  {t.colaboradores?.map((c: any) => (
                                    <div key={c.id} title={c.nome} className="w-6 h-6 rounded-full bg-gray-800 border-2 border-[#171717] flex items-center justify-center text-[8px] text-white font-bold uppercase">
                                      {c.nome.charAt(0)}
                                    </div>
                                  ))}
                                  {(!t.colaboradores || t.colaboradores.length === 0) && <div className="w-6 h-6 rounded-full bg-gray-900 border-2 border-[#171717] flex items-center justify-center text-gray-700"><User size={10} /></div>}
                                </div>
                                <span className={`text-[9px] font-bold flex items-center gap-1 ${isExpired(t.vencimento) && t.status !== 'Concluido' ? 'text-red-500' : 'text-gray-500'}`}>
                                  <Clock size={10} /> {formatDate(t.vencimento)}
                                </span>
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
      ) : (
        /* Lista View */
        <div className="space-y-6">
           <div className="bg-[#171717] rounded-3xl border border-gray-800 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] text-gray-500 font-black uppercase tracking-widest bg-black/10">
                    <th className="px-8 py-5">Tarefa</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Vencimento</th>
                    <th className="px-8 py-5">Equipe</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/30">
                  {tarefas.map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition-all group">
                      <td className="px-8 py-6">
                        <div>
                          <p className={`text-sm font-bold ${t.status === 'Concluido' ? 'text-gray-600 line-through' : 'text-white'}`}>{t.titulo}</p>
                          {t.lead && <p className="text-[10px] text-orange-500 font-bold mt-1 uppercase">Lead: {t.lead.nome}</p>}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                          t.status === 'Concluido' ? 'bg-green-500/10 text-green-500' :
                          t.status === 'Em Andamento' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-xs font-medium ${isExpired(t.vencimento) && t.status !== 'Concluido' ? 'text-red-500' : 'text-gray-500'}`}>
                          {formatDate(t.vencimento)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex -space-x-2">
                           {t.colaboradores?.map((c: any) => (
                             <div key={c.id} title={c.nome} className="w-7 h-7 rounded-full bg-gray-800 border-2 border-[#171717] flex items-center justify-center text-[10px] text-white font-bold">
                               {c.nome.charAt(0)}
                             </div>
                           ))}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(t)} className="p-2 text-gray-600 hover:text-white transition-all"><Edit3 size={16} /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-600 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Modal Nova/Editar Tarefa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-[#171717] w-full max-w-xl rounded-3xl border border-gray-800 p-10 my-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold text-white">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
               <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Título da Tarefa</label>
                <input required type="text" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white focus:border-orange-500 outline-none" placeholder="Ex: Ligar para João" value={taskForm.titulo} onChange={e => setTaskForm({...taskForm, titulo: e.target.value})} />
              </div>
              
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Descrição (Opcional)</label>
                <textarea rows={3} className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white focus:border-orange-500 outline-none resize-none" placeholder="Detalhes da tarefa..." value={taskForm.descricao} onChange={e => setTaskForm({...taskForm, descricao: e.target.value})} />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Equipe Responsável (Selecione um ou mais)</label>
                <div className="grid grid-cols-3 gap-3">
                  {vendedores.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleColaborador(v.id.toString())}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                        taskForm.colaboradores_ids.includes(v.id.toString()) 
                        ? 'bg-orange-500/10 border-orange-500 text-white' 
                        : 'bg-black/20 border-gray-800 text-gray-500 hover:border-gray-700'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${taskForm.colaboradores_ids.includes(v.id.toString()) ? 'bg-orange-500' : 'bg-gray-700'}`}></div>
                      <span className="text-xs font-bold truncate">{v.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Vencimento</label>
                <input required type="date" className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white focus:border-orange-500 outline-none" value={taskForm.vencimento} onChange={e => setTaskForm({...taskForm, vencimento: e.target.value})} />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status Inicial</label>
                <select className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 px-4 text-white focus:border-orange-500 outline-none" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluido">Concluído</option>
                </select>
              </div>

              <div className="col-span-2 flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 text-white font-bold py-4 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 bg-orange-500 text-black font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20">Salvar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Atividades;
