import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab }) => {
  return (
    <div className="flex bg-[#0a0a0a] min-h-screen text-white font-sans">
      <Sidebar activeTab={activeTab} />
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-gray-400 font-medium">CRM Workspace</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-white">CEO Amigos</p>
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Admin</p>
            </div>
            <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/30 rounded flex items-center justify-center font-bold text-orange-500">
              CE
            </div>
          </div>
        </header>
        
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
