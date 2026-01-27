import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Calendar, MessageSquare, AlertTriangle, 
  ShieldAlert, UserCheck, Settings, FileText, Search, Bell, Menu
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors mb-0.5 border-l-2 ${
      active 
      ? 'bg-brand-800 border-white text-white font-semibold' 
      : 'border-transparent text-brand-600 hover:text-white hover:bg-brand-900'
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? "text-white" : "text-brand-600 group-hover:text-white"} />
    {label}
  </Link>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black flex text-white font-sans selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 border-r border-brand-800 bg-black transition-all duration-200 flex flex-col fixed h-full z-20`}>
        <div className="h-16 flex items-center px-4 mb-2 border-b border-brand-800">
          <div className="flex items-center gap-3 font-bold text-lg tracking-tight text-white">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black text-sm rounded-sm">
              iW
            </div>
            {sidebarOpen && <span>ADMIN</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-[10px] font-bold text-brand-600 uppercase tracking-widest">{sidebarOpen && 'Main'}</div>
          <NavItem to="/" icon={LayoutDashboard} label={sidebarOpen ? "Overview" : ""} active={isActive('/')} />
          <NavItem to="/organizers" icon={Users} label={sidebarOpen ? "Organizers" : ""} active={isActive('/organizers')} />
          <NavItem to="/events" icon={Calendar} label={sidebarOpen ? "Events" : ""} active={isActive('/events')} />
          <NavItem to="/chats" icon={MessageSquare} label={sidebarOpen ? "Chat Groups" : ""} active={isActive('/chats')} />
          <NavItem to="/moderation" icon={ShieldAlert} label={sidebarOpen ? "Moderation" : ""} active={isActive('/moderation')} />
          
          <div className="px-4 mt-8 mb-2 text-[10px] font-bold text-brand-600 uppercase tracking-widest">{sidebarOpen && 'Manage'}</div>
          <NavItem to="/reports" icon={AlertTriangle} label={sidebarOpen ? "Reports" : ""} active={isActive('/reports')} />
          <NavItem to="/users" icon={UserCheck} label={sidebarOpen ? "Users" : ""} active={isActive('/users')} />
          <NavItem to="/audit" icon={FileText} label={sidebarOpen ? "Audit Log" : ""} active={isActive('/audit')} />
          <NavItem to="/settings" icon={Settings} label={sidebarOpen ? "Settings" : ""} active={isActive('/settings')} />
        </nav>

        <div className="p-3 border-t border-brand-800">
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center justify-center w-full p-2 text-brand-600 hover:text-white hover:bg-brand-900 border border-transparent hover:border-brand-700 transition-colors rounded-sm">
              <Menu size={20} />
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Top Header - High Contrast */}
        <header className="h-16 bg-black/90 backdrop-blur-none sticky top-0 z-10 px-6 flex items-center justify-between border-b border-brand-800">
            <div className="flex items-center gap-4 flex-1">
                {/* Global Search */}
                <div className="relative w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600 group-focus-within:text-white transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="SEARCH (Press /)"
                        className="w-full bg-brand-900 border border-brand-700 rounded-sm pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder:text-brand-700 font-medium"
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <button className="text-brand-600 hover:text-white transition-colors p-2 border border-transparent hover:border-brand-700 rounded-sm">
                    <Bell size={20} />
                </button>
                <div className="w-8 h-8 bg-brand-800 border border-brand-700 flex items-center justify-center text-xs font-bold text-white rounded-sm">
                    AD
                </div>
            </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-[1600px] mx-auto w-full">
            {children}
        </div>
      </main>
    </div>
  );
};