import React from 'react';
import { Card } from '../components/ui/Card';
import { mockService } from '../services/mockData';
import { Button } from '../components/ui/Button';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Mock chart data
const chartData = [
  { name: 'Mon', activeUsers: 240 },
  { name: 'Tue', activeUsers: 300 },
  { name: 'Wed', activeUsers: 280 },
  { name: 'Thu', activeUsers: 350 },
  { name: 'Fri', activeUsers: 500 },
  { name: 'Sat', activeUsers: 720 },
  { name: 'Sun', activeUsers: 650 },
];

const StatCard = ({ title, value, trend, trendLabel }: any) => (
  <Card className="p-5 flex flex-col justify-between hover:border-brand-600 transition-colors bg-brand-900/50">
      <p className="text-brand-600 text-xs font-medium uppercase tracking-wider">{title}</p>
      <div className="flex items-end justify-between mt-2">
        <h3 className="text-2xl font-semibold text-white tracking-tight">{value}</h3>
        {trend && (
            <div className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(trend)}%
            </div>
        )}
      </div>
  </Card>
);

export const Dashboard: React.FC = () => {
  const stats = mockService.getStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
            <h1 className="text-xl font-semibold text-white">Overview</h1>
            <p className="text-brand-600 text-sm">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
            <Button size="sm" variant="outline">Download Report</Button>
            <Button size="sm">Add Event</Button>
        </div>
      </div>

      {/* Minimal Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value="$42,500" trend={12} />
        <StatCard title="Active Users" value="1,250" trend={5} />
        <StatCard title="Pending Reports" value={stats.openReports} trend={-2} />
        <StatCard title="Ticket Sales" value="854" trend={8} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - Clean */}
        <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-medium text-white">User Activity</h3>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#e4e4e7" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#e4e4e7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#3f3f46" axisLine={false} tickLine={false} fontSize={10} tickMargin={10} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', fontSize: '12px' }} 
                                itemStyle={{ color: '#fff' }}
                                cursor={{ stroke: '#3f3f46' }}
                            />
                            <Area type="monotone" dataKey="activeUsers" stroke="#a1a1aa" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <h3 className="text-sm font-medium text-brand-300 mt-8 mb-2">Needs Attention</h3>
            <div className="grid gap-2">
                 {mockService.reports.slice(0, 2).map(r => (
                     <div key={r.id} className="flex items-center justify-between p-3 bg-brand-900 border border-brand-800 rounded-lg hover:border-brand-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-danger-500"></div>
                            <span className="text-sm text-brand-200">{r.type} Report</span>
                            <span className="text-xs text-brand-600">on {r.targetName}</span>
                        </div>
                        <Button size="sm" variant="ghost">Review</Button>
                     </div>
                 ))}
            </div>
        </div>

        {/* Right Panel - Simple List */}
        <div className="space-y-4">
            <Card className="p-5 h-full">
                <h3 className="text-sm font-medium text-white mb-4">Live Audit</h3>
                <div className="space-y-6 relative">
                    <div className="absolute left-1.5 top-2 bottom-2 w-px bg-brand-800"></div>
                    {mockService.auditLog.slice(0, 6).map(log => (
                        <div key={log.id} className="flex gap-4 relative">
                            <div className="w-3 h-3 bg-brand-950 border border-brand-600 rounded-full z-10 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="text-xs text-brand-200">{log.action}</div>
                                <div className="text-[10px] text-brand-600 mt-0.5">{log.actor} • {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};