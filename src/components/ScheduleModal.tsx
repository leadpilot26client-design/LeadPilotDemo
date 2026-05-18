import React, { useState } from 'react';
import { X, Calendar, Clock, MessageSquare, User, Video, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { AppointmentType, Lead } from '../types';

interface ScheduleModalProps {
  lead: Lead;
  onClose: () => void;
  onSchedule: (appointment: any) => void;
  teamMembers: string[];
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ 
  lead, 
  onClose, 
  onSchedule,
  teamMembers
}) => {
  const [type, setType] = useState<AppointmentType>(AppointmentType.CALL);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo || 'admin');

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule({
      type,
      date,
      time,
      notes,
      assignedTo,
      leadId: lead.id,
      leadName: `${lead.firstName} ${lead.lastName || ''}`.trim()
    });
  };

  const types = [
    { id: AppointmentType.CALL, icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: AppointmentType.SITE_VISIT, icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: AppointmentType.MEETING, icon: Video, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: AppointmentType.FOLLOW_UP, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900">Schedule Activity</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">FOR {lead.firstName.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Type */}
          <div className="grid grid-cols-4 gap-3">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95",
                  type === t.id 
                    ? cn("border-slate-900", t.bg) 
                    : "border-slate-50 bg-slate-50 hover:border-slate-200"
                )}
              >
                <t.icon size={18} className={cn(t.color)} strokeWidth={2.5} />
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">{t.id}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Time</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assign To</label>
              <div className="relative">
                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all appearance-none"
                >
                  <option value="admin">Master Admin</option>
                  {teamMembers.map(email => (
                    <option key={email} value={email}>{email.split('@')[0].toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notes</label>
              <div className="relative">
                <MessageSquare size={14} className="absolute left-4 top-4 text-slate-400" />
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details..."
                  className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all min-h-[100px] resize-none placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#0F172A] py-5 rounded-[2rem] text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-[0.98] transition-all hover:bg-black"
          >
            Confirm Schedule
          </button>
        </form>
      </div>
    </div>
  );
};
