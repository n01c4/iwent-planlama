import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, LogOut, User, Settings, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const notifications = [
    { id: 1, text: 'Neon Festivali biletleri tükenmek üzere!', time: '10 dk önce', unread: true },
    { id: 2, text: 'Yeni satış: VIP Bilet (2 adet)', time: '1 saat önce', unread: true },
    { id: 3, text: 'Haftalık gelir raporunuz hazır.', time: 'Dün', unread: false },
  ];

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Etkinlik veya bilet ara..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Campaign Button */}
        <button className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <Megaphone size={18} />
            Kampanya Oluştur
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
            <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-full transition-colors ${isNotificationsOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-slate-900">Bildirimler</h3>
                        <button className="text-xs text-brand-600 hover:text-brand-700 font-medium">Tümünü Okundu İşaretle</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.map(notif => (
                            <div key={notif.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${notif.unread ? 'bg-blue-50/30' : ''}`}>
                                <div className="mt-1 w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" style={{ opacity: notif.unread ? 1 : 0 }}></div>
                                <div>
                                    <p className="text-sm text-slate-700 leading-snug">{notif.text}</p>
                                    <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 bg-slate-50 text-center">
                        <button className="text-xs font-medium text-slate-600 hover:text-slate-900">Tüm Bildirimleri Gör</button>
                    </div>
                </div>
            )}
        </div>
        
        {/* User Profile */}
        <div className="relative" ref={profileRef}>
            <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-3 p-1.5 pl-3 rounded-lg transition-colors group ${isProfileOpen ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors">Emre Yılmaz</p>
                    <p className="text-xs text-slate-500">Organizator</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-medium shadow-md shadow-brand-500/20 ring-2 ring-white">
                    EY
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2">
                        <div className="px-3 py-2 border-b border-slate-50 mb-1 sm:hidden">
                            <p className="font-semibold text-slate-900">Emre Yılmaz</p>
                            <p className="text-xs text-slate-500">emre@iwent.com</p>
                        </div>
                        <button 
                            onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                            <User size={16} className="text-slate-400" />
                            Profil
                        </button>
                        <button 
                             onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                             className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                            <Settings size={16} className="text-slate-400" />
                            Ayarlar
                        </button>
                    </div>
                    <div className="p-2 border-t border-slate-100 bg-slate-50">
                        <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                            <LogOut size={16} />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;