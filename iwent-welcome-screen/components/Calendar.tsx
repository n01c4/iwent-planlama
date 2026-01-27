
import React, { useState, useRef, useEffect } from 'react';

interface CalendarEvent {
  id: number;
  title: string;
  time: string;
  location: string;
  category: string;
  image: string;
  date: string;
  price: string;
}

interface CalendarProps {
  onEventClick?: (event: any) => void;
  onScrollAction?: (visible: boolean) => void;
  language: any;
}

const MOCK_EVENTS: Record<string, CalendarEvent[]> = {
  "2026-01-02": [
    {
      id: 201,
      title: 'Yeni Yıl Jazz Brunch',
      time: '11:00',
      location: 'Soho House',
      category: 'EĞLENCE',
      image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800',
      date: '02 Oca, 11:00',
      price: '₺850'
    }
  ],
  "2026-01-05": [
    {
      id: 202,
      title: 'Dijital Sanat Sergisi',
      time: '10:00',
      location: 'Pera Müzesi',
      category: 'SERGİ',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800',
      date: '05 Oca, 10:00',
      price: '₺120'
    }
  ],
  "2026-01-08": [
    {
      id: 203,
      title: 'Kış Konserleri: Oda Müziği',
      time: '19:00',
      location: 'Zorlu PSM',
      category: 'KONSER',
      image: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=800',
      date: '08 Oca, 19:00',
      price: '₺450'
    }
  ],
  "2026-01-12": [
    {
      id: 101,
      title: 'Neon Beats: Rooftop Party',
      time: '21:00',
      location: '360 Istanbul',
      category: 'EĞLENCE',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
      date: '12 Oca, 21:00',
      price: '₺450'
    },
    {
      id: 104,
      title: 'Techno Basement Night',
      time: '23:30',
      location: 'Klein Phönix',
      category: 'EĞLENCE',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
      date: '12 Oca, 23:30',
      price: '₺550'
    }
  ],
  "2026-01-15": [
    {
      id: 102,
      title: 'Future Art Workshop',
      time: '14:00',
      location: 'Arter',
      category: 'WORKSHOP',
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
      date: '15 Oca, 14:00',
      price: '₺200'
    }
  ],
  "2026-01-20": [
    {
      id: 103,
      title: 'Jazz & Wine 2026',
      time: '19:30',
      location: 'Nardis Jazz Club',
      category: 'KONSER',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
      date: '20 Oca, 19:30',
      price: '₺350'
    }
  ]
};

const MONTH_NAMES = {
  TR: ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'],
  EN: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
};

export const Calendar: React.FC<CalendarProps> = ({ onEventClick, onScrollAction, language }) => {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 12));
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const daysContainerRef = useRef<HTMLDivElement>(null);

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  const daysInMonth = Array.from(
    { length: new Date(currentYear, currentMonth + 1, 0).getDate() },
    (_, i) => new Date(currentYear, currentMonth, i + 1)
  );

  const handleMonthChange = (increment: number) => {
    // Navigate to the first day of the next/prev month to avoid overflow issues
    const newDate = new Date(currentYear, currentMonth + increment, 1);
    setSelectedDate(newDate);
    
    // Reset scroll to beginning when changing month
    if (daysContainerRef.current) {
        daysContainerRef.current.scrollLeft = 0;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const st = e.currentTarget.scrollTop;
    if (Math.abs(st - lastScrollTop.current) < 5) return;

    if (st > lastScrollTop.current && st > 50) {
      setIsHeaderVisible(false);
      onScrollAction?.(false);
    } else {
      setIsHeaderVisible(true);
      onScrollAction?.(true);
    }
    lastScrollTop.current = st;
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const activeEvents = MOCK_EVENTS[formatDateKey(selectedDate)] || [];
  const monthName = language === 'TR' ? MONTH_NAMES.TR[currentMonth] : MONTH_NAMES.EN[currentMonth];

  return (
    <div className="flex-1 flex flex-col bg-black h-full overflow-hidden relative font-display">
      {/* Date Picker Header */}
      <div 
        className={`bg-black/95 backdrop-blur-2xl z-50 transition-all duration-500 shrink-0 ${
          isHeaderVisible ? 'translate-y-0 opacity-100 pt-10 pb-4' : '-translate-y-full opacity-0 h-0 overflow-hidden'
        }`}
      >
        <div className="px-6 mb-8 flex justify-between items-center mt-4">
          <button 
            onClick={() => handleMonthChange(-1)}
            className="text-white/20 hover:text-white transition-colors active:scale-75 p-2"
          >
            <span className="material-icons-round">chevron_left</span>
          </button>
          <h2 className="text-[16px] font-black tracking-[0.2em] text-white uppercase">{monthName} {currentYear}</h2>
          <button 
            onClick={() => handleMonthChange(1)}
            className="text-white/20 hover:text-white transition-colors active:scale-75 p-2"
          >
            <span className="material-icons-round">chevron_right</span>
          </button>
        </div>

        <div 
            ref={daysContainerRef}
            className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2 snap-x snap-mandatory"
        >
          {daysInMonth.map((date) => {
            const isSelected = date.getDate() === selectedDate.getDate();
            const locale = language === 'TR' ? 'tr-TR' : 'en-US';
            const dayName = date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
            const dateKey = formatDateKey(date);
            const hasEvent = !!MOCK_EVENTS[dateKey];

            return (
              <div 
                key={date.getTime()}
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0 snap-center"
              >
                <span className={`text-[8px] font-black tracking-widest transition-colors ${isSelected ? 'text-primary' : 'text-white/20'}`}>
                  {dayName}
                </span>
                <div className={`
                  w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative border-2
                  ${isSelected ? 'bg-primary border-primary text-black shadow-[0_0_20px_rgba(0,230,118,0.4)]' : 'bg-white/[0.03] border-white/5 text-white/50 group-hover:border-white/20'}
                `}>
                  <span className="text-[15px] font-black tracking-tighter leading-none">{date.getDate()}</span>
                  {hasEvent && !isSelected && (
                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_#00E676]"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-40"
        onScroll={handleScroll}
      >
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeEvents.length > 0 ? (
            activeEvents.map(event => (
              <div 
                key={event.id} 
                onClick={() => onEventClick?.(event)}
                className="group relative bg-[#0d0d0d] border border-white/5 rounded-[28px] flex items-center overflow-hidden transition-all active:scale-[0.98] cursor-pointer shadow-2xl p-2.5 h-[120px]"
              >
                {/* Large Event Image (Afiş) */}
                <div className="w-[100px] h-full shrink-0 relative rounded-[22px] overflow-hidden">
                  <img src={event.image} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" alt={event.title} />
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
                
                {/* Information Area - Reduced Space, High Contrast */}
                <div className="flex-1 min-w-0 pl-4 py-1 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start">
                      <p className="text-primary text-[8px] font-black uppercase tracking-[0.2em] mb-1">{event.category}</p>
                      <span className="material-icons-round text-white/10 text-[18px]">chevron_right</span>
                    </div>
                    <h4 className="text-white text-[14px] font-black truncate tracking-tight leading-tight group-hover:text-primary transition-colors pr-4">{event.title}</h4>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold">
                      <span className="material-icons-round text-[13px] text-white/20">schedule</span>
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold">
                      <span className="material-icons-round text-[13px] text-white/20">location_on</span>
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-32 opacity-10">
              <span className="material-icons-round text-7xl mb-4">event_busy</span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                {language === 'TR' ? 'BU TARİHTE ETKİNLİK YOK' : 'NO EVENTS ON THIS DATE'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Shadow Overlays */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent pointer-events-none z-10"></div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10"></div>
    </div>
  );
};
