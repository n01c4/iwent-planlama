import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockService } from '../services/mockData';
import { AlertTriangle, MessageSquare, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const Moderation: React.FC = () => {
    // Combine reports and flagged messages into a single queue for the UI demo
    const queue = [
        ...mockService.reports.filter(r => r.status !== 'Resolved').map(r => ({ type: 'Report', data: r, id: r.id, severity: r.severity })),
        ...mockService.groups.filter(g => g.flaggedMessagesCount > 0).map(g => ({ type: 'FlaggedGroup', data: g, id: g.id, severity: 'Medium' }))
    ];

    const [items, setItems] = useState(queue);

    const handleResolve = (id: string) => {
        setItems(items.filter(i => i.id !== id));
        toast.success("Item marked as resolved");
        mockService.addAuditLog("Moderation Resolve", id);
    };

    const handleDismiss = (id: string) => {
        setItems(items.filter(i => i.id !== id));
        toast('Item dismissed', { icon: '🗑️' });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Moderation Queue <span className="text-slate-500 text-lg font-normal ml-2">({items.length} Pending)</span></h1>
            
            <div className="grid grid-cols-1 gap-4">
                {items.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-brand-800/20 rounded-lg border border-dashed border-brand-700">
                        <Check size={48} className="mx-auto mb-4 text-emerald-500/50"/>
                        <p>All clean! No pending moderation items.</p>
                    </div>
                ) : (
                    items.map((item: any) => (
                        <Card key={item.id} className="p-0 overflow-hidden border-l-4 border-l-brand-600 hover:border-l-emerald-500 transition-all">
                            <div className="p-4 flex flex-col md:flex-row gap-4">
                                <div className="p-3 bg-brand-900 rounded-lg flex-shrink-0 self-start">
                                    {item.type === 'Report' ? <AlertTriangle className="text-rose-400" /> : <MessageSquare className="text-amber-400" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="danger">{item.severity}</Badge>
                                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{item.type}</span>
                                            </div>
                                            <h3 className="text-white font-medium text-lg">
                                                {item.type === 'Report' ? item.data.type : `Flagged Content in ${item.data.eventName}`}
                                            </h3>
                                            <p className="text-slate-400 mt-1 text-sm">
                                                {item.type === 'Report' ? item.data.description : `Group has ${item.data.flaggedMessagesCount} flagged messages requiring review.`}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-slate-500">
                                            {item.type === 'Report' ? new Date(item.data.createdAt).toLocaleTimeString() : 'Active Now'}
                                        </div>
                                    </div>
                                    
                                    {/* Action Footer */}
                                    <div className="mt-4 pt-4 border-t border-brand-800 flex justify-end gap-3">
                                        <Button variant="ghost" size="sm" onClick={() => handleDismiss(item.id)}>Dismiss</Button>
                                        <Button variant="outline" size="sm">View Context</Button>
                                        <Button variant="primary" size="sm" onClick={() => handleResolve(item.id)}>Resolve</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
