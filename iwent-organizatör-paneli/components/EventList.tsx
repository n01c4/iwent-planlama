import React, { useState, useEffect, useRef } from 'react';
import { Event, EventStatus } from '../types';
import { Calendar, MapPin, MoreHorizontal, Users, DollarSign, Edit, Download, Trash2, PauseCircle, PlayCircle, FileText } from 'lucide-react';

interface EventListProps {
  events: Event[];
}

const statusColors: Record<EventStatus, string> = {
  [EventStatus.PUBLISHED]: 'bg-green-100 text-green-700 border-green-200',
  [EventStatus.DRAFT]: 'bg-slate-100 text-slate-600 border-slate-200',
  [EventStatus.SOLD_OUT]: 'bg-purple-100 text-purple-700 border-purple-200',
  [EventStatus.ENDED]: 'bg-gray-100 text-gray-500 border-gray-200',
  [EventStatus.CANCELLED]: 'bg-red-100 text-red-700 border-red-200',
};

const EventList: React.FC<EventListProps> = ({ events }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action: string, event: Event) => {
    console.log(`Action: ${action} on event: ${event.title}`);
    // Here you would implement the actual logic, e.g., navigation or API calls
    setOpenMenuId(null);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white min-h-[400px]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
            <th className="py-4 px-6">Etkinlik</th>
            <th className="py-4 px-6">Tarih & Yer</th>
            <th className="py-4 px-6">Bilet Satışı</th>
            <th className="py-4 px-6">Gelir</th>
            <th className="py-4 px-6">Durum</th>
            <th className="py-4 px-6 text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-slate-50/80 transition-colors group">
              <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{event.title}</h4>
                    <span className="text-xs text-slate-500">ID: #{event.id}</span>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={12} className="text-slate-400" />
                    {event.location}
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Users size={14} className="text-slate-400" />
                    <span>
                        {event.ticketTypes.reduce((acc, t) => acc + t.sold, 0)} / 
                        <span className="text-slate-400 ml-1">
                            {event.ticketTypes.length > 0 ? event.ticketTypes.reduce((acc, t) => acc + t.quota, 0) : '-'}
                        </span>
                    </span>
                </div>
                {event.ticketTypes.length > 0 && (
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div 
                            className="h-full bg-brand-500 rounded-full" 
                            style={{ 
                                width: `${Math.min(100, (event.ticketTypes.reduce((acc, t) => acc + t.sold, 0) / event.ticketTypes.reduce((acc, t) => acc + t.quota, 0)) * 100)}%` 
                            }}
                        />
                    </div>
                )}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-1.5 font-medium text-slate-900">
                  <DollarSign size={14} className="text-slate-400" />
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(event.revenue)}
                </div>
              </td>
              <td className="py-4 px-6">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[event.status]}`}>
                  {event.status}
                </span>
              </td>
              <td className="py-4 px-6 text-right relative">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === event.id ? null : event.id);
                    }}
                    className={`p-2 rounded-lg transition-all ${openMenuId === event.id ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                >
                  <MoreHorizontal size={18} />
                </button>

                {openMenuId === event.id && (
                    <div 
                        ref={menuRef}
                        className="absolute right-8 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right text-left"
                    >
                        <div className="p-1">
                            <button 
                                onClick={() => handleAction('edit', event)}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <Edit size={16} className="text-slate-400" />
                                Düzenle
                            </button>
                            <button 
                                onClick={() => handleAction('details', event)}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <FileText size={16} className="text-slate-400" />
                                Detayları Gör
                            </button>
                            <button 
                                onClick={() => handleAction('download', event)}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <Download size={16} className="text-slate-400" />
                                Bilgileri İndir
                            </button>
                            
                            <div className="h-px bg-slate-100 my-1"></div>
                            
                            <button 
                                onClick={() => handleAction('toggle_status', event)}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                {event.status === EventStatus.PUBLISHED ? (
                                    <>
                                        <PauseCircle size={16} className="text-slate-400" />
                                        Satışı Durdur
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle size={16} className="text-slate-400" />
                                        Yayına Al
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => handleAction('delete', event)}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={16} />
                                Sil
                            </button>
                        </div>
                    </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length === 0 && (
        <div className="p-8 text-center text-slate-500">
            Aradığınız kriterlere uygun etkinlik bulunamadı.
        </div>
      )}
    </div>
  );
};

export default EventList;