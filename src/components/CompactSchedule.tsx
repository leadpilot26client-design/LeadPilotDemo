import React from 'react';
import { parseISO, format } from 'date-fns';
import { Appointment, AppointmentType } from '../types';
import { cn } from '../lib/utils';

interface CompactScheduleProps {
  appointments: Appointment[];
  onItemClick: (leadId: string) => void;
}

export function CompactSchedule({ appointments, onItemClick }: CompactScheduleProps) {
  if (appointments.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No scheduled events for today</p>
      </div>
    );
  }

  const getTypeStyles = (type: AppointmentType) => {
    switch (type) {
      case AppointmentType.SITE_VISIT: return "bg-blue-500";
      case AppointmentType.MEETING: return "bg-emerald-500";
      case AppointmentType.CALL: return "bg-orange-500";
      default: return "bg-slate-400";
    }
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const timeA = a.time || '';
    const timeB = b.time || '';
    return timeA.localeCompare(timeB);
  });

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
      {sortedAppointments.map((app) => (
        <button
          key={app.id}
          onClick={() => onItemClick(app.leadId)}
          className="w-full flex items-center gap-4 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all hover:border-emerald-200 group"
        >
          <div className={cn("w-2 h-2 rounded-full shrink-0 group-hover:scale-150 transition-transform", getTypeStyles(app.type))} />
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-black text-slate-900">{app.time}</span>
              <span className="text-slate-200 text-[10px]">•</span>
              <span className="text-xs font-bold text-slate-600 truncate">{app.type}</span>
            </div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-tight truncate ml-4">
              {app.leadName || 'Unnamed Lead'}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
