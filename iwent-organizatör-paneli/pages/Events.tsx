import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventList from '../components/EventList';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useEvents } from '../context/EventContext';

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Etkinlik ara" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors">
            <Filter size={16} />
            Filtrele
          </button>
          <button className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors">
            <SlidersHorizontal size={16} />
            Sırala
          </button>
        </div>
      </div>

      <EventList events={filteredEvents} />
      
      <div className="flex justify-center mt-6">
        <p className="text-sm text-slate-400">Toplam {filteredEvents.length} etkinlik gösteriliyor</p>
      </div>
    </div>
  );
};

export default Events;