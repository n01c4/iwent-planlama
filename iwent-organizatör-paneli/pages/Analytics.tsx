import React, { useState, useMemo } from 'react';
import SalesChart from '../components/SalesChart';
import { MOCK_SALES_DATA } from '../constants';
import { useEvents } from '../context/EventContext';
import { ArrowUpRight, ArrowDownRight, Users, PieChart as PieChartIcon, MousePointerClick, ChevronDown, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Analytics: React.FC = () => {
  const { events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedEventLabel = selectedEventId === 'all' 
    ? 'Tüm Etkinlikler' 
    : events.find(e => e.id === selectedEventId)?.title;

  const currentEvent = events.find(e => e.id === selectedEventId);

  // Filtered Data Logic
  const stats = useMemo(() => {
    if (selectedEventId === 'all') {
      return {
        views: '124.5K',
        viewsTrend: 'up',
        viewsChange: '18.2',
        conversion: '4.8',
        conversionTrend: 'down',
        conversionChange: '1.2',
        newCustomers: '890',
        newCustomersTrend: 'up',
        newCustomersChange: '12.5'
      };
    }

    const seed = parseInt(selectedEventId) || selectedEventId.length;
    return {
      views: ((seed * 15.2) + 10).toFixed(1) + 'K',
      viewsTrend: seed % 2 === 0 ? 'up' : 'down',
      viewsChange: (seed * 2.5).toFixed(1),
      conversion: ((seed * 0.8) + 2).toFixed(1),
      conversionTrend: seed % 2 !== 0 ? 'up' : 'down',
      conversionChange: (seed * 0.4).toFixed(1),
      newCustomers: (seed * 120 + 50).toString(),
      newCustomersTrend: 'up',
      newCustomersChange: (seed * 3.2).toFixed(1)
    };
  }, [selectedEventId]);

  const salesData = useMemo(() => {
    if (selectedEventId === 'all') return MOCK_SALES_DATA;
    // Simple mock filter logic
    const factor = selectedEventId === '1' ? 0.6 : selectedEventId === '2' ? 0.3 : 0.15;
    return MOCK_SALES_DATA.map(d => ({
      ...d,
      amount: Math.round(d.amount * factor),
      tickets: Math.round(d.tickets * factor)
    }));
  }, [selectedEventId]);

  const pieData = useMemo(() => {
    if (selectedEventId === 'all') {
      return [
        { name: 'Genel Giriş', value: 2400 },
        { name: 'VIP', value: 456 },
        { name: 'Sahne Önü', value: 120 },
        { name: 'Öğrenci', value: 890 },
      ];
    }
    if (currentEvent && currentEvent.ticketTypes.length > 0) {
      return currentEvent.ticketTypes.map(t => ({ name: t.name, value: t.sold }));
    }
    return [{ name: 'Veri Yok', value: 1 }];
  }, [selectedEventId, currentEvent]);

  const genderData = useMemo(() => {
    if (selectedEventId === '1') return [{ name: 'Kadın', value: 62 }, { name: 'Erkek', value: 38 }];
    if (selectedEventId === '2') return [{ name: 'Kadın', value: 25 }, { name: 'Erkek', value: 75 }];
    return [{ name: 'Kadın', value: 55 }, { name: 'Erkek', value: 45 }];
  }, [selectedEventId]);

  const ageData = useMemo(() => {
    if (selectedEventId === '1') { // Younger audience for Neon Festival
       return [
        { name: '18-24', value: 55 },
        { name: '25-34', value: 30 },
        { name: '35-44', value: 10 },
        { name: '45+', value: 5 },
      ];
    }
    if (selectedEventId === '2') { // Tech summit - slightly older
       return [
        { name: '18-24', value: 15 },
        { name: '25-34', value: 45 },
        { name: '35-44', value: 30 },
        { name: '45+', value: 10 },
      ];
    }
    return [
      { name: '18-24', value: 35 },
      { name: '25-34', value: 42 },
      { name: '35-44', value: 15 },
      { name: '45+', value: 8 },
    ];
  }, [selectedEventId]);

  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];
  const GENDER_COLORS = ['#ec4899', '#3b82f6'];
  const AGE_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Analitik</h1>
            
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
          <p className="text-slate-500">Etkinlik performanslarını ve kitle demografisini detaylı incele.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm text-slate-500 font-medium">Toplam Görüntülenme</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.views}</h3>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <MousePointerClick size={20} />
                </div>
            </div>
            <div className={`flex items-center text-sm font-medium ${stats.viewsTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stats.viewsTrend === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                <span>%{stats.viewsChange}</span>
                <span className="text-slate-400 font-normal ml-1">geçen haftaya göre</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm text-slate-500 font-medium">Dönüşüm Oranı</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">%{stats.conversion}</h3>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <PieChartIcon size={20} />
                </div>
            </div>
            <div className={`flex items-center text-sm font-medium ${stats.conversionTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stats.conversionTrend === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                <span>%{stats.conversionChange}</span>
                <span className="text-slate-400 font-normal ml-1">geçen haftaya göre</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm text-slate-500 font-medium">Yeni Müşteriler</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">+{stats.newCustomers}</h3>
                </div>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Users size={20} />
                </div>
            </div>
            <div className={`flex items-center text-sm font-medium ${stats.newCustomersTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stats.newCustomersTrend === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                <span>%{stats.newCustomersChange}</span>
                <span className="text-slate-400 font-normal ml-1">geçen haftaya göre</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Satış Trendi</h3>
            <SalesChart data={salesData} />
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Bilet Türü Dağılımı</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Cinsiyet Dağılımı</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={genderData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {genderData.map((entry, index) => (
                                <Cell key={`cell-gender-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => `%${value}`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Yaş Dağılımı</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={ageData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} unit="%" />
                        <RechartsTooltip 
                            cursor={{fill: '#f8fafc'}} 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            formatter={(value) => [`%${value}`, 'Oran']}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                            {ageData.map((entry, index) => (
                                <Cell key={`cell-age-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;