import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockService } from '../services/mockData';
import toast from 'react-hot-toast';
import { Shield, Ban, Mail, CheckCircle, AlertTriangle, Activity, Calendar, MapPin, User as UserIcon } from 'lucide-react';

export const UserDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = mockService.users.find(u => u.id === id);
  const userReports = mockService.reports.filter(r => r.reporterId === id || r.targetId === id);

  if (!user) return <div className="text-white p-6">User not found</div>;

  const handleAction = (action: string) => {
    if (confirm(`Are you sure you want to ${action}?`)) {
        mockService.addAuditLog(`${action}`, user.name);
        toast.success(`Action confirmed: ${action}`);
        // Simple mock status update logic
        if (action === 'Suspend User') user.status = 'Suspended';
        if (action === 'Ban User') user.status = 'Banned';
        if (action === 'Reinstate User') user.status = 'Active';
        navigate(`/users/${id}`); // Force re-render kind of, in real app better state mgmt
    }
  };

  const getTrustColor = (score: number) => {
    if (score < 40) return 'text-rose-400';
    if (score < 70) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-700 flex items-center justify-center text-slate-400 border-2 border-brand-600">
                    <UserIcon size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                        <Badge variant={
                            user.status === 'Active' ? 'success' : 
                            user.status === 'Suspended' ? 'warning' : 'danger'
                        }>{user.status}</Badge>
                    </div>
                    <div className="text-slate-400 mt-1 flex gap-4 text-sm">
                        <span>ID: {user.id}</span>
                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleAction('Send Warning Message')}><Mail size={16} className="mr-2"/> Warn</Button>
                {user.status === 'Active' && (
                    <>
                        <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10" onClick={() => handleAction('Suspend User')}>
                            <AlertTriangle size={16} className="mr-2"/> Suspend
                        </Button>
                        <Button variant="danger" onClick={() => handleAction('Ban User')}>
                            <Ban size={16} className="mr-2"/> Ban
                        </Button>
                    </>
                )}
                {(user.status === 'Suspended' || user.status === 'Banned') && (
                     <Button variant="primary" onClick={() => handleAction('Reinstate User')}>
                        <CheckCircle size={16} className="mr-2"/> Reinstate
                    </Button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Stats & Activity */}
            <div className="lg:col-span-2 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 text-center">
                        <div className={`text-3xl font-bold ${getTrustColor(user.trustScore)}`}>{user.trustScore}</div>
                        <div className="text-xs text-slate-500 uppercase mt-1">Trust Score</div>
                    </Card>
                    <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-white">{user.reportsCount}</div>
                        <div className="text-xs text-slate-500 uppercase mt-1">Reports Against</div>
                    </Card>
                     <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-slate-300">0</div>
                        <div className="text-xs text-slate-500 uppercase mt-1">Events Attended</div>
                    </Card>
                </div>

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 border-b border-brand-700 bg-brand-800/50 flex justify-between items-center">
                        <h3 className="font-semibold text-white flex items-center gap-2"><Activity size={16}/> Activity & Reports</h3>
                    </div>
                    {userReports.length > 0 ? (
                        <div className="divide-y divide-brand-700">
                             {userReports.map(report => (
                                 <div key={report.id} className="p-4 hover:bg-brand-700/20 transition-colors">
                                     <div className="flex justify-between items-start mb-1">
                                         <Badge variant={report.status === 'Resolved' ? 'success' : 'warning'}>{report.status}</Badge>
                                         <span className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                                     </div>
                                     <div className="text-sm font-medium text-white">{report.type}: {report.description}</div>
                                     <div className="text-xs text-slate-500 mt-1">
                                         Role: {report.reporterId === user.id ? 'Reporter' : 'Target'}
                                     </div>
                                 </div>
                             ))}
                        </div>
                    ) : (
                         <div className="p-8 text-center text-slate-500 text-sm">No recent activity or reports found.</div>
                    )}
                </Card>
            </div>

            {/* Right Column: Details */}
            <div className="space-y-6">
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">User Details</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <span className="block text-slate-500 text-xs uppercase">Email</span>
                            <span className="text-white break-all">{user.email}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 text-xs uppercase">University</span>
                            <div className="flex items-center gap-2 text-white">
                                <MapPin size={14} className="text-emerald-400"/>
                                {user.university || 'Not Verified'}
                            </div>
                        </div>
                         <div>
                            <span className="block text-slate-500 text-xs uppercase">Last Active</span>
                            <div className="flex items-center gap-2 text-white">
                                <Calendar size={14} className="text-slate-400"/>
                                2 hours ago
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Device Info</h3>
                    <div className="space-y-2 text-xs text-slate-400">
                        <div className="flex justify-between">
                            <span>Last IP</span>
                            <span className="text-slate-300">192.168.1.1</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Device</span>
                            <span className="text-slate-300">iPhone 14 Pro</span>
                        </div>
                         <div className="flex justify-between">
                            <span>App Version</span>
                            <span className="text-slate-300">v2.4.1</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
  );
};
