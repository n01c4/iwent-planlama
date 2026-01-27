import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockService } from '../services/mockData';
import { Calendar, MapPin, Users } from 'lucide-react';

export const Events: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Events</h1>
            <Button>Create Event (Mock)</Button>
       </div>
       
       <div className="grid gap-4">
          {mockService.events.map(evt => (
             <Card key={evt.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-600 transition-colors">
                 <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-brand-700 rounded-lg flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-emerald-400 font-bold uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl font-bold text-white">{new Date(evt.date).getDate()}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">{evt.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><MapPin size={14}/> {evt.venue}</span>
                            <span className="flex items-center gap-1"><Users size={14}/> {evt.organizerName}</span>
                        </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-6">
                     <div className="text-right">
                         <div className="text-xs text-slate-500 mb-1">Status</div>
                         <Badge variant={evt.ticketStatus === 'OnSale' ? 'success' : 'neutral'}>{evt.ticketStatus}</Badge>
                     </div>
                     <div className="text-right">
                         <div className="text-xs text-slate-500 mb-1">Reports</div>
                         <span className={`font-bold ${evt.reportsCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{evt.reportsCount}</span>
                     </div>
                     <Button variant="outline" size="sm">Manage</Button>
                 </div>
             </Card>
          ))}
       </div>
    </div>
  );
};
