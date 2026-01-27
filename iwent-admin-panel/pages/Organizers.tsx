import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockService } from '../services/mockData';
import { Organizer } from '../types';
import { MoreVertical, Filter, Eye } from 'lucide-react';

export const Organizers: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const organizers = mockService.organizers;

  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-emerald-400';
    if (score < 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const filtered = organizers.filter(o => filter === 'All' || o.status === filter);

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Organizers</h1>
            <div className="flex gap-2">
                <Button variant="outline" size="sm"><Filter size={16} className="mr-2"/> Filter</Button>
                <Button>Add Organizer</Button>
            </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 border-b border-brand-700">
            {['All', 'Active', 'Suspended', 'Pending'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        filter === tab 
                        ? 'border-emerald-500 text-emerald-400' 
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <Card className="overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-brand-900/50 text-slate-400 uppercase tracking-wider text-xs">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Organizer</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Risk Score</th>
                        <th className="px-6 py-4 font-semibold">KYC</th>
                        <th className="px-6 py-4 font-semibold">Last Event</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-700">
                    {filtered.map(org => (
                        <tr key={org.id} className="hover:bg-brand-700/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-medium text-white">{org.name}</div>
                                <div className="text-slate-500 text-xs">{org.email}</div>
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant={
                                    org.status === 'Active' ? 'success' : 
                                    org.status === 'Suspended' ? 'danger' : 'warning'
                                }>{org.status}</Badge>
                            </td>
                            <td className="px-6 py-4">
                                <div className={`font-bold ${getRiskColor(org.riskScore)}`}>
                                    {org.riskScore}/100
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-slate-300">{org.kycStatus}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                                {new Date(org.lastEventAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link to={`/organizers/${org.id}`}>
                                        <Button variant="ghost" size="sm"><Eye size={16}/></Button>
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    </div>
  );
};
