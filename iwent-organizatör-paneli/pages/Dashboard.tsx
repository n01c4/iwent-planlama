import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Ticket, Calendar, TrendingUp, Plus, ChevronDown, Check } from 'lucide-react';
import StatCard from '../components/StatCard';
import SalesChart from '../components/SalesChart';
import EventList from '../components/EventList';
import { MOCK_STATS, MOCK_SALES_DATA } from '../constants';
import { useEvents } from '../context/EventContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedEventLabel = selectedEventId === 'all' 
    ? 'Tüm Etkinlikler' 
    : events.find(e => e.id === selectedEventId)?.title;

  // Filter stats based on selection
  const dashboardStats = useMemo(() => {
    if (selectedEventId === 'all') {
        // Recalculate stats based on current events
        const totalRevenue = events.reduce((acc, e) => acc + e.revenue, 0);
        const ticketsSold = events.reduce((acc, e) => acc + e.ticketTypes.reduce((tAcc, t) => tAcc + t.sold, 0), 0);
        const activeEvents = events.filter(e => e.status === 'Yayında' || e.status === 'Taslak').length; // Simplification
        const avgTicketPrice = ticketsSold > 0 ? Math.round(totalRevenue / ticketsSold) : 0;

        return {
            totalRevenue,
            ticketsSold,
            activeEvents: events.length,
            avgTicketPrice
        };
    }
    
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return MOCK_STATS;

    const totalSold = event.ticketTypes.reduce((acc, t) => acc + t.sold, 0);
    const avgPrice = totalSold > 0 ? Math.round(event.revenue / totalSold) : 0;

    return {
      totalRevenue: event.revenue,
      ticketsSold: totalSold,
      activeEvents: 1, // Only 1 event selected
      avgTicketPrice: avgPrice
    };
  }, [selectedEventId, events]);

  // Simulate filtered sales data
  const salesData = useMemo(() => {
    if (selectedEventId === 'all') return MOCK_SALES_DATA;
    
    // Simulate data subset for a specific event to show visual feedback
    const factor = selectedEventId === '1' ? 0.6 : selectedEventId === '2' ? 0.3 : 0.15;
    return MOCK_SALES_DATA.map(d => ({
      ...d,
      amount: Math.round(d.amount * factor),
      tickets: Math.round(d.tickets * factor)
    }));
  }, [selectedEventId]);

  // Filter events list
  const displayedEvents = useMemo(() => {
    if (selectedEventId === 'all') return events.slice(0, 5); // Show first 5
    return events.filter(e => e.id === selectedEventId);
  }, [selectedEventId, events]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Panel Özeti</h1>
            
            <div className="relative">
                <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${isDropdownOpen ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                    <span className="max-w-[180px] truncate">{selectedEventLabel}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-brand-500' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-1 max-h-[300px] overflow-y-auto">
                                <button 
                                    onClick={() => { setSelectedEventId('all'); setIsDropdownOpen(false); }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedEventId === 'all' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    Tüm Etkinlikler
                                    {selectedEventId === 'all' && <Check size={16} className="text-brand-600"/>}
                                </button>
                                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                <div className="space-y-0.5">
                                    <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Etkinlikler</p>
                                    {events.map(event => (
                                        <button 
                                            key={event.id}
                                            onClick={() => { setSelectedEventId(event.id); setIsDropdownOpen(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors group ${selectedEventId === event.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <span className="truncate">{event.title}</span>
                                            {selectedEventId === event.id && <Check size={16} className="text-brand-600"/>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
          </div>
          <p className="text-slate-500">Hoş geldin Emre, bugün etkinliklerin harika gidiyor.</p>
        </div>
        
        <button 
          onClick={() => navigate('/events/new')}
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Yeni Etkinlik
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Toplam Gelir" 
          value={new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(dashboardStats.totalRevenue)} 
          change="%12.5 artış" 
          trend="up" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Satılan Bilet" 
          value={dashboardStats.ticketsSold.toString()} 
          change="%8.2 artış" 
          trend="up" 
          icon={Ticket} 
        />
        <StatCard 
          title="Aktif Etkinlikler" 
          value={dashboardStats.activeEvents.toString()} 
          change="Değişim yok" 
          trend="neutral" 
          icon={Calendar} 
        />
        <StatCard 
          title="Ort. Bilet Fiyatı" 
          value={new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(dashboardStats.avgTicketPrice)} 
          change="%2.1 düşüş" 
          trend="down" 
          icon={TrendingUp} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Satış Analizi</h2>
                <p className="text-sm text-slate-500">Son 30 günlük gelir grafiği</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none">
                <option>Son 30 Gün</option>
                <option>Son 7 Gün</option>
                <option>Bu Yıl</option>
            </select>
          </div>
          <SalesChart data={salesData} />
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-brand-900 rounded-xl p-6 text-white relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-brand-500/20 blur-2xl"></div>
           
           <div className="relative z-10 h-full flex flex-col justify-between">
             <div>
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm mb-4">
                    PRO İpucu
                </span>
                <h3 className="text-xl font-bold mb-2">Bilet Satışlarını Artır</h3>
                <p className="text-brand-100 text-sm leading-relaxed mb-6">
                    Erken dönem biletlerinde %10 indirim yaparak satışları hızlandırabilirsin.
                    Geçmiş verilerine göre Cuma günleri kampanya yapmak dönüşümü %24 artırıyor.
                </p>
             </div>
             <button className="w-full bg-white text-brand-900 py-3 rounded-lg font-semibold hover:bg-brand-50 transition-colors">
                Kampanya Oluştur
             </button>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
                {selectedEventId === 'all' ? 'Son Etkinlikler' : 'Etkinlik Detayı'}
            </h2>
            {selectedEventId === 'all' && (
                <button className="text-sm text-brand-600 font-medium hover:text-brand-700 hover:underline">Tümünü Gör</button>
            )}
        </div>
        <EventList events={displayedEvents} />
      </div>
    </div>
  );
};

export default Dashboard;