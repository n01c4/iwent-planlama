
import React, { useState } from 'react';
import { ChatItem } from './Messages';
import { ChatMembers } from './ChatMembers';

interface ChatInfoProps {
  chat: ChatItem;
  onBack: () => void;
}

export const ChatInfo: React.FC<ChatInfoProps> = ({ chat, onBack }) => {
  const [notifications, setNotifications] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  const SETTINGS_GROUPS = [
    {
      title: 'GRUP BİLGİSİ',
      items: chat.isGroup ? [
        { 
          id: 'members', 
          label: 'Grup Üyeleri', 
          icon: 'groups', 
          type: 'button',
          action: () => setShowMembers(true)
        },
      ] : []
    },
    {
      title: 'KİŞİSELLEŞTİR',
      items: [
        { id: 'mute', label: 'Bildirimleri Sessize Al', icon: 'notifications_off', type: 'toggle', value: !notifications, action: () => setNotifications(!notifications) },
        { id: 'search', label: 'Sohbette Ara', icon: 'search', type: 'button' },
      ]
    },
    {
      title: 'MEDYA VE DOSYALAR',
      items: [
        { id: 'media', label: 'Medya, Bağlantılar ve Belgeler', icon: 'image', type: 'button' },
        { id: 'starred', label: 'Yıldızlı Mesajlar', icon: 'star', type: 'button' },
      ]
    },
    {
      title: 'YÖNETİM',
      items: [
        { id: 'clear', label: 'Sohbeti Temizle', icon: 'delete_outline', type: 'button', color: 'text-white/60' },
        { id: 'block', label: 'Engelle', icon: 'block', type: 'button', color: 'text-red-500' },
        { id: 'report', label: 'Şikayet Et', icon: 'report_problem', type: 'button', color: 'text-red-500' },
      ]
    }
  ];

  if (showMembers) {
    return <ChatMembers chatName={chat.name} onBack={() => setShowMembers(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 font-display overflow-y-auto no-scrollbar">
      {/* Top Header */}
      <header className="px-6 pt-14 pb-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white transition-all active:scale-90"
        >
          <span className="material-icons-round text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-black tracking-tight uppercase">Bilgi</h2>
        <div className="w-10"></div>
      </header>

      {/* Profile Section */}
      <div className="flex flex-col items-center px-6 pt-10 pb-12 border-b border-white/5">
        <div className="relative group">
          <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-105">
            <img src={chat.avatar} className="w-full h-full object-cover" alt={chat.name} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center border-4 border-black">
            <span className="material-icons-round text-black text-[20px]">{chat.isGroup ? 'groups' : 'person'}</span>
          </div>
        </div>
        
        <h1 className="mt-8 text-3xl font-black text-white tracking-tighter text-center">{chat.name}</h1>
        <p className="text-primary font-black uppercase tracking-[0.25em] text-[12px] mt-2">
          {chat.isGroup ? 'Grup Sohbeti' : (chat.isOnline ? 'Çevrimiçi' : 'Son görülme bugün')}
        </p>
      </div>

      {/* Settings Section */}
      <div className="p-6 space-y-12 pb-24">
        {SETTINGS_GROUPS.map((group) => group.items.length > 0 && (
          <div key={group.title} className="space-y-4">
            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">{group.title}</h3>
            <div className="bg-white/[0.03] border border-white/5 rounded-[32px] overflow-hidden">
              {group.items.map((item, idx) => (
                <div 
                  key={item.id}
                  onClick={() => item.type === 'button' && item.action?.()}
                  className={`flex items-center justify-between p-5 transition-all cursor-pointer hover:bg-white/[0.05] ${idx !== group.items.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <span className={`material-icons-round text-[20px] ${item.color || 'text-white/60'}`}>{item.icon}</span>
                    </div>
                    <span className={`font-bold text-[16px] ${item.color || 'text-white/80'}`}>{item.label}</span>
                  </div>
                  
                  {item.type === 'toggle' ? (
                    <button 
                      onClick={item.action}
                      className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${item.value ? 'bg-primary' : 'bg-white/10'}`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-black shadow-lg transition-transform duration-300 ${item.value ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                  ) : (
                    <span className="material-icons-round text-white/10">chevron_right</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
