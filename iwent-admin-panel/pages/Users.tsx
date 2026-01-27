import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockService } from '../services/mockData';
import { Filter, Eye, User as UserIcon, Download } from 'lucide-react';

export const Users: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const users = mockService.users;

  const getTrustColor = (score: number) => {
    if (score < 40) return 'text-rose-400';
    if (score < 70) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const filtered = users.filter(u => filter === 'All' || u.status === filter);

  // Logic to export data to CSV
  const handleExport = () => {
    const headers = ["ID", "Name", "Email", "Status", "Trust Score", "University", "Reports Count", "Created At"];
    
    const csvContent = [
      headers.join(','), // Header row
      ...filtered.map(u => [
        u.id, 
        `"${u.name}"`, 
        u.email, 
        u.status, 
        u.trustScore, 
        `"${u.university || ''}"`, 
        u.reportsCount, 
        u.createdAt
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `iwent_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download size={16} className="mr-2"/> Export CSV
                </Button>
                <Button variant="outline" size="sm"><Filter size={16} className="mr-2"/> Filter</Button>
            </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 border-b border-brand-700">
            {['All', 'Active', 'Suspended', 'Banned'].map(tab => (
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
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Trust Score</th>
                        <th className="px-6 py-4 font-semibold">University</th>
                        <th className="px-6 py-4 font-semibold">Reports</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-700">
                    {filtered.map(user => (
                        <tr key={user.id} className="hover:bg-brand-700/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-slate-400">
                                        <UserIcon size={14} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{user.name}</div>
                                        <div className="text-slate-500 text-xs">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant={
                                    user.status === 'Active' ? 'success' : 
                                    user.status === 'Suspended' ? 'warning' : 'danger'
                                }>{user.status}</Badge>
                            </td>
                            <td className="px-6 py-4">
                                <div className={`font-bold ${getTrustColor(user.trustScore)}`}>
                                    {user.trustScore}/100
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-slate-300">{user.university || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className={`text-sm ${user.reportsCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                                    {user.reportsCount}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link to={`/users/${user.id}`}>
                                        <Button variant="ghost" size="sm"><Eye size={16}/></Button>
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filtered.length === 0 && (
                <div className="p-8 text-center text-slate-500">No users found filtering by {filter}</div>
            )}
        </Card>
    </div>
  );
};