
import React, { useState, useEffect, useRef } from 'react';
import { ChatItem } from './Messages';
import { ChatInfo } from './ChatInfo';

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

interface ChatDetailProps {
  chat: ChatItem;
  onBack: () => void;
}

export const ChatDetail: React.FC<ChatDetailProps> = ({ chat, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Selam!', sender: 'them', time: '12:20' },
    { id: 2, text: 'Naber, biletleri alabildin mi? Çok az kalmış diyorlar.', sender: 'them', time: '12:22' },
    { id: 3, text: 'Selam Zeynep, henüz almadım ama şimdi bakıyorum.', sender: 'me', time: '12:25' },
    { id: 4, text: 'Acele etsen iyi olur, grup dolmak üzere.', sender: 'them', time: '12:26' },
    { id: 5, text: chat.lastMessage, sender: 'them', time: chat.time }
  ]);
  const [inputText, setInputText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'me',
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  if (showInfo) {
    return <ChatInfo chat={chat} onBack={() => setShowInfo(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 font-display">
      {/* Header */}
      <header className="px-6 pt-14 pb-5 bg-black/95 backdrop-blur-3xl border-b border-white/10 flex items-center gap-4 z-10 shrink-0">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white transition-all active:scale-90"
        >
          <span className="material-icons-round text-2xl">arrow_back</span>
        </button>
        
        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setShowInfo(true)}>
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
              <img src={chat.avatar} className="w-full h-full object-cover" alt={chat.name} />
            </div>
            {chat.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-[3px] border-black"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] font-black text-white truncate leading-tight tracking-tighter">{chat.name}</h2>
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] leading-none mt-1">
              {chat.isTyping ? 'Yazıyor...' : 'Çevrimiçi'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowInfo(true)}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          <span className="material-icons-round text-2xl">more_vert</span>
        </button>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-40"
      >
        <div className="text-center py-4">
          <span className="px-5 py-2 bg-white/5 rounded-full text-[11px] font-black text-white/40 uppercase tracking-[0.25em]">BUGÜN</span>
        </div>

        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[90%] ${msg.sender === 'me' ? 'ml-auto' : 'mr-auto'}`}
          >
            <div 
              className={`px-6 py-4 rounded-[30px] border-2 shadow-xl ${
                msg.sender === 'me' 
                  ? 'bg-primary text-black border-primary font-black rounded-tr-lg' 
                  : 'bg-white/[0.1] text-white border-white/5 font-bold rounded-tl-lg'
              } text-[16px] leading-relaxed tracking-tight`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] font-black text-white/30 mt-2 px-3 uppercase tracking-tighter">{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-12 left-6 right-6 z-20">
        <div className="bg-white/[0.08] backdrop-blur-3xl border-2 border-white/10 rounded-[36px] p-2 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-primary transition-colors">
            <span className="material-icons-round">attach_file</span>
          </button>
          
          <input 
            type="text" 
            placeholder="Mesaj yaz..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-transparent border-none text-white placeholder-white/30 font-bold text-[17px] py-3 focus:outline-none"
          />

          <button 
            onClick={handleSendMessage}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-400 ${
              inputText.trim() 
                ? 'bg-primary text-black shadow-[0_0_20px_rgba(0,230,118,0.5)] scale-110' 
                : 'bg-white/10 text-white/30'
            }`}
          >
            <span className="material-icons-round text-[26px]">{inputText.trim() ? 'send' : 'mic'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
