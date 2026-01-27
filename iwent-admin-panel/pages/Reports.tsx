import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { mockService } from '../services/mockData';
import { Report } from '../types';
import { User, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState(mockService.reports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const handleResolve = (id: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'Resolved' } : r));
    toast.success('Resolved');
    setSelectedReport(null);
  };

  const Column = ({ title, status, items }: any) => (
    <div className="flex-1 min-w-[300px] flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-medium text-brand-300 text-xs">{title}</h3>
            <span className="text-brand-600 text-xs">{items.length}</span>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1 pb-4">
            {items.map((report: Report) => (
                <Card 
                  key={report.id} 
                  onClick={() => setSelectedReport(report)}
                  className="p-3 cursor-pointer hover:border-brand-600 bg-brand-900 group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-white">{report.type}</span>
                        <span className="text-[10px] text-brand-600">{new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs text-brand-400 line-clamp-2 mb-3 leading-relaxed">{report.description}</p>
                    <div className="flex items-center gap-1.5">
                       <Badge variant={report.severity === 'Critical' ? 'danger' : 'neutral'}>{report.severity}</Badge>
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );
  
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-white">Reports</h1>
            <Button variant="outline" size="sm">Export CSV</Button>
        </div>
        
        <div className="flex-1 flex gap-4 overflow-x-auto">
            <Column title="Open Issues" items={reports.filter(r => r.status === 'Open')} />
            <Column title="Under Review" items={reports.filter(r => r.status === 'InReview')} />
            <Column title="Resolved" items={reports.filter(r => r.status === 'Resolved')} />
        </div>

        {/* Simplified Detail Drawer */}
        <Drawer 
          isOpen={!!selectedReport} 
          onClose={() => setSelectedReport(null)} 
          title="Issue Details"
        >
          {selectedReport && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs text-brand-500 font-medium uppercase tracking-wider">{selectedReport.type}</span>
                <p className="text-sm text-brand-200 leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>

              <div className="border-t border-brand-800 pt-4 space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-brand-500">Reporter</span>
                    <span className="text-brand-200">{selectedReport.reporterName}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-brand-500">Target</span>
                    <span className="text-brand-200">{selectedReport.targetName}</span>
                 </div>
              </div>

              <div className="pt-6 flex gap-3">
                 <Button className="flex-1" onClick={() => handleResolve(selectedReport.id)}>Resolve</Button>
                 <Button variant="secondary" onClick={() => setSelectedReport(null)}>Close</Button>
              </div>
            </div>
          )}
        </Drawer>
    </div>
  );
};