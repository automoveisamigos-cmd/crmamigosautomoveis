import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  CalendarCheck, 
  Share2, 
  TrendingUp, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'kanban', label: 'CRM (Kanban)', icon: Users, path: '/kanban' },
    { id: 'estoque', label: 'Estoque', icon: Car, path: '/veiculos' },
    { id: 'atividades', label: 'Atividades', icon: CalendarCheck, path: '/atividades' },
    { id: 'social', label: 'Redes Sociais', icon: Share2, path: '/social' },
    { id: 'ads', label: 'Ads / ROI', icon: TrendingUp, path: '/ads' },
    { id: 'equipe', label: 'Equipe', icon: User, path: '/equipe' },
  ];

  return (
    <div className="w-64 min-h-screen bg-[#0f0f0f] border-r border-gray-800 flex flex-col p-4 fixed left-0 top-0">
      <div className="flex items-center gap-3 mb-10 px-2 pt-2">
        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-black">AA</div>
        <h1 className="text-white font-bold text-lg">Amigos Auto</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id 
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-4 space-y-1 border-t border-gray-800">
        <Link to="/config" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all">
          <Settings size={20} />
          <span className="font-medium">Configurações</span>
        </Link>
        <button 
          onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
