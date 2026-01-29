import React, { useState, useEffect } from 'react';
import { 
  MoreHorizontal, Check, X, MessageSquare, Shield, 
  Users, Lock, Trash2, Slash, Zap, AlertTriangle,
  Search, Eye, LockOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Types
interface Report {
  id: number;
  type: string;
  user: string;
  content: string;
  date: string;
  status: 'pending' | 'reviewed';
}

interface ChatGroup {
  id: number;
  name: string;
  online: number;
  total: number;
  status: 'active' | 'frozen';
  lastActivity: string;
}

const Moderation: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reports' | 'chat' | 'tools'>('reports');

  // --- STATE: Reports (Mocked for now as no endpoint exists) ---
  const [reports, setReports] = useState<Report[]>([
    { id: 1, type: 'Yorum Şikayeti', user: 'Ahmet K.', content: 'Bu etkinlik hakkında yanıltıcı bilgi veriliyor, bilet fiyatları farklı.', date: '2 saat önce', status: 'pending' },
    { id: 2, type: 'Etkinlik Onayı', user: 'Mehmet S.', content: 'Yaz Sonu Partisi 2024 - Etkinlik onayı bekliyor.', date: '5 saat önce', status: 'pending' },
    { id: 3, type: 'Profil Şikayeti', user: 'Ayşe Y.', content: 'Uygunsuz profil fotoğrafı bildirimi.', date: '1 gün önce', status: 'reviewed' },
    { id: 4, type: 'Spam Bildirimi', user: 'Canan T.', content: 'Sürekli aynı mesajı gönderiyor.', date: '2 gün önce', status: 'pending' },
  ]);

  // --- STATE: Chat Groups ---
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // Fetch chats from API
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoadingChats(true);
      const apiChats = await api.getMyEventChats();
      
      // Transform API response (ChatRoom) to UI (ChatGroup)
      const transformedChats: ChatGroup[] = apiChats.map((room: any) => ({
        id: room.id,
        name: room.name || 'İsimsiz Grup',
        online: Math.floor(Math.random() * 20), // Mocking online count as API doesn't provide it in list
        total: room.members ? room.members.length : 0,
        status: 'active', // Default status
        lastActivity: new Date(room.createdAt).toLocaleDateString('tr-TR')
      }));

      // If API empty, use some mocks for visuals
      if (transformedChats.length === 0) {
         setChatGroups([
            { id: 1, name: 'Neon Festivali 2024', online: 142, total: 1200, status: 'active', lastActivity: '1 dk önce' },
            { id: 2, name: 'Teknoloji Zirvesi', online: 85, total: 850, status: 'active', lastActivity: '5 dk önce' }
         ]);
      } else {
         setChatGroups(transformedChats);
      }
      setIsLoadingChats(false);
    };

    if (activeTab === 'chat') {
      fetchChats();
    }
  }, [activeTab]);

  // --- STATE: Tools ---
  const [blockedWords, setBlockedWords] = useState(['dolandırıcı', 'fake', 'iptal']);
  const [newWord, setNewWord] = useState('');
  const [autoModSettings, setAutoModSettings] = useState({
    spamProtection: true,
    slowMode: false,
    mediaFilter: true
  });

  // --- HANDLERS: Reports ---
  const handleApproveReport = (id: number) => {
    // In a real app, this would make an API call
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'reviewed' } : r));
    alert('İşlem onaylandı ve rapor arşivlendi.');
  };

  const handleRejectReport = (id: number) => {
    if (window.confirm('Bu raporu silmek istediğinize emin misiniz?')) {
        setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  // --- HANDLERS: Chat Groups ---
  const toggleChatStatus = (id: number) => {
    setChatGroups(prev => prev.map(group => {
        if (group.id === id) {
            const newStatus = group.status === 'active' ? 'frozen' : 'active';
            // Here you would call API to update room status
            return { ...group, status: newStatus };
        }
        return group;
    }));
  };

  const clearChatHistory = (id: number) => {
    if (window.confirm('Bu grubun tüm sohbet geçmişi silinecek. Bu işlem geri alınamaz. Devam edilsin mi?')) {
        alert('Sohbet geçmişi başarıyla temizlendi.');
    }
  };

  const viewChat = (id: number) => {
      navigate(`/moderation/chat/${id}`);
  };

  // --- HANDLERS: Tools ---
  const handleAddWord = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newWord.trim()) {
      if (!blockedWords.includes(newWord.trim())) {
        setBlockedWords([...blockedWords, newWord.trim()]);
      }
      setNewWord('');
    }
  };

  const removeWord = (word: string) => {
    setBlockedWords(blockedWords.filter(w => w !== word));
  };

  const toggleAutoMod = (key: keyof typeof autoModSettings) => {
      setAutoModSettings(prev => ({
          ...prev,
          [key]: !prev[key]
      }));
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Moderasyon Merkezi</h1>
        <p className="text-slate-500 mt-1">Topluluk yönetimi, şikayetler ve güvenlik ayarları.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'reports' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
                <AlertTriangle size={18} />
                Şikayetler & Raporlar
            </span>
            {activeTab === 'reports' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full"></div>}
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'chat' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
             <span className="flex items-center gap-2">
                <MessageSquare size={18} />
                Sohbet Grupları
            </span>
            {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full"></div>}
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'tools' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
             <span className="flex items-center gap-2">
                <Shield size={18} />
                Moderasyon Araçları
            </span>
            {activeTab === 'tools' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full"></div>}
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        
        {/* TAB 1: REPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                            <th className="py-4 px-6">Tür</th>
                            <th className="py-4 px-6">Kullanıcı</th>
                            <th className="py-4 px-6">İçerik Detayı</th>
                            <th className="py-4 px-6">Tarih</th>
                            <th className="py-4 px-6">Durum</th>
                            <th className="py-4 px-6 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reports.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6">
                                    <span className="font-medium text-slate-900">{item.type}</span>
                                </td>
                                <td className="py-4 px-6 text-slate-600">{item.user}</td>
                                <td className="py-4 px-6 text-slate-600">
                                    <p className="truncate max-w-xs text-sm">{item.content}</p>
                                </td>
                                <td className="py-4 px-6 text-slate-500 text-sm whitespace-nowrap">{item.date}</td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                        item.status === 'pending' 
                                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                        : 'bg-green-50 text-green-700 border-green-200'
                                    }`}>
                                        {item.status === 'pending' ? 'Bekliyor' : 'İncelendi'}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {item.status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => handleApproveReport(item.id)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                                                    title="Onayla / Arşivle"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectReport(item.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                                    title="Reddet / Sil"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        )}
                                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {reports.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                    İncelenecek kayıt bulunamadı.
                </div>
            )}
          </div>
        )}

        {/* TAB 2: CHAT GROUPS */}
        {activeTab === 'chat' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {isLoadingChats ? (
                    <div className="col-span-3 text-center py-10 text-slate-400">Yükleniyor...</div>
                ) : chatGroups.map(group => (
                    <div key={group.id} className={`bg-white rounded-xl border shadow-sm p-6 flex flex-col justify-between transition-all ${group.status === 'frozen' ? 'border-red-200 bg-red-50/10' : 'border-slate-200'}`}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-slate-900 truncate pr-2">{group.name}</h3>
                                <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    group.status === 'active' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-red-50 text-red-600 border-red-200'
                                }`}>
                                    {group.status === 'active' ? 'Aktif' : 'Donduruldu'}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-slate-600 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${group.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
                                    <span>{group.status === 'active' ? group.online : 0} Çevrimiçi</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-slate-400" />
                                    <span>{group.total} Üye</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => viewChat(group.id)}
                                className="w-full py-2 bg-brand-50 text-brand-700 font-medium rounded-lg hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Eye size={18} />
                                Sohbeti Görüntüle
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleChatStatus(group.id)}
                                    className={`flex-1 py-2 border font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                                        group.status === 'active' 
                                        ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                                        : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                                    }`}
                                >
                                    {group.status === 'active' ? <><Lock size={18} /> Dondur</> : <><LockOpen size={18} /> Aktif Et</>}
                                </button>
                                <button 
                                    onClick={() => clearChatHistory(group.id)}
                                    className="flex-1 py-2 border border-slate-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2" 
                                    title="Geçmişi Temizle"
                                >
                                    <Trash2 size={18} />
                                    Temizle
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Add New Group Placeholder */}
                <div 
                    onClick={() => alert('Bu özellik yakında eklenecek!')}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-400 hover:border-brand-300 hover:bg-brand-50/30 transition-all cursor-pointer min-h-[200px]"
                >
                    <MessageSquare size={32} className="mb-2 opacity-50" />
                    <p className="font-medium">Yeni bir etkinlik için sohbet grubu oluştur</p>
                </div>
             </div>
        )}

        {/* TAB 3: TOOLS (Kept local/mock for now as API has no endpoints yet) */}
        {activeTab === 'tools' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Same content as before */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <Slash size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Yasaklı Kelimeler</h3>
                            <p className="text-sm text-slate-500">Bu kelimeleri içeren mesajlar otomatik olarak gizlenir.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Kelime ekle ve Enter'a bas..." 
                                    value={newWord}
                                    onChange={(e) => setNewWord(e.target.value)}
                                    onKeyDown={handleAddWord}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>
                            <button 
                                onClick={() => handleAddWord({ key: 'Enter' } as any)}
                                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Ekle
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
                            {blockedWords.map((word, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm border border-red-100 group">
                                    {word}
                                    <button onClick={() => removeWord(word)} className="hover:text-red-900">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            {blockedWords.length === 0 && (
                                <p className="text-slate-400 text-sm italic py-2">Henüz yasaklı kelime eklenmedi.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Auto Mod Settings */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Zap size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">Otomatik Kontroller</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Spam Koruması</p>
                                    <p className="text-xs text-slate-500">Ardışık mesajları engelle</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={autoModSettings.spamProtection}
                                        onChange={() => toggleAutoMod('spamProtection')}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                </label>
                            </div>
                            
                            <hr className="border-slate-100" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Yavaş Mod</p>
                                    <p className="text-xs text-slate-500">Kullanıcılar arası 10sn bekleme</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={autoModSettings.slowMode}
                                        onChange={() => toggleAutoMod('slowMode')}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                </label>
                            </div>

                            <hr className="border-slate-100" />

                             <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Medya Filtresi</p>
                                    <p className="text-xs text-slate-500">Görsel gönderimini kapat</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={autoModSettings.mediaFilter}
                                        onChange={() => toggleAutoMod('mediaFilter')}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-900 rounded-xl p-6 text-white">
                        <div className="flex items-start gap-3">
                            <Shield className="mt-1 text-brand-300" />
                            <div>
                                <h4 className="font-bold text-sm">Sadece Biletli Kullanıcılar</h4>
                                <p className="text-xs text-brand-200 mt-1 leading-relaxed">
                                    Bu ayar açıldığında, sohbet gruplarına sadece o etkinlik için bilet satın almış doğrulanmış kullanıcılar katılabilir.
                                </p>
                            </div>
                        </div>
                        <button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition-colors border border-white/10 cursor-not-allowed" disabled>
                            Aktif (Değiştirilemez)
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Moderation;