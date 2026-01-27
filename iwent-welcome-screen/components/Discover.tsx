
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Language } from '../App';

interface DiscoverProps {
  language: Language;
  onEventClick: (event: any) => void;
  onScrollAction?: (visible: boolean) => void;
  likedEventIds?: number[];
  onLike?: (id: number) => void;
}

const CATEGORIES = [
  { id: 'all', tr: 'Tümü', en: 'All', icon: 'apps' },
  { id: 'concert', tr: 'Konser', en: 'Concert', icon: 'music_note' },
  { id: 'party', tr: 'Parti', en: 'Party', icon: 'celebration' },
  { id: 'theatre', tr: 'Tiyatro', en: 'Theatre', icon: 'theater_comedy' },
  { id: 'expo', tr: 'Sergi', en: 'Expo', icon: 'palette' },
];

export const MOCK_DISCOVER_EVENTS = [
  {
    id: 10,
    title: 'Techno Sunday: Berlin Echo',
    date: '12 Tem, 22:00',
    location: 'Klein Phönix',
    price: '₺500',
    image: 'https://images.unsplash.com/photo-1574391884720-bbe374025828?auto=format&fit=crop&q=80&w=600',
    category: 'Eğlence'
  },
  {
    id: 11,
    title: 'Modern Art Workshop',
    date: '14 Tem, 14:00',
    location: 'Arter Istanbul',
    price: '₺250',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
    category: 'Sanat'
  },
  {
    id: 12,
    title: 'Rooftop Jazz Session',
    date: '18 Tem, 20:30',
    location: 'Soho House',
    price: '₺400',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
    category: 'Müzik'
  },
  {
    id: 13,
    title: 'Summer Solstice Rave',
    date: '21 Haz, 23:00',
    location: 'Volkswagen Arena',
    price: '₺650',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600',
    category: 'Eğlence'
  },
  {
    id: 14,
    title: 'Deep House Sunset',
    date: '25 Haz, 18:00',
    location: 'Kilyos Beach',
    price: '₺350',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=600',
    category: 'Parti'
  }
];

export const Discover: React.FC<DiscoverProps> = ({ language, onEventClick, onScrollAction, likedEventIds = [], onLike }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'swiper'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const lastScrollY = useRef(0);

  // Tinder Swiper States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0, rotate: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Filter States
  const [priceRange, setPriceRange] = useState(1000);
  const [distanceRange, setDistanceRange] = useState(25);
  const [selectedDate, setSelectedDate] = useState('any');

  useEffect(() => {
    if (showFilters) {
      onScrollAction?.(false);
    } else {
      onScrollAction?.(true);
    }
  }, [showFilters, onScrollAction]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (viewMode === 'swiper') return;
    const currentScrollY = e.currentTarget.scrollTop;
    
    if (Math.abs(currentScrollY - lastScrollY.current) < 5) return;

    if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
      onScrollAction?.(false);
    } else {
      onScrollAction?.(true);
    }
    lastScrollY.current = currentScrollY;
  };

  // Swiper Logic
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY };
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setSwipeOffset({ x: dx, y: dy, rotate: dx * 0.1 });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (Math.abs(swipeOffset.x) > threshold) {
      // Complete swipe
      const direction = swipeOffset.x > 0 ? 1 : -1;
      const swipedEvent = MOCK_DISCOVER_EVENTS[currentIndex];
      
      if (direction === 1) {
        // Liked!
        if (onLike && !likedEventIds.includes(swipedEvent.id)) {
          onLike(swipedEvent.id);
        }
      }

      setSwipeOffset(prev => ({ ...prev, x: direction * 500 }));
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % MOCK_DISCOVER_EVENTS.length);
        setSwipeOffset({ x: 0, y: 0, rotate: 0 });
      }, 200);
    } else {
      // Snap back
      setSwipeOffset({ x: 0, y: 0, rotate: 0 });
    }
  };

  const manualSwipe = (direction: 'left' | 'right') => {
    const swipedEvent = MOCK_DISCOVER_EVENTS[currentIndex];
    if (direction === 'right') {
      if (onLike && !likedEventIds.includes(swipedEvent.id)) {
        onLike(swipedEvent.id);
      }
    }

    setSwipeOffset({ x: direction === 'right' ? 500 : -500, y: 0, rotate: direction === 'right' ? 20 : -20 });
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % MOCK_DISCOVER_EVENTS.length);
      setSwipeOffset({ x: 0, y: 0, rotate: 0 });
    }, 200);
  };

  const currentEvent = MOCK_DISCOVER_EVENTS[currentIndex];
  const nextEvent = MOCK_DISCOVER_EVENTS[(currentIndex + 1) % MOCK_DISCOVER_EVENTS.length];

  return (
    <div className="flex-1 flex flex-col bg-black h-full animate-in fade-in duration-500 font-display relative z-10 overflow-hidden">
      <header className="px-6 pt-14 pb-4 sticky top-0 bg-black/95 backdrop-blur-3xl z-40 border-b border-white/5">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 group">
            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder={language === 'TR' ? "Etkinlik ara..." : "Search events..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-primary/40 transition-all font-bold text-sm"
            />
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'swiper' : 'grid')}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${viewMode === 'swiper' ? 'bg-primary text-black' : 'bg-white/5 text-white/40 border border-white/10'}`}
          >
            <span className="material-icons-round">{viewMode === 'grid' ? 'style' : 'grid_view'}</span>
          </button>
          <button 
            onClick={() => setShowFilters(true)}
            className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform relative"
          >
            <span className="material-icons-round">tune</span>
            {showFilters && <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#00E676]"></div>}
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-black text-[13px] whitespace-nowrap border-2 transition-all duration-300 uppercase tracking-tighter ${
                activeCategory === cat.id 
                  ? 'bg-primary text-black border-primary shadow-[0_4px_16px_rgba(0,230,118,0.2)]' 
                  : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/20'
              }`}
            >
              <span className="material-icons-round text-[18px]">{cat.icon}</span>
              {language === 'TR' ? cat.tr : cat.en}
            </button>
          ))}
        </div>
      </header>

      {viewMode === 'grid' ? (
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-40" onScroll={handleScroll}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black tracking-tight">{language === 'TR' ? 'Sizin İçin Keşfettik' : 'Discovered for You'}</h3>
            <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">{MOCK_DISCOVER_EVENTS.length} SONUÇ</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {MOCK_DISCOVER_EVENTS.map(event => (
              <div 
                key={event.id}
                onClick={() => onEventClick(event)}
                className="group relative h-56 rounded-[32px] overflow-hidden border border-white/10 active:scale-[0.98] transition-all cursor-pointer shadow-2xl"
              >
                <img src={event.image} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" alt={event.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest">
                    {event.category}
                  </span>
                  {likedEventIds.includes(event.id) && (
                    <span className="bg-primary/20 backdrop-blur-md border border-primary/40 px-3 py-1.5 rounded-xl text-[10px] font-black text-primary">
                      <span className="material-icons-round text-[12px]">favorite</span>
                    </span>
                  )}
                </div>

                <div className="absolute bottom-5 left-6 right-6">
                  <h4 className="text-xl font-black text-white mb-1 group-hover:text-primary transition-colors leading-tight">{event.title}</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-white/50 text-xs font-bold">{event.location} • {event.date}</p>
                    <span className="text-white font-black">{event.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative select-none">
          <div className="w-full max-w-sm aspect-[3/4] relative z-10">
            <div className="absolute inset-0 rounded-[40px] overflow-hidden border border-white/10 bg-white/5 scale-95 translate-y-4 opacity-50 blur-[2px]">
              <img src={nextEvent.image} className="w-full h-full object-cover grayscale" />
            </div>

            <div 
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              style={{
                transform: `translate(${swipeOffset.x}px, ${swipeOffset.y}px) rotate(${swipeOffset.rotate}deg)`,
                transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              className="absolute inset-0 rounded-[40px] overflow-hidden border border-white/15 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 group"
            >
              <img src={currentEvent.image} className="w-full h-full object-cover pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>
              
              <div 
                style={{ opacity: Math.max(0, swipeOffset.x / 100) }}
                className="absolute top-10 left-10 border-4 border-primary text-primary px-6 py-2 rounded-2xl font-black text-3xl -rotate-12 transition-opacity pointer-events-none"
              >
                {language === 'TR' ? 'BEĞENDİM' : 'LIKE'}
              </div>
              <div 
                style={{ opacity: Math.max(0, -swipeOffset.x / 100) }}
                className="absolute top-10 right-10 border-4 border-red-500 text-red-500 px-6 py-2 rounded-2xl font-black text-3xl rotate-12 transition-opacity pointer-events-none"
              >
                {language === 'TR' ? 'GEÇ' : 'NOPE'}
              </div>

              <div className="absolute bottom-10 left-8 right-8 pointer-events-none">
                <div className="flex items-center gap-2 mb-3">
                   <span className="bg-primary/20 backdrop-blur-md text-primary border border-primary/20 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest">{currentEvent.category}</span>
                   <span className="bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[11px] font-black">{currentEvent.price}</span>
                </div>
                <h3 className="text-3xl font-black text-white leading-tight mb-2 tracking-tight">{currentEvent.title}</h3>
                <div className="flex items-center gap-4 text-white/50 text-sm font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons-round text-lg">event</span>
                    {currentEvent.date}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons-round text-lg">location_on</span>
                    {currentEvent.location}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-12 z-30">
            <button 
              onClick={() => manualSwipe('left')}
              className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-red-500 shadow-xl active:scale-90 transition-transform"
            >
              <span className="material-icons-round text-3xl">close</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 active:scale-90 transition-transform">
              <span className="material-icons-round text-2xl">star</span>
            </button>
            <button 
              onClick={() => manualSwipe('right')}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all ${likedEventIds.includes(currentEvent.id) ? 'bg-primary text-black' : 'bg-white/5 border border-white/10 text-primary'}`}
            >
              <span className="material-icons-round text-3xl">favorite</span>
            </button>
          </div>
        </div>
      )}

      {showFilters && createPortal(
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-[#0a0a0a] border-t border-white/15 rounded-t-[40px] flex flex-col h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative">
            
            {/* Header */}
            <div className="px-8 pt-8 pb-4 shrink-0">
               <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black tracking-tight">{language === 'TR' ? 'Filtrele' : 'Filters'}</h2>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/40 border border-white/5 active:scale-90 transition-transform"
                  >
                    <span className="material-icons-round">close</span>
                  </button>
               </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-32">
              <div className="space-y-12 pt-4">
                <div>
                  <h4 className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 ml-1">{language === 'TR' ? 'ZAMAN' : 'TIME'}</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Tümü', 'Bugün', 'Yarın', 'Bu Hafta Sonu'].map(d => (
                      <button 
                        key={d} 
                        onClick={() => setSelectedDate(d)}
                        className={`px-6 py-3 rounded-2xl text-[13px] font-bold border transition-all ${selectedDate === d ? 'bg-primary text-black border-primary shadow-[0_4px_12px_rgba(0,230,118,0.2)]' : 'bg-white/5 text-white/40 border-white/5'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4 ml-1">
                    <h4 className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">{language === 'TR' ? 'FİYAT ARALIĞI' : 'PRICE RANGE'}</h4>
                    <span className="text-primary font-black">₺{priceRange} +</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10000" 
                    step="100"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4 ml-1">
                    <h4 className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">{language === 'TR' ? 'MESAFE' : 'DISTANCE'}</h4>
                    <span className="text-primary font-black">{distanceRange} km +</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={distanceRange}
                    onChange={(e) => setDistanceRange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>

            {/* Fixed Footer Buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent z-10">
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setPriceRange(1000);
                    setDistanceRange(25);
                    setSelectedDate('any');
                  }}
                  className="flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl text-white/40 font-black uppercase tracking-widest text-xs active:scale-95 transition-transform hover:bg-white/10 hover:text-white"
                >
                  {language === 'TR' ? 'TEMİZLE' : 'RESET'}
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-[2] h-16 bg-primary rounded-2xl text-black font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(0,230,118,0.3)] active:scale-95 transition-transform hover:brightness-110"
                >
                  {language === 'TR' ? 'UYGULA' : 'APPLY'}
                </button>
              </div>
            </div>
            
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
