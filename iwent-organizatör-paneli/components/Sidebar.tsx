import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, BarChart3, Settings, LogOut, Hexagon, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Panel' },
    { to: '/events', icon: Calendar, label: 'Etkinlikler' },
    { to: '/analytics', icon: BarChart3, label: 'Analitik' },
    { to: '/moderation', icon: Shield, label: 'Moderasyon' },
    { to: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <aside 
      className={`bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col transition-all duration-300 z-50 ${
        isCollapsed ? 'w-20' : 'w-64'
      } hidden md:flex`}
    >
      <div className={`h-16 flex items-center border-b border-slate-50 relative ${isCollapsed ? 'justify-center px-0' : 'px-8'}`}>
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm shadow-brand-500/30 flex-shrink-0">
            <Hexagon size={18} strokeWidth={3} className="text-white" />
          </div>
          <span className={`text-xl font-bold tracking-tight text-slate-900 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
            iWent
          </span>
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-600 shadow-sm z-50 hover:border-brand-200 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon size={20} strokeWidth={2} className="flex-shrink-0" />
            <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <button 
          className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Çıkış Yap" : undefined}
        >
          <LogOut size={20} strokeWidth={2} className="flex-shrink-0" />
          <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
            Çıkış Yap
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;