import React from 'react';
import { MapPin, Video, Calendar, Phone } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppointmentType } from '../types';

interface SummaryItemProps {
  type: AppointmentType;
  count: number;
  label: string;
  color: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const SummaryItem = ({ type, count, label, color, icon, isActive, onClick }: SummaryItemProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center gap-2 p-2.5 rounded-2xl border transition-all active:scale-95",
      isActive 
        ? `${color.split(' ')[0]} border-current ring-1 ring-current` 
        : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
    )}
  >
    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", color)}>
      {icon}
    </div>
    <div className="text-left leading-none">
      <p className="text-sm font-black text-slate-900">{count}</p>
      <p className="text-[8px] font-black uppercase tracking-tighter opacity-60 mt-0.5">{label}</p>
    </div>
  </button>
);

interface ActivitySummaryProps {
  counts: Record<AppointmentType, number>;
  activeFilter: AppointmentType | null;
  onFilterChange: (type: AppointmentType | null) => void;
}

export function ActivitySummary({ counts, activeFilter, onFilterChange }: ActivitySummaryProps) {
  const items = [
    { 
      type: AppointmentType.SITE_VISIT, 
      label: 'SITE VISITS', 
      color: 'bg-blue-500 text-white', 
      icon: <MapPin size={18} fill="currentColor" fillOpacity={0.2} />,
      count: counts[AppointmentType.SITE_VISIT] || 0
    },
    { 
      type: AppointmentType.MEETING, 
      label: 'MEETINGS', 
      color: 'bg-emerald-500 text-white', 
      icon: <Video size={18} fill="currentColor" fillOpacity={0.2} />,
      count: counts[AppointmentType.MEETING] || 0
    },
    { 
      type: AppointmentType.FOLLOW_UP, 
      label: 'FOLLOW-UPS', 
      color: 'bg-slate-500 text-white', 
      icon: <Calendar size={18} fill="currentColor" fillOpacity={0.2} />,
      count: counts[AppointmentType.FOLLOW_UP] || 0
    },
    { 
      type: AppointmentType.CALL, 
      label: 'CALL BACKS', 
      color: 'bg-orange-500 text-white', 
      icon: <Phone size={18} fill="currentColor" fillOpacity={0.2} />,
      count: counts[AppointmentType.CALL] || 0
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-top-2 duration-500">
      {items.map((item) => {
        const isActive = activeFilter === item.type;
        return (
          <button 
            key={item.type}
            onClick={() => onFilterChange(isActive ? null : item.type)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-[1.8rem] border-2 transition-all active:scale-[0.98] text-left relative overflow-hidden group",
              isActive 
                ? "bg-white border-slate-900 shadow-xl shadow-slate-200" 
                : "bg-white border-slate-50 hover:border-slate-100 shadow-sm"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500",
              item.color,
              isActive ? "scale-110" : "group-hover:scale-105"
            )}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className={cn(
                "text-2xl font-black tracking-tight leading-none mb-1",
                isActive ? "text-slate-900" : "text-slate-800"
              )}>{item.count}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors whitespace-nowrap">
                {item.label}
              </p>
            </div>
            {isActive && (
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-900" />
            )}
          </button>
        );
      })}
    </div>
  );
}
