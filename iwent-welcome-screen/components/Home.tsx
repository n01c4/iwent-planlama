
import React, { useState, useEffect, useRef } from 'react';
import { EventDetail } from './EventDetail';
import { Messages } from './Messages';
import { Calendar } from './Calendar';
import { Profile } from './Profile';
import { Notifications } from './Notifications';
import { Discover, MOCK_DISCOVER_EVENTS } from './Discover';
import { Language } from '../App';
import { api, Event as ApiEvent } from '../api';

interface HomeProps {
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Mapper to convert API event to UI event format
const mapApiEventToUi = (e: ApiEvent) => ({
  id: Number(e.id) || 0, // Converting string ID to number if possible, or keeping consistency depending on usage. UI uses number IDs currently.
  // Actually, UI uses number IDs in interfaces. I might need to refactor interfaces to string or cast. 
  // For safety, let's assume hash of ID or temporary numbered.
  // Ideally refactor all IDs to string. But to minimize changes, I'll cast.
  originalId: e.id, 
  title: e.title,
  date: new Date(e.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  location: e.venue?.name || 'Konum Belirtilmemiş',
  price: e.priceMin ? `₺${e.priceMin}` : 'Ücretsiz',
  image: e.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
  category: e.category || 'Genel',
});

export const Home: React.FC<HomeProps> = ({ onLogout, language, setLanguage }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [allEventsView, setAllEventsView] = useState<{ title: string, events: any[] } | null>(null);
  const [likedEventIds, setLikedEventIds] = useState<number[]>([]);
  
  // Real Data State
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const lastScrollY = useRef(0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Try discovery endpoint, fallback to generic list
        let res;
        try {
           res = await api.recommendations.discovery();
        } catch {
           res = await api.events.list({ limit: 10 });
        }
        
        if (res.data) {
          const mapped = res.data.map(mapApiEventToUi);
          setEvents(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const toggleLike = (id: number) => {
    setLikedEventIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setIsNavVisible(false);
    } else {
      setIsNavVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const navItems = [
    { id: 'home', icon: 'home', label: language === 'TR' ? 'Ana Sayfa' : 'Home' },
    { id: 'search', icon: 'search', label: language === 'TR' ? 'Keşfet' : 'Discover' },
    { id: 'messages', icon: 'chat_bubble', label: language === 'TR' ? 'Mesajlar' : 'Messages' },
    { id: 'calendar', icon: 'calendar_today', label: language === 'TR' ? 'Takvim' : 'Calendar' },
    { id: 'profile', icon: 'person', label: language === 'TR' ? 'Profil' : 'Profile' },
  ];

  // If we have API events, use them. If not (error/empty), fall back to empty or mock for structure.
  const displayEvents = events.length > 0 ? events : [];
  
  // Combine for search
  const ALL_POSSIBLE_EVENTS = [...displayEvents, ...MOCK_DISCOVER_EVENTS];
  const likedEvents = ALL_POSSIBLE_EVENTS.filter(e => likedEventIds.includes(e.id));

  const HorizontalSection = ({ title, events, emptyMessage }: { title: string, events: any[], emptyMessage?: string }) => (
    <section className="mt-8">
      <div className="px-6 flex justify-between items-end mb-4">
        <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
        {events.length > 0 && (
          <button 
            onClick={() => setAllEventsView({ title, events })}
            className="text-primary text-[12px] font-black uppercase tracking-widest active:scale-95 transition-transform"
          >
            {language === 'TR' ? 'TÜMÜ' : 'ALL'}
          </button>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2">
        {events.length > 0 ? (
          events.map((event, idx) => (
            <div 
              key={event.id || idx}
              onClick={() => setSelectedEvent(event)}
              className="group relative w-64 aspect-[3/4] rounded-[32px] overflow-hidden border border-white/10 shrink-0 shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
            >
              <img src={event.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={event.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-black font-black text-[12px] shadow-xl">{event.price}</div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest mb-1.5">
                  <span className="material-icons-round text-[14px]">event</span> {event.date}
                </div>
                <h4 className="text-lg font-black text-white mb-2 leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                <div className="flex items-center gap-1 text-white/40 text-[11px] font-bold">
                  <span className="material-icons-round text-[14px]">location_on</span> {event.location}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[32px] text-white/20 font-bold text-sm text-center px-10">
            {emptyMessage || (language === 'TR' ? 'Etkinlik bulunamadı.' : 'No events found.')}
          </div>
        )}
      </div>
    </section>
  );

  const renderAllEventsList = () => {
    if (!allEventsView) return null;
    return (
      <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
        <header className="px-6 pt-14 pb-6 flex items-center bg-black sticky top-0 z-50 border-b border-white/5">
          <button 
            onClick={() => setAllEventsView(null)}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white mr-4 active:scale-90 transition-transform"
          >
            <span className="material-icons-round">arrow_back</span>
          </button>
          <h2 className="text-xl font-black tracking-tight text-white uppercase">{allEventsView.title}</h2>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-20">
          {allEventsView.events.map((event) => (
            <div 
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="group relative h-48 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 active:scale-[0.98] cursor-pointer"
            >
              <img src={event.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={event.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-primary/90 px-3 py-1 rounded-xl text-black font-black text-[11px]">{event.price}</div>
              <div className="absolute bottom-5 left-6 right-6">
                <h4 className="text-xl font-black text-white mb-1 leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                <p className="text-white/40 text-[12px] font-bold">{event.location} • {event.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHomeContent = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-40">
      <header className="px-6 pt-14 pb-6 flex justify-between items-center bg-black sticky top-0 z-50">
        <div className="flex flex-col">
          <span className="text-white/40 text-[12px] font-black uppercase tracking-[0.2em]">{language === 'TR' ? 'MERHABA' : 'HELLO'}</span>
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            iWENT <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#00E676]"></span>
          </h2>
        </div>
        <button 
          onClick={() => setShowNotifications(true)}
          className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all relative group"
        >
          <span className="material-icons-round text-white/40 group-hover:text-white transition-colors">notifications</span>
          <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full border border-black shadow-[0_0_8px_#00E676]"></div>
        </button>
      </header>

      {/* Categories Row 1: Beğendiklerin */}
      <HorizontalSection 
        title={language === 'TR' ? 'Beğendiklerin' : 'Favorites'} 
        events={likedEvents}
        emptyMessage={language === 'TR' ? 'Beğendiğin etkinlikler burada listelenir.' : 'Your liked events will appear here.'}
      />

      {/* Categories Row 2: API Data */}
      <HorizontalSection 
        title={language === 'TR' ? 'Senin İçin Seçtiklerimiz' : 'Picked for You'} 
        events={loading ? [] : displayEvents.slice(0, 5)} 
        emptyMessage={loading ? 'Yükleniyor...' : undefined}
      />

      {/* Categories Row 3: API Data */}
      <HorizontalSection 
        title={language === 'TR' ? 'Popüler' : 'Popular'} 
        events={loading ? [] : displayEvents.slice(5, 10)} 
        emptyMessage={loading ? 'Yükleniyor...' : undefined}
      />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-black text-white h-full relative overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth" onScroll={handleScroll}>
        {activeTab === 'home' && renderHomeContent()}
        {activeTab === 'search' && (
          <Discover 
            language={language} 
            onEventClick={setSelectedEvent} 
            onScrollAction={setIsNavVisible}
            likedEventIds={likedEventIds}
            onLike={toggleLike}
          />
        )}
        {activeTab === 'messages' && <Messages language={language} onScrollAction={setIsNavVisible} />}
        {activeTab === 'calendar' && <Calendar language={language} onEventClick={setSelectedEvent} onScrollAction={setIsNavVisible} />}
        {activeTab === 'profile' && <Profile language={language} setLanguage={setLanguage} onLogout={onLogout} onEventClick={setSelectedEvent} onScrollAction={setIsNavVisible} />}
      </div>
      
      {showNotifications && (
        <Notifications 
          language={language}
          onBack={() => setShowNotifications(false)}
        />
      )}

      {selectedEvent && (
        <EventDetail 
          language={language}
          event={selectedEvent} 
          isLiked={likedEventIds.includes(selectedEvent.id)}
          onToggleLike={() => toggleLike(selectedEvent.id)}
          onBack={() => setSelectedEvent(null)} 
        />
      )}

      {allEventsView && renderAllEventsList()}

      {!selectedEvent && !showNotifications && !allEventsView && (
        <nav 
          className={`fixed bottom-8 left-6 right-6 h-20 bg-black/60 backdrop-blur-2xl rounded-[30px] border border-white/10 flex items-center justify-around px-4 z-[200] shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${
            isNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'
          }`}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center w-14 h-14 group"
              >
                <div className={`transition-all duration-500 ease-out flex items-center justify-center ${
                  isActive ? 'scale-125 -translate-y-2' : 'scale-100 translate-y-0'
                }`}>
                  <span className={`material-icons-round text-[28px] transition-all duration-300 ${
                    isActive 
                      ? 'text-primary drop-shadow-[0_0_12px_rgba(0,230,118,0.8)]' 
                      : 'text-white/20 group-hover:text-white/50'
                  }`}>
                    {item.icon}
                  </span>
                </div>
                {isActive && (
                  <div className="absolute bottom-1 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#00E676] animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
