import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { mockService } from '../services/mockData';
import { Search, MoreVertical, Shield, Ban, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const ChatDetail: React.FC<{ mode: 'group' | 'dm' }> = ({ mode }) => {
    const messages = mockService.groups[0] ? mockService.groups : []; // Placeholder logic
    const [mockMsgs, setMockMsgs] = useState([
        { id: 1, sender: 'User A', text: 'Does anyone have the location?', time: '10:00', isFlagged: false },
        { id: 2, sender: 'User B', text: 'Yeah it is at Dock 42.', time: '10:02', isFlagged: false },
        { id: 3, sender: 'Spammer', text: 'BUY CRYPTO NOW!!! LINK IN BIO', time: '10:05', isFlagged: true },
        { id: 4, sender: 'User A', text: 'Mod please ban this guy', time: '10:06', isFlagged: false },
    ]);

    const handleAction = (action: string) => {
        toast.success(action);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            {/* Chat List Sidebar */}
            <div className="w-80 flex flex-col gap-4">
                 <Card className="flex-1 flex flex-col p-0 overflow-hidden">
                    <div className="p-4 border-b border-brand-700 bg-brand-800">
                        <h2 className="font-bold text-white mb-2">Active Groups</h2>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input className="w-full bg-brand-900 rounded-md py-1.5 pl-9 pr-3 text-xs text-white border border-brand-700 focus:border-emerald-500 outline-none" placeholder="Filter..." />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {mockService.groups.map(g => (
                            <div key={g.id} className="p-3 border-b border-brand-700 hover:bg-brand-700/50 cursor-pointer transition-colors">
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-sm text-slate-200 truncate w-40">{g.eventName}</span>
                                    {g.flaggedMessagesCount > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full flex items-center">{g.flaggedMessagesCount}</span>}
                                </div>
                                <div className="text-xs text-slate-500 flex justify-between">
                                    <span>{g.memberCount} members</span>
                                    <span>{g.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                 </Card>
            </div>

            {/* Main Chat View */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-brand-700 flex justify-between items-center bg-brand-800">
                    <div>
                        <h2 className="font-bold text-white text-lg">Midnight Warehouse Rave <span className="text-slate-500 text-sm font-normal">#general</span></h2>
                        <div className="text-xs text-emerald-400 flex items-center gap-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> Live Monitoring
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="outline" size="sm" onClick={() => handleAction('Set Read-Only')}><Lock size={14} className="mr-2"/> Freeze</Button>
                         <Button variant="danger" size="sm" onClick={() => handleAction('Purge Flags')}><Shield size={14} className="mr-2"/> Purge Flags</Button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 bg-brand-900/50 p-6 overflow-y-auto space-y-4">
                    {mockMsgs.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.isFlagged ? 'opacity-100' : 'opacity-75 hover:opacity-100'}`}>
                            <div className={`flex items-baseline gap-2 mb-1`}>
                                <span className={`font-bold text-sm ${msg.isFlagged ? 'text-rose-400' : 'text-emerald-400'}`}>{msg.sender}</span>
                                <span className="text-xs text-slate-600">{msg.time}</span>
                                {msg.isFlagged && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1 rounded uppercase font-bold tracking-wide">Flagged</span>}
                            </div>
                            <div className={`p-3 rounded-lg max-w-2xl text-sm ${msg.isFlagged ? 'bg-rose-500/10 border border-rose-500/30 text-rose-100' : 'bg-brand-800 border border-brand-700 text-slate-200'}`}>
                                {msg.text}
                            </div>
                            {msg.isFlagged && (
                                <div className="flex gap-2 mt-1 ml-1">
                                    <button className="text-xs text-rose-400 hover:underline" onClick={() => handleAction(`Banned ${msg.sender}`)}>Ban User</button>
                                    <button className="text-xs text-slate-500 hover:underline" onClick={() => handleAction('Deleted Message')}>Delete Message</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Admin Input */}
                <div className="p-4 border-t border-brand-700 bg-brand-800">
                    <input 
                        className="w-full bg-brand-900 border border-brand-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-600"
                        placeholder="Type an admin announcement..."
                    />
                </div>
            </Card>
        </div>
    );
};
