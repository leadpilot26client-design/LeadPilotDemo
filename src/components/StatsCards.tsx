import React from 'react';
import { Calendar, AlertCircle, Users, Clock, LayoutDashboard, Target, BarChart3, CheckSquare } from 'lucide-react';
import { FilterTab } from '../types';
import { cn } from '../lib/utils';

interface StatsCardsProps {
  todayCount: number;
  overdueCount: number;
  totalLeads: number;
  upcomingCount: number;
  doneCount: number;
  activeTab: FilterTab;
  onCardClick: (tab: FilterTab) => void;
}

export default function StatsCards({ todayCount, overdueCount, totalLeads, upcomingCount, doneCount, activeTab, onCardClick }: StatsCardsProps) {
  const stats = [
    { label: 'Today', value: todayCount, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50/70', border: 'border-emerald-100', dot: 'bg-emerald-400', tab: 'Today' as FilterTab },
    { label: 'Site Visits', value: upcomingCount, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50/70', border: 'border-blue-100', dot: 'bg-blue-400', tab: 'Site Visits' as FilterTab },
    { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50/70', border: 'border-rose-100', dot: 'bg-rose-400', tab: 'Overdue' as FilterTab },
    { label: 'Total', value: totalLeads, icon: LayoutDashboard, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', dot: 'bg-slate-500', tab: 'All' as FilterTab },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {stats.map((stat) => (
        <button 
          key={stat.label} 
          onClick={() => onCardClick(stat.tab)}
          className={cn(
            stat.bg,
            stat.border,
            activeTab === stat.tab ? "ring-2 ring-emerald-500 ring-offset-2 scale-105 shadow-lg z-10 bg-white" : "hover:shadow-md",
            "p-3 rounded-2xl border shadow-sm flex flex-col items-start text-left transition-all active:scale-95 group relative overflow-hidden h-20"
          )}
        >
          {/* Top Row: Icon and Dot Indicator */}
          <div className="flex items-center justify-between w-full mb-auto">
            <div className={cn(stat.color, "p-0.5")}>
              <stat.icon size={16} strokeWidth={3} />
            </div>
            <div className={cn("h-1.5 w-1.5 rounded-full", stat.dot)} />
          </div>
          
          {/* Bottom section: Value and Label */}
          <div className="mt-auto">
            <p className="text-xl font-black text-slate-900 leading-none mb-1">{stat.value}</p>
            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.1em] leading-none">{stat.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
