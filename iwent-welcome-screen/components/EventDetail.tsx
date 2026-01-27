
import React, { useState, useEffect } from 'react';
import { TicketSelection } from './TicketSelection';
import { Payment } from './Payment';
import { Language } from '../App';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: string;
  image: string;
  category?: string;
}

interface EventDetailProps {
  event: Event;
  isLiked: boolean;
  onToggleLike: () => void;
  onBack: () => void;
  language: Language;
}

export const EventDetail: React.FC<EventDetailProps> = ({ event, isLiked, onToggleLike, onBack, language }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showStickyButton, setShowStickyButton] = useState(true);
  const [showTicketSelection, setShowTicketSelection] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTicketData, setSelectedTicketData] = useState<{ amount: number, count: number } | null>(null);

  useEffect(() => {
    setIsVisible(true);
    const scrollContainer = document.querySelector('.event-detail-scroll');
    
    let lastScrollY = 0;
    const handleScroll = (e: any) => {
      const currentScrollY = e.target.scrollTop;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowStickyButton(false);
      } else {
        setShowStickyButton(true);
      }
      lastScrollY = currentScrollY;
    };

    scrollContainer?.addEventListener('scroll', handleScroll);
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, []);

  if (showPayment && selectedTicketData) {
    return (
      <Payment 
        language={language}
        totalAmount={selectedTicketData.amount}
        ticketCount={selectedTicketData.count}
        eventImage={event.image}
        onBack={() => setShowPayment(false)}
        onSuccess={() => onBack()}
      />
    );
  }

  if (showTicketSelection) {
    return (
      <TicketSelection 
        language={language}
        eventTitle={event.title} 
        onBack={() => setShowTicketSelection(false)} 
        onConfirm={(selection) => {
          const prices: Record<string, number> = { 'general': 450, 'vip': 1200, 'backstage': 2500 };
          let total = 0;
          let count = 0;
          Object.entries(selection).forEach(([id, qty]) => {
            const numQty = qty as number;
            total += (prices[id] || 0) * numQty;
            count += numQty;
          });
          
          setSelectedTicketData({ amount: total, count: count });
          setShowTicketSelection(false);
          setShowPayment(true);
        }}
      />
    );
  }

  return (
    <div className={`fixed inset-0 z-[1000] bg-black flex flex-col transition-all duration-500 ease-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex-1 overflow-y-auto no-scrollbar event-detail-scroll relative">
        <div className="fixed top-12 left-0 right-0 z-[1010] px-6 flex justify-between items-center pointer-events-none">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto border border-white/10 active:scale-90 transition-transform"
          >
            <span className="material-icons-round">arrow_back</span>
          </button>
          <div className="flex gap-3 pointer-events-auto">
            <button className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform">
              <span className="material-icons-round">share</span>
            </button>
            <button 
              onClick={onToggleLike}
              className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border transition-all active:scale-90 ${isLiked ? 'bg-primary border-primary text-black' : 'bg-black/30 border-white/10 text-white'}`}
            >
              <span className="material-icons-round">
                {isLiked ? 'favorite' : 'favorite_border'}
              </span>
            </button>
          </div>
        </div>

        <div className="relative h-[45vh] w-full">
          <img src={event.image} className="w-full h-full object-cover" alt={event.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        </div>

        <div className="px-6 -mt-12 relative z-10 pb-32">
          <div className="flex justify-between items-center mb-4">
            <div className="px-4 py-1.5 bg-primary text-black font-black text-[12px] uppercase tracking-wider rounded-full shadow-[0_0_15px_rgba(0,230,118,0.4)]">
              {event.category || (language === 'TR' ? 'Festival' : 'Festival')}
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md">
              <div className="flex -space-x-2">
                <img src="https://i.pravatar.cc/150?u=1" className="w-6 h-6 rounded-full border-2 border-black" />
                <img src="https://i.pravatar.cc/150?u=2" className="w-6 h-6 rounded-full border-2 border-black" />
                <img src="https://i.pravatar.cc/150?u=3" className="w-6 h-6 rounded-full border-2 border-black" />
              </div>
              <span className="text-[11px] font-bold text-white/60">{language === 'TR' ? '3 arkadaşın gidiyor' : '3 friends are going'}</span>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-2 leading-tight tracking-tighter">{event.title}</h1>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-primary text-xl font-black">{event.price}</span>
            <span className="text-white/30 text-sm font-bold">/ {language === 'TR' ? 'Kişi Başı' : 'Per Person'}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-6 mb-8">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                <span className="material-icons-round text-3xl">calendar_today</span>
              </div>
              <div>
                <p className="text-[12px] font-bold text-white/30 uppercase tracking-widest mb-1">{language === 'TR' ? 'Tarih' : 'Date'}</p>
                <h4 className="text-lg font-black text-white">{event.date}</h4>
                <p className="text-sm text-white/50 font-medium">{language === 'TR' ? 'Kapı Açılış' : 'Doors Open'}: 20:00</p>
              </div>
            </div>
            
            <div className="h-[1px] bg-white/5 w-full"></div>

            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                <span className="material-icons-round text-3xl">location_on</span>
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-bold text-white/30 uppercase tracking-widest mb-1">{language === 'TR' ? 'Konum' : 'Location'}</p>
                <h4 className="text-lg font-black text-white">{event.location}</h4>
                <button className="text-primary text-xs font-bold underline mt-1 decoration-primary/30 underline-offset-4">{language === 'TR' ? 'Yol Tarifi Al' : 'Get Directions'}</button>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-3">
              <span className="material-icons-round text-primary text-xl">info</span>
              <h3 className="text-xl font-black text-white">{language === 'TR' ? 'Etkinlik Hakkında' : 'About Event'}</h3>
            </div>
            <p className="text-white/60 leading-relaxed font-medium">
              {language === 'TR' 
                ? 'Bu etkinlik için detaylı açıklama yakında eklenecektir. Şehrin en popüler mekanlarından birinde gerçekleşecek bu organizasyon için biletlerinizi tükenmeden alın.' 
                : 'A detailed description for this event will be added soon. Get your tickets before they run out for this organization taking place in one of the most popular venues in the city.'}
            </p>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-10 left-6 right-6 z-[1050] transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${showStickyButton ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-32 opacity-0 scale-90'}`}>
        <button 
          onClick={() => setShowTicketSelection(true)}
          className="w-full h-20 bg-primary rounded-[28px] flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(0,230,118,0.5)] group overflow-hidden relative active:scale-95 transition-transform"
        >
          <span className="text-black font-black text-xl relative z-10">{language === 'TR' ? 'Bilet Al' : 'Buy Ticket'} • {event.price}</span>
          <span className="material-icons-round text-black relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
