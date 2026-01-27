import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockService } from '../services/mockData';
import toast from 'react-hot-toast';
import { ShieldAlert, DollarSign, Mail, Ban, CheckCircle } from 'lucide-react';

export const OrganizerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const organizer = mockService.organizers.find(o => o.id === id);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);

  if (!organizer) return <div className="text-white">Organizer not found</div>;

  const handleAction = (action: string) => {
    if (confirm(`Are you sure you want to ${action}?`)) {
        mockService.addAuditLog(`${action}`, organizer.name);
        toast.success(`Action confirmed: ${action}`);
        navigate('/organizers');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-white">{organizer.name}</h1>
                    <Badge variant={organizer.status === 'Active' ? 'success' : 'danger'}>{organizer.status}</Badge>
                    {organizer.payoutHold && <Badge variant="warning">Payout Hold</Badge>}
                </div>
                <div className="text-slate-400 mt-1 flex gap-4 text-sm">
                    <span>ID: {organizer.id}</span>
                    <span>Joined: {new Date(organizer.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleAction('Send Message')}><Mail size={16} className="mr-2"/> Message</Button>
                {organizer.status === 'Active' ? (
                    <Button variant="danger" onClick={() => handleAction('Suspend Account')}><Ban size={16} className="mr-2"/> Suspend</Button>
                ) : (
                    <Button variant="primary" onClick={() => handleAction('Reinstate Account')}><CheckCircle size={16} className="mr-2"/> Reinstate</Button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Risk Profile</h2>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-emerald-400">{organizer.riskScore}</div>
                            <div className="text-xs text-slate-500 uppercase mt-1">Trust Score</div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="w-full bg-brand-900 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${organizer.riskScore}%` }}></div>
                            </div>
                            <p className="text-sm text-slate-400">
                                This organizer has a good standing. Low report volume in the last 30 days.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 border-b border-brand-700 bg-brand-800/50">
                        <h3 className="font-semibold text-white">Recent Events</h3>
                    </div>
                    <div className="p-4 text-sm text-slate-400 text-center py-8">
                        No recent events found in current period.
                    </div>
                </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Contact Info</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Email</span>
                            <span className="text-white">{organizer.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Phone</span>
                            <span className="text-white">{organizer.phone}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">KYC</span>
                            <span className={organizer.kycStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400'}>{organizer.kycStatus}</span>
                        </div>
                    </div>
                </Card>

                 <Card className="p-6">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Compliance Actions</h3>
                    <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" onClick={() => handleAction('Hold Payouts')}>
                            <DollarSign size={16} className="mr-2"/> Toggle Payout Hold
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => handleAction('Request Re-KYC')}>
                            <ShieldAlert size={16} className="mr-2"/> Request Re-KYC
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    </div>
  );
};
