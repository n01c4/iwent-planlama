
import React, { useState } from 'react';

interface UserPublicProfileProps {
  user: {
    id: number;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  onBack: () => void;
}

export const UserPublicProfile: React.FC<UserPublicProfileProps> = ({ user, onBack }) => {
  const [requestSent, setRequestSent] = useState(false);

  return (
    <div className="fixed inset-0 z-[800] bg-black flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 font-display overflow-y-auto no-scrollbar pb-32">
      {/* Header - Removed Title as requested */}
      <header className="px-6 pt-14 pb-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-30">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white transition-all active:scale-90 border border-white/10"
        >
          <span className="material-icons-round text-2xl">chevron_left</span>
        </button>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
          <span className="material-icons-round text-2xl">more_horiz</span>
        </button>
      </header>

      {/* Profile Section */}
      <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center relative">
        {/* Glow behind avatar - adjusted to not interfere with content */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative shrink-0 z-10">
          <div className="w-28 h-28 rounded-[36px] overflow-hidden border-2 border-primary/20 p-1 shadow-[0_0_30px_rgba(0,230,118,0.1)]">
            <img src={user.avatar} className="w-full h-full object-cover rounded-[28px]" alt={user.name} />
          </div>
          {user.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-[4px] border-black shadow-[0_0_10px_#00E676]"></div>
          )}
        </div>

        <h1 className="mt-6 text-2xl font-black text-white tracking-tighter z-10">{user.name}</h1>
        <p className="text-white/40 font-bold text-[13px] mt-1 italic z-10">"Konser tutkunu • Yeni yerler kaşifi 🚀"</p>
        
        {/* Connection Action - 15% Neon Glow-up as requested */}
        <div className="w-full max-w-xs mt-8 z-10">
          <button 
            onClick={() => setRequestSent(!requestSent)}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 font-black uppercase tracking-[0.2em] text-[13px] ${
              requestSent 
                ? 'bg-white/5 border border-white/10 text-white/40' 
                : 'bg-primary text-black shadow-[0_0_15px_rgba(0,230,118,0.15)] active:scale-95'
            }`}
          >
            <span className="material-icons-round text-[20px]">
              {requestSent ? 'done' : 'person_add'}
            </span>
            {requestSent ? 'İstek Gönderildi' : 'Arkadaş Ol'}
          </button>
        </div>
      </div>

      {/* Stats Section - Fixed spacing to prevent overlap */}
      <div className="grid grid-cols-2 gap-4 px-6 mt-6 mb-8 text-center relative z-10">
        <div className="bg-white/[0.03] border border-white/5 rounded-[32px] py-8 backdrop-blur-md">
          <span className="text-3xl font-black text-white block">42</span>
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-2 block">ETKİNLİK</span>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-[32px] py-8 backdrop-blur-md">
          <span className="text-3xl font-black text-white block">89</span>
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-2 block">TAKİPÇİ</span>
        </div>
      </div>

      {/* Interests Section */}
      <div className="px-6 mb-8 space-y-4 relative z-10">
        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-2">İLGİ ALANLARI</h3>
        <div className="flex flex-wrap gap-2">
          {['Tekno', 'Jazz', 'Açıkhava', 'Festival', 'Workshop'].map(tag => (
            <span key={tag} className="px-5 py-2.5 bg-white/[0.04] border border-white/10 rounded-full text-[12px] font-black text-white/60 hover:bg-white/10 transition-colors">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Events Section */}
      <div className="px-6 relative z-10">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">ORTAK ETKİNLİKLER</h3>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer">TÜMÜ</span>
        </div>
        
        <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[36px] p-4 flex items-center gap-5 cursor-pointer active:scale-[0.98] transition-all group">
          <div className="w-20 h-20 rounded-[24px] overflow-hidden shrink-0 border border-white/10">
            <img 
              src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=200" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              alt="Event" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white text-[15px] font-black truncate tracking-tight uppercase">Techno Basement Night</h4>
            <p className="text-white/30 text-[11px] font-bold mt-1">12 OCA, 23:30</p>
            <div className="flex items-center gap-2 mt-3">
               <div className="flex -space-x-2">
                 <div className="w-5 h-5 rounded-full bg-primary/20 border border-black shadow-sm"></div>
                 <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-black shadow-sm"></div>
               </div>
               <span className="text-[9px] font-black text-primary uppercase tracking-widest">KATILIYOR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
