
import React, { useState } from 'react';
import { UserPublicProfile } from './UserPublicProfile';

interface Member {
  id: number;
  name: string;
  avatar: string;
  isOnline: boolean;
  isPrivate: boolean; // Settings logic: true means they don't appear in public lists
}

interface ChatMembersProps {
  chatName: string;
  onBack: () => void;
}

const MOCK_MEMBERS: Member[] = [
  { id: 1, name: 'Can Yılmaz', avatar: 'https://i.pravatar.cc/150?u=can', isOnline: true, isPrivate: false },
  { id: 2, name: 'Melis Aksoy', avatar: 'https://i.pravatar.cc/150?u=melis', isOnline: true, isPrivate: false },
  { id: 3, name: 'Emre Yıldız', avatar: 'https://i.pravatar.cc/150?u=emre', isOnline: false, isPrivate: false },
  { id: 4, name: 'Gizli Kullanıcı', avatar: 'https://i.pravatar.cc/150?u=ghost', isOnline: true, isPrivate: true }, // Should be filtered out
  { id: 5, name: 'Selin Kaya', avatar: 'https://i.pravatar.cc/150?u=selin', isOnline: false, isPrivate: false },
  { id: 6, name: 'Mert Öztürk', avatar: 'https://i.pravatar.cc/150?u=mert', isOnline: true, isPrivate: false },
  { id: 7, name: 'Derya Deniz', avatar: 'https://i.pravatar.cc/150?u=derya', isOnline: false, isPrivate: false },
  { id: 8, name: 'Bora Işık', avatar: 'https://i.pravatar.cc/150?u=bora', isOnline: true, isPrivate: true }, // Should be filtered out
];

export const ChatMembers: React.FC<ChatMembersProps> = ({ chatName, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);

  // Filter out private profiles and apply search
  const visibleMembers = MOCK_MEMBERS
    .filter(member => !member.isPrivate)
    .filter(member => member.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (selectedUser) {
    return (
      <UserPublicProfile 
        user={selectedUser} 
        onBack={() => setSelectedUser(null)} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[700] bg-black flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 font-display">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 sticky top-0 bg-black/95 backdrop-blur-xl z-20 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <span className="material-icons-round">chevron_left</span>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-black tracking-tight text-white uppercase">{chatName}</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{visibleMembers.length} KATILIMCI</p>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text"
            placeholder="Üyelerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all text-sm font-bold"
          />
        </div>
      </header>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-4 pb-20">
        {visibleMembers.map((member) => (
          <div 
            key={member.id}
            className="bg-white/[0.03] border border-white/5 rounded-[28px] p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
                  <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
                </div>
                {member.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-[3px] border-black shadow-[0_0_8px_#00E676]"></div>
                )}
              </div>
              <div>
                <h4 className="font-black text-white text-[16px] tracking-tight">{member.name}</h4>
                <p className={`text-[11px] font-bold uppercase tracking-widest ${member.isOnline ? 'text-primary' : 'text-white/20'}`}>
                  {member.isOnline ? 'Aktif' : 'Çevrimdışı'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedUser(member)}
              className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-white/60 hover:bg-primary hover:text-black hover:border-primary transition-all uppercase tracking-widest"
            >
              PROFİL
            </button>
          </div>
        ))}

        {visibleMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <span className="material-icons-round text-6xl mb-4">person_search</span>
            <p className="font-black text-sm uppercase tracking-widest">Üye Bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
};
