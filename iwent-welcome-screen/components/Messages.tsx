
import React, { useState } from 'react';
import { ChatDetail } from './ChatDetail';
import { Language } from '../App';

export interface ChatItem {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  isGroup: boolean;
  isTyping: boolean;
  avatar: string;
  type: 'personal' | 'group' | 'support';
}

const INITIAL_CHATS: ChatItem[] = [
  {
    id: 1,
    name: 'Zeynep Demir',
    lastMessage: 'Biletleri aldın mı?',
    time: '12:30',
    unreadCount: 2,
    isOnline: true,
    isGroup: false,
    isTyping: false,
    avatar: 'https://i.pravatar.cc/150?u=zeynep',
    type: 'personal'
  },
  {
    id: 2,
    name: 'Festival Tayfası 🤘',
    lastMessage: 'Yazıyor...',
    time: 'Şimdi',
    unreadCount: 0,
    isOnline: false,
    isGroup: true,
    isTyping: true,
    avatar: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=100',
    type: 'group'
  },
  {
    id: 3,
    name: 'Biletix Support',
    lastMessage: 'İade işleminiz onaylandı.',
    time: 'Cuma',
    unreadCount: 1,
    isOnline: true,
    isGroup: false,
    isTyping: false,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100',
    type: 'support'
  },
  {
    id: 4,
    name: 'Mert Yılmaz',
    lastMessage: 'Konum attım kanka, bekliyorum.',
    time: '11:45',
    unreadCount: 0,
    isOnline: false,
    isGroup: false,
    isTyping: false,
    avatar: 'https://i.pravatar.cc/150?u=mert',
    type: 'personal'
  },
  {
    id: 5,
    name: 'After Party Grubu',
    lastMessage: 'Selam millet, mekan belli oldu mu?',
    time: 'Dün',
    unreadCount: 0,
    isOnline: false,
    isGroup: true,
    isTyping: false,
    avatar: 'https://images.unsplash.com/photo-1514525253344-f81f3c749b1a?auto=format&fit=crop&q=80&w=100',
    type: 'group'
  }
];

const FRIENDS_TO_ADD = [
  { id: 101, name: 'Selin Kaya', avatar: 'https://i.pravatar.cc/150?u=selin', isOnline: true },
  { id: 102, name: 'Burak Öz', avatar: 'https://i.pravatar.cc/150?u=burak', isOnline: false },
  { id: 103, name: 'Elif Demir', avatar: 'https://i.pravatar.cc/150?u=elif', isOnline: true },
  { id: 104, name: 'Caner Erkin', avatar: 'https://i.pravatar.cc/150?u=caner', isOnline: false },
  { id: 105, name: 'Aslı Enver', avatar: 'https://i.pravatar.cc/150?u=asli', isOnline: true },
];

interface MessagesProps {
  language: Language;
  onScrollAction?: (visible: boolean) => void;
}

