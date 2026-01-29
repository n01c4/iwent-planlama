import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
          <Icon size={20} strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {change && (
          <div className={`flex items-center mt-1 text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            <span>{change}</span>
            <span className="ml-1 text-slate-400 font-normal">geçen aya göre</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;