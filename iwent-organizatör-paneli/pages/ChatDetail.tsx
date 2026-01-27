import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, MoreVertical, 
  BarChart2, Megaphone, Gift, BrainCircuit,
  X, Check, BadgeCheck,
  Zap, Clock, Trophy, AlertTriangle, PartyPopper, Info
} from 'lucide-react';
import { ChatMessage, PollData, VoucherData, AnnouncementData, QuizData } from '../types';

// Mock Initial Data
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    type: 'text',
    sender: { id: 'u1', name: 'Ali Yılmaz', role: 'user', hasTicket: true, avatar: 'AY' },
    content: 'Konser saat kaçta başlıyor tam olarak?',
    timestamp: '19:42'
  },
  {
    id: '2',
    type: 'text',
    sender: { id: 'u2', name: 'Ayşe Demir', role: 'user', hasTicket: true, avatar: 'AD' },
    content: 'Kapı açılışı 18:00 dediler ama emin değilim.',
    timestamp: '19:43'
  },
  {
    id: '3',
    type: 'announcement',
    sender: { id: 'o1', name: 'Organizasyon', role: 'organizer', avatar: 'ORG' },
    content: 'Kapı açılış saati güncellendi.',
    data: {
        type: 'critical',
        title: 'Önemli Değişiklik',
        message: 'Kapı açılış saati yoğunluk nedeniyle 17:30\'a çekilmiştir. Erken gelenlere sürprizlerimiz var!'
    } as AnnouncementData,
    timestamp: '19:45'
  },
  {
    id: '4',
    type: 'text',
    sender: { id: 'u3', name: 'Mehmet Can', role: 'user', hasTicket: false, avatar: 'MC' },
    content: 'Biletim yok kapıda alabilir miyim?',
    timestamp: '19:46'
  }
];