// Internal Create Group Component
const CreateGroupView: React.FC<{
  onBack: () => void;
  onCreate: (name: string, participants: number[]) => void;
  language: Language;
}> = ({ onBack, onCreate, language }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedIds.length > 0) {
      onCreate(groupName, selectedIds);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 font-display">
      <header className="px-6 pt-14 pb-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur-xl z-20 border-b border-white/5">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <span className="material-icons-round">close</span>
        </button>
        <h2 className="text-lg font-black tracking-tight uppercase">{language === 'TR' ? 'YENİ GRUP' : 'NEW GROUP'}</h2>
        <button 
          onClick={handleCreate}
          disabled={!groupName.trim() || selectedIds.length === 0}
          className={`text-[12px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
            groupName.trim() && selectedIds.length > 0 
              ? 'bg-primary text-black' 
              : 'bg-white/5 text-white/20'
          }`}
        >
          {language === 'TR' ? 'OLUŞTUR' : 'CREATE'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-40">
        {/* Group Info Input */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-[28px] bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group">
            <span className="material-icons-round text-3xl text-white/20 group-hover:text-primary transition-colors">add_a_photo</span>
          </div>
          <div className="flex-1">
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={language === 'TR' ? 'Grup Konusu' : 'Group Subject'}
              className="w-full bg-transparent border-b-2 border-white/10 py-2 text-xl font-bold text-white placeholder-white/20 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Participants Label */}
        <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 ml-1">
          {language === 'TR' ? 'KATILIMCILAR' : 'PARTICIPANTS'} 
          <span className="ml-2 text-primary">{selectedIds.length}</span>
        </h3>

        {/* Friends List */}
        <div className="space-y-3">
          {FRIENDS_TO_ADD.map(friend => {
            const isSelected = selectedIds.includes(friend.id);
            return (
              <div 
                key={friend.id}
                onClick={() => toggleSelection(friend.id)}
                className={`flex items-center justify-between p-3 rounded-[24px] border transition-all cursor-pointer active:scale-[0.98] ${
                  isSelected 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={friend.avatar} className="w-12 h-12 rounded-2xl object-cover" alt={friend.name} />
                    {friend.isOnline && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full border-[3px] border-black"></div>}
                  </div>
                  <span className={`font-bold transition-colors ${isSelected ? 'text-white' : 'text-white/70'}`}>
                    {friend.name}
                  </span>
                </div>
                
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'bg-primary border-primary' : 'border-white/20'
                }`}>
                  {isSelected && <span className="material-icons-round text-black text-sm font-bold">check</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Messages: React.FC<MessagesProps> = ({ language, onScrollAction }) => {
  const [chats, setChats] = useState<ChatItem[]>(INITIAL_CHATS);
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const filters = ['Tümü', 'Okunmamış', 'Gruplar', 'Destek'];

  const handleCreateGroup = (name: string, participantIds: number[]) => {
    const newGroup: ChatItem = {
      id: Date.now(),
      name: name,
      lastMessage: language === 'TR' ? 'Grup oluşturuldu' : 'Group created',
      time: language === 'TR' ? 'Şimdi' : 'Just now',
      unreadCount: 0,
      isOnline: false,
      isGroup: true,
      isTyping: false,
      avatar: 'https://images.unsplash.com/photo-1523580494863-6f30312245d5?auto=format&fit=crop&q=80&w=200', // Placeholder
      type: 'group'
    };
    setChats([newGroup, ...chats]);
    setShowCreateGroup(false);
  };

  if (showCreateGroup) {
    return (
      <CreateGroupView 
        language={language} 
        onBack={() => setShowCreateGroup(false)} 
        onCreate={handleCreateGroup} 
      />
    );
  }

  if (selectedChat) {
    return <ChatDetail chat={selectedChat} onBack={() => setSelectedChat(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-black h-full animate-in fade-in slide-in-from-right-4 duration-500 font-display">
      {/* Sticky Header with Search and Create Button */}
      <header className="px-6 pt-14 pb-4 sticky top-0 bg-black/95 backdrop-blur-3xl z-50 border-b border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative group flex-1">
            <span className="material-icons-round absolute left-5 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder={language === 'TR' ? "Sohbetlerde ara..." : "Search chats..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.08] border-2 border-white/10 rounded-[24px] pl-14 pr-6 py-3.5 text-white placeholder-white/40 font-bold focus:outline-none focus:border-primary/60 focus:bg-white/[0.12] transition-all duration-300 text-[15px]"
            />
          </div>
          
          <button 
            onClick={() => setShowCreateGroup(true)}
            className="w-[54px] h-[54px] bg-primary rounded-[24px] flex items-center justify-center text-black shadow-[0_4px_20px_rgba(0,230,118,0.3)] active:scale-90 transition-all hover:brightness-110"
          >
            <span className="material-icons-round text-3xl">group_add</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-7 py-3 rounded-full font-black text-[15px] transition-all duration-300 whitespace-nowrap border-2 tracking-tighter ${
                activeFilter === filter 
                  ? 'bg-primary text-black border-primary shadow-[0_4px_16px_rgba(0,230,118,0.25)] scale-105' 
                  : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:border-white/30'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Chat List */}
      <div className="flex-1 px-4 space-y-3 mt-6 pb-40">
        {chats.map((chat) => (
          <div 
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className={`group relative p-5 rounded-[36px] flex items-center gap-6 transition-all duration-300 cursor-pointer active:scale-[0.96] border-2 ${
              chat.unreadCount > 0 ? 'bg-white/[0.05] border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/10'
            }`}
          >
            {/* Avatar Container */}
            <div className="relative shrink-0">
              <div className="w-[76px] h-[76px] rounded-[30px] overflow-hidden border-2 border-white/15 group-hover:border-primary/50 transition-all duration-500 shadow-xl">
                <img src={chat.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-110" alt={chat.name} />
              </div>
              
              {chat.type === 'support' && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full border-[3px] border-black flex items-center justify-center shadow-2xl">
                  <span className="material-icons-round text-[18px] text-white font-black">headset_mic</span>
                </div>
              )}

              {chat.isOnline && !chat.isGroup && chat.type !== 'support' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-primary rounded-full border-[4px] border-black shadow-2xl"></div>
              )}

              {chat.isGroup && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white/10 backdrop-blur-xl rounded-full border-[3px] border-black flex items-center justify-center shadow-2xl">
                  <span className="material-icons-round text-[18px] text-white font-black">groups</span>
                </div>
              )}
            </div>

            {/* Info Container */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className={`text-[21px] font-black truncate tracking-tighter leading-tight transition-colors ${chat.unreadCount > 0 ? 'text-white' : 'text-white/90'}`}>
                  {chat.name}
                </h3>
                <span className={`text-[13px] font-black tracking-tighter shrink-0 ml-4 ${chat.unreadCount > 0 ? 'text-primary' : 'text-white/30'}`}>
                  {chat.time}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <p className={`text-[16px] truncate tracking-tight leading-snug transition-colors ${
                  chat.isTyping ? 'text-primary font-black italic' : 
                  chat.unreadCount > 0 ? 'text-white font-extrabold' : 'text-white/40 font-bold'
                }`}>
                  {chat.lastMessage}
                </p>
                
                {chat.unreadCount > 0 && (
                  <div className="min-w-[26px] h-[26px] px-2 rounded-full bg-primary flex items-center justify-center shadow-[0_6px_15px_rgba(0,230,118,0.6)] shrink-0 ml-4">
                    <span className="text-black text-[12px] font-black">{chat.unreadCount}</span>
                  </div>
                )}

                {!chat.unreadCount && !chat.isTyping && (
                  <span className="material-icons-round text-[20px] text-white/20 shrink-0 ml-4">done_all</span>
                )}
              </div>
            </div>

            {/* Unread Glow Accent */}
            {chat.unreadCount > 0 && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-12 bg-primary rounded-r-full shadow-[6px_0_20px_rgba(0,230,118,0.7)]"></div>
            )}
          </div>
        ))}

        {/* Security / Info Footer */}
        <div className="pt-12 pb-16 text-center">
           <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/[0.03] rounded-full border border-white/5 backdrop-blur-md">
              <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#00E676]"></span>
              <p className="text-[12px] font-black text-white/40 uppercase tracking-[0.25em]">Uçtan Uca Şifreli</p>
           </div>
        </div>
      </div>
    </div>
  );
};