const ChatDetail: React.FC = () => {
  const { id } = useParams(); // Using id to fetch chat details but simplified for mock
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [activeTool, setActiveTool] = useState<null | 'poll' | 'announcement' | 'quiz' | 'voucher'>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  
  // Specific Tool States
  const [announcementType, setAnnouncementType] = useState<'info' | 'critical' | 'party'>('info');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close tools menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'text',
      sender: { id: 'me', name: 'Siz (Org)', role: 'organizer', avatar: 'ME' },
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  // --- CREATION HANDLERS ---
  const handleCreatePoll = (question: string, options: string[], durationMinutes: number) => {
    const pollData: PollData = {
      question,
      options: options.map((opt, idx) => ({ id: idx.toString(), text: opt, votes: 0 })),
      totalVotes: 0,
      isActive: true,
      expiresAt: new Date(Date.now() + durationMinutes * 60000).toISOString()
    };
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'poll',
      sender: { id: 'me', name: 'Siz (Org)', role: 'organizer', avatar: 'ME' },
      content: 'Anket',
      data: pollData,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setActiveTool(null);
  };

  const handleCreateAnnouncement = (title: string, message: string) => {
    const announcementData: AnnouncementData = {
        type: announcementType,
        title,
        message
    };
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'announcement',
      sender: { id: 'me', name: 'Siz (Org)', role: 'organizer', avatar: 'ME' },
      content: message,
      data: announcementData,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setActiveTool(null);
  };

  const handleCreateVoucher = (title: string, code: string, discount: string) => {
      const voucherData: VoucherData = {
          title, code, discount, totalLimit: 50, claimed: 0
      };
      const newMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'voucher',
          sender: { id: 'me', name: 'Siz (Org)', role: 'organizer', avatar: 'ME' },
          content: 'Hediye Çeki',
          data: voucherData,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setActiveTool(null);
  };

  const handleCreateQuiz = (question: string, options: string[], correctIndex: number, prize: string) => {
      const quizData: QuizData = {
          question,
          options,
          correctOptionIndex: correctIndex,
          prize,
          status: 'active',
          participants: 0,
          expiresAt: new Date(Date.now() + 60000).toISOString() // 1 min default
      };
      const newMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'quiz',
          sender: { id: 'me', name: 'Siz (Org)', role: 'organizer', avatar: 'ME' },
          content: 'Bilgi Yarışması',
          data: quizData,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setActiveTool(null);
  };

  const openTool = (tool: 'poll' | 'announcement' | 'quiz' | 'voucher') => {
      setActiveTool(tool);
      setIsToolsMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50">
      {/* Chat Header */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/moderation')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">
                NF
             </div>
             <div>
                <h2 className="font-bold text-slate-900 leading-tight">Neon Festivali 2024</h2>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-green-600 flex items-center gap-1 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        142 Online
                    </p>
                    <p className="text-xs text-slate-400">Moderasyon Modu</p>
                </div>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <MoreVertical size={20} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50" ref={scrollRef}>
        <div className="text-center text-xs text-slate-400 my-4 flex items-center gap-2 justify-center">
             <span className="h-px w-12 bg-slate-200"></span>
             <span>Bugün</span>
             <span className="h-px w-12 bg-slate-200"></span>
        </div>

        {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender.role === 'organizer' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                
                {/* Avatar (Left) */}
                {msg.sender.role !== 'organizer' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 border-2 border-white shadow-sm">
                        {msg.sender.avatar}
                    </div>
                )}

                {/* Message Bubble Container */}
                <div className={`max-w-[90%] md:max-w-[70%] lg:max-w-[50%] flex flex-col ${msg.sender.role === 'organizer' ? 'items-end' : 'items-start'}`}>
                    
                    {/* Sender Name */}
                    {msg.sender.role !== 'organizer' && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                            <span className="text-xs font-semibold text-slate-600">{msg.sender.name}</span>
                            {msg.sender.hasTicket && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-blue-100 font-medium" title="Biletli Kullanıcı">
                                    <BadgeCheck size={10} /> Biletli
                                </span>
                            )}
                        </div>
                    )}

                    {/* Content Rendering Logic */}
                    <div className={`
                        relative rounded-2xl shadow-sm text-sm overflow-hidden transition-all
                        ${msg.sender.role === 'organizer' && msg.type === 'text'
                             ? 'bg-brand-600 text-white rounded-tr-none px-4 py-3' 
                             : msg.type === 'text' 
                                ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200 px-4 py-3'
                                : 'w-full' // Complex types take full width of container
                        }
                    `}>
                        {/* 1. TEXT MESSAGE */}
                        {msg.type === 'text' && <p className="leading-relaxed">{msg.content}</p>}

                        {/* 2. ANNOUNCEMENT (Enhanced) */}
                        {msg.type === 'announcement' && msg.data && (
                            <div className={`border-l-4 p-4 rounded-r-xl shadow-md ${
                                msg.data.type === 'critical' ? 'bg-red-50 border-red-500' :
                                msg.data.type === 'party' ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50 border-fuchsia-500' :
                                'bg-blue-50 border-blue-500'
                            }`}>
                                <div className="flex gap-3">
                                    <div className={`p-2 rounded-full h-fit text-white shadow-sm ${
                                        msg.data.type === 'critical' ? 'bg-red-500' :
                                        msg.data.type === 'party' ? 'bg-fuchsia-500' :
                                        'bg-blue-500'
                                    }`}>
                                        {msg.data.type === 'critical' ? <AlertTriangle size={20} /> :
                                         msg.data.type === 'party' ? <PartyPopper size={20} /> :
                                         <Info size={20} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold mb-1 uppercase text-xs tracking-wider ${
                                            msg.data.type === 'critical' ? 'text-red-700' :
                                            msg.data.type === 'party' ? 'text-fuchsia-700' :
                                            'text-blue-700'
                                        }`}>
                                            {msg.data.title}
                                        </h4>
                                        <p className={`text-sm leading-relaxed ${
                                            msg.data.type === 'critical' ? 'text-red-900' :
                                            msg.data.type === 'party' ? 'text-slate-900' :
                                            'text-blue-900'
                                        }`}>
                                            {msg.data.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. POLL (Enhanced) */}
                        {msg.type === 'poll' && msg.data && (
                            <div className="bg-white border border-slate-200 p-4 rounded-xl w-full min-w-[280px]">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        <div className="p-1.5 bg-brand-100 text-brand-600 rounded-lg">
                                            <BarChart2 size={16} />
                                        </div>
                                        {msg.data.question}
                                    </h4>
                                    {msg.data.isActive && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                            Canlı
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {msg.data.options.map((opt: any) => (
                                        <div key={opt.id} className="relative h-10 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 cursor-pointer hover:border-brand-200 transition-colors group">
                                            {/* Progress Bar */}
                                            <div className="absolute inset-y-0 left-0 bg-brand-100/50 z-0 transition-all duration-1000" style={{ width: `${Math.random() * 80 + 10}%` }}></div>
                                            
                                            <div className="absolute inset-0 flex items-center justify-between px-3 z-10 text-slate-700 text-sm font-medium">
                                                <span className="group-hover:text-brand-700 transition-colors">{opt.text}</span>
                                                <span className="text-slate-500 group-hover:text-brand-600">%{Math.floor(Math.random() * 100)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                                    <span>Toplam 142 Oy</span>
                                    <span className="flex items-center gap-1"><Clock size={12}/> 12dk kaldı</span>
                                </div>
                            </div>
                        )}

                        {/* 4. VOUCHER (Enhanced) */}
                        {msg.type === 'voucher' && msg.data && (
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-1 rounded-xl w-full max-w-sm">
                                <div className="border border-white/20 rounded-lg p-4 flex flex-col items-center text-center relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                    <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm shadow-inner">
                                        <Gift size={28} className="text-white animate-bounce" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">{msg.data.title}</h3>
                                    <p className="text-indigo-100 text-sm mb-4">{msg.data.discount} indirim kazanmak için koda dokun!</p>
                                    
                                    <div className="w-full bg-black/20 backdrop-blur-md px-4 py-3 rounded-lg border border-white/10 font-mono tracking-[0.2em] font-bold text-xl shadow-inner mb-2 cursor-pointer hover:bg-black/30 transition-colors active:scale-95">
                                        {msg.data.code}
                                    </div>
                                    
                                    <div className="w-full bg-black/10 rounded-full h-1.5 mt-2 overflow-hidden">
                                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-full w-[24%]"></div>
                                    </div>
                                    <p className="text-[10px] text-indigo-200 mt-1 flex justify-between w-full">
                                        <span>12 Alındı</span>
                                        <span>Limit: {msg.data.totalLimit}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 5. QUIZ (NEW) */}
                        {msg.type === 'quiz' && msg.data && (
                            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white p-5 rounded-xl w-full min-w-[300px] shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                            <BrainCircuit size={20} className="text-white" />
                                        </div>
                                        <span className="font-bold text-sm tracking-wide uppercase">Hızlı Cevap</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md text-xs font-mono">
                                        <Clock size={12} /> 00:45
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold mb-4 leading-snug relative z-10">{msg.data.question}</h3>

                                <div className="grid grid-cols-2 gap-2 relative z-10">
                                    {msg.data.options.map((opt: string, idx: number) => (
                                        <button key={idx} className="bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 rounded-lg py-2.5 px-3 text-sm font-medium transition-all text-left truncate">
                                            {opt}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs text-violet-200 relative z-10">
                                    <span className="flex items-center gap-1"><Trophy size={14} className="text-yellow-300"/> Ödül: {msg.data.prize}</span>
                                    <span>{Math.floor(Math.random() * 50)} Katılımcı</span>
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${msg.sender.role === 'organizer' && msg.type === 'text' ? 'text-blue-100' : 'text-slate-400'}`}>
                            {msg.timestamp}
                            {msg.sender.role === 'organizer' && <Check size={12} />}
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Engagement Tools Toolbar (Overlay) */}
      {activeTool && (
        <div className="bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] rounded-t-2xl z-30 animate-in slide-in-from-bottom-10 duration-300 absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto">
            <div className="p-4">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {activeTool === 'poll' && <><div className="p-2 bg-brand-100 rounded-lg text-brand-600"><BarChart2 size={20}/></div> Anket Oluştur</>}
                        {activeTool === 'announcement' && <><div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Megaphone size={20}/></div> Duyuru Yap</>}
                        {activeTool === 'quiz' && <><div className="p-2 bg-violet-100 rounded-lg text-violet-600"><BrainCircuit size={20}/></div> Yarışma Başlat</>}
                        {activeTool === 'voucher' && <><div className="p-2 bg-pink-100 rounded-lg text-pink-600"><Gift size={20}/></div> Hediye Dağıt</>}
                    </h3>
                    <button onClick={() => setActiveTool(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24}/>
                    </button>
                </div>

                {/* Tool: Announcement Form */}
                {activeTool === 'announcement' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                onClick={() => setAnnouncementType('info')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${announcementType === 'info' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                            >
                                <Info size={24} />
                                <span className="text-xs font-bold">Bilgi</span>
                            </button>
                            <button 
                                onClick={() => setAnnouncementType('critical')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${announcementType === 'critical' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                            >
                                <AlertTriangle size={24} />
                                <span className="text-xs font-bold">Acil / Uyarı</span>
                            </button>
                            <button 
                                onClick={() => setAnnouncementType('party')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${announcementType === 'party' ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                            >
                                <PartyPopper size={24} />
                                <span className="text-xs font-bold">Hype / Party</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Başlık</label>
                                <input 
                                    id="announcementTitle"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" 
                                    placeholder="Örn: Kapılar Açıldı!"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Mesaj</label>
                                <textarea 
                                    id="announcementMsg"
                                    rows={3}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none" 
                                    placeholder="Duyuru detaylarını buraya yazın..."
                                />
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                const t = (document.getElementById('announcementTitle') as HTMLInputElement).value;
                                const m = (document.getElementById('announcementMsg') as HTMLTextAreaElement).value;
                                if(t && m) handleCreateAnnouncement(t, m);
                            }}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-transform active:scale-[0.98]"
                        >
                            Yayınla
                        </button>
                    </div>
                )}

                {/* Tool: Poll Form */}
                {activeTool === 'poll' && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Soru</label>
                            <input id="pollQuestion" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 outline-none" placeholder="Örn: Sırada hangi şarkı gelsin?" />
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Seçenekler</label>
                            <input id="opt1" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Seçenek 1" />
                            <input id="opt2" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Seçenek 2" />
                            <input id="opt3" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Seçenek 3 (Opsiyonel)" />
                        </div>
                        
                        <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl">
                            <Clock size={20} className="text-slate-400" />
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-slate-500 block">Süre</label>
                                <select id="pollDuration" className="bg-transparent text-sm font-medium w-full outline-none">
                                    <option value="5">5 Dakika</option>
                                    <option value="15">15 Dakika</option>
                                    <option value="30">30 Dakika</option>
                                    <option value="60">1 Saat</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                const q = (document.getElementById('pollQuestion') as HTMLInputElement).value;
                                const o1 = (document.getElementById('opt1') as HTMLInputElement).value;
                                const o2 = (document.getElementById('opt2') as HTMLInputElement).value;
                                const o3 = (document.getElementById('opt3') as HTMLInputElement).value;
                                const d = parseInt((document.getElementById('pollDuration') as HTMLSelectElement).value);
                                
                                const opts = [o1, o2];
                                if(o3) opts.push(o3);
                                
                                if(q && o1 && o2) handleCreatePoll(q, opts, d);
                            }}
                            className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-transform active:scale-[0.98]"
                        >
                            Anketi Başlat
                        </button>
                    </div>
                )}

                {/* Tool: Quiz Form */}
                {activeTool === 'quiz' && (
                     <div className="space-y-4">
                        <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 flex gap-3 text-violet-800 text-sm mb-2">
                            <Zap size={20} className="flex-shrink-0" />
                            <p>Yarışma 60 saniye sürecek ve en hızlı doğru cevabı verenler sıralanacak.</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Soru</label>
                            <input id="qQuestion" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none" placeholder="Örn: Grubun solisti kimdir?" />
                        </div>
                         <div className="grid grid-cols-2 gap-3">
                            <input id="qOpt1" className="border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none" placeholder="Doğru Cevap" />
                            <input id="qOpt2" className="border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none" placeholder="Yanlış 1" />
                            <input id="qOpt3" className="border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none" placeholder="Yanlış 2" />
                            <input id="qOpt4" className="border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none" placeholder="Yanlış 3" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Ödül</label>
                            <input id="qPrize" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none" placeholder="Örn: Sahne Arkası Giriş Kartı" />
                        </div>
                        <button 
                             onClick={() => {
                                const q = (document.getElementById('qQuestion') as HTMLInputElement).value;
                                const o1 = (document.getElementById('qOpt1') as HTMLInputElement).value; // Correct
                                const o2 = (document.getElementById('qOpt2') as HTMLInputElement).value;
                                const o3 = (document.getElementById('qOpt3') as HTMLInputElement).value;
                                const o4 = (document.getElementById('qOpt4') as HTMLInputElement).value;
                                const p = (document.getElementById('qPrize') as HTMLInputElement).value;
                                
                                if(q && o1 && o2) handleCreateQuiz(q, [o1, o2, o3, o4].filter(Boolean), 0, p || 'Sürpriz Ödül');
                            }}
                            className="w-full bg-violet-600 text-white py-3.5 rounded-xl font-bold hover:bg-violet-700 transition-transform active:scale-[0.98]"
                        >
                            Yarışmayı Başlat
                        </button>
                    </div>
                )}

                 {/* Tool: Voucher Form */}
                {activeTool === 'voucher' && (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Kupon Başlığı</label>
                                <input id="vTitle" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Örn: Happy Hour İndirimi" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Kod</label>
                                    <input id="vCode" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono outline-none" placeholder="NEON20" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">İndirim Tutarı</label>
                                    <input id="vDisc" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" placeholder="%20" />
                                </div>
                            </div>
                        </div>
                        <button 
                             onClick={() => {
                                const t = (document.getElementById('vTitle') as HTMLInputElement).value;
                                const c = (document.getElementById('vCode') as HTMLInputElement).value;
                                const d = (document.getElementById('vDisc') as HTMLInputElement).value;
                                if(t && c && d) handleCreateVoucher(t, c, d);
                            }}
                            className="w-full bg-pink-600 text-white py-3.5 rounded-xl font-bold hover:bg-pink-700 transition-transform active:scale-[0.98]"
                        >
                            Dağıt
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`bg-white p-4 border-t border-slate-200 flex items-end gap-3 z-20 transition-all ${activeTool ? 'blur-sm pointer-events-none' : ''}`}>
            <div className="relative" ref={toolsMenuRef}>
                 {/* Trigger Button */}
                <button 
                    onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                    className={`p-3 text-white bg-slate-900 rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center ${isToolsMenuOpen ? 'bg-slate-800 rotate-45' : ''}`}
                >
                    <PlusIcon />
                </button>

                {/* Tools Menu Popover */}
                {isToolsMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-4 w-56 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 animate-in fade-in slide-in-from-bottom-4 origin-bottom-left z-50">
                        <div className="flex flex-col gap-1">
                            <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Etkileşim Araçları</p>
                            <button onClick={() => openTool('announcement')} className="text-left px-3 py-2.5 hover:bg-amber-50 rounded-xl text-sm text-slate-700 flex items-center gap-3 transition-colors">
                                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><Megaphone size={16}/></div> Duyuru
                            </button>
                            <button onClick={() => openTool('poll')} className="text-left px-3 py-2.5 hover:bg-brand-50 rounded-xl text-sm text-slate-700 flex items-center gap-3 transition-colors">
                                <div className="p-1.5 bg-brand-100 text-brand-600 rounded-lg"><BarChart2 size={16}/></div> Anket
                            </button>
                            <button onClick={() => openTool('quiz')} className="text-left px-3 py-2.5 hover:bg-violet-50 rounded-xl text-sm text-slate-700 flex items-center gap-3 transition-colors">
                                <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg"><BrainCircuit size={16}/></div> Yarışma
                            </button>
                            <button onClick={() => openTool('voucher')} className="text-left px-3 py-2.5 hover:bg-pink-50 rounded-xl text-sm text-slate-700 flex items-center gap-3 transition-colors">
                                <div className="p-1.5 bg-pink-100 text-pink-600 rounded-lg"><Gift size={16}/></div> Hediye
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 relative">
                <textarea 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Mesajınızı yazın..." 
                    rows={1}
                    className="w-full bg-slate-100 border-0 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all resize-none max-h-32 min-h-[48px]"
                />
            </div>

            <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="p-3 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/30 active:scale-95"
            >
                <Send size={20} className={inputValue.trim() ? 'ml-0.5' : ''} />
            </button>
        </div>
        
        {/* Backdrop for Tools */}
        {activeTool && (
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20 animate-in fade-in duration-300"
                onClick={() => setActiveTool(null)}
            ></div>
        )}
    </div>
  );
};

// Helper Icon
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

export default ChatDetail;