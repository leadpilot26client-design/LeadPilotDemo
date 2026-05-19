import React from 'react';
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  MessageCircle, 
  MoreHorizontal, 
  CheckCircle, 
  Trash2, 
  UserPlus, 
  Calendar, 
  Clock,
  Video,
  MapPin,
  ListTodo,
  AlertCircle,
  Zap,
  Clock3,
  PhoneCall
} from 'lucide-react';
import { Lead, LeadStatus, DoneReason, Appointment, Task, TaskStatus, AppointmentType } from '../types';
import { cn } from '../lib/utils';
import { format, isToday, isPast, isFuture, parseISO, differenceInDays } from 'date-fns';
import { STATUS_COLORS, USERS } from '../constants';

interface LeadCardProps {
  key?: React.Key;
  lead: Lead;
  onUpdateAfterCall: (lead: Lead, initialType?: AppointmentType) => void;
  onMarkDone: (lead: Lead) => void;
  onDelete?: () => void;
  onReassign?: (lead: Lead, agentId?: string) => void;
  onSchedule?: (lead: Lead, type?: AppointmentType) => void;
  isAdmin?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isActive?: boolean;
  onActiveClick?: () => void;
  teamMembers?: string[];
  nextAppointment?: Appointment;
  pendingTasks?: Task[];
}

export default function LeadCard({ 
  lead, 
  onUpdateAfterCall, 
  onMarkDone, 
  onDelete, 
  onReassign, 
  onSchedule,
  isAdmin,
  isSelectable,
  isSelected,
  onToggleSelect,
  isActive,
  onActiveClick,
  teamMembers = [],
  nextAppointment,
  pendingTasks = []
}: LeadCardProps) {
  const followUpDateStr = lead.followUpDate || new Date().toISOString();
  const followUpDate = parseISO(followUpDateStr);
  const isDone = String(lead.status).toLowerCase() === 'done';

  const createdAtDate = lead.createdAt ? parseISO(lead.createdAt) : new Date();
  const daysInSystem = differenceInDays(new Date(), createdAtDate);
  
  const getUrgency = () => {
    if (daysInSystem <= 1) return { label: 'Fresh', color: 'text-emerald-500 bg-emerald-50', icon: <Zap size={10} /> };
    if (isPast(followUpDate) && !isToday(followUpDate)) return { label: 'Urgent', color: 'text-rose-500 bg-rose-50', icon: <AlertCircle size={10} /> };
    if (daysInSystem >= 7) return { label: 'Aging', color: 'text-orange-500 bg-orange-50', icon: <Clock3 size={10} /> };
    return null;
  };

  const urgency = getUrgency();
  
  let statusColor = STATUS_COLORS.UPCOMING;
  if (isDone) {
    statusColor = STATUS_COLORS.DONE;
  } else if (isToday(followUpDate)) {
    statusColor = STATUS_COLORS.TODAY;
  } else if (isPast(followUpDate)) {
    statusColor = STATUS_COLORS.OVERDUE;
  }

  const handleCall = () => {
    window.open(`tel:${lead.phone}`);
    onUpdateAfterCall?.(lead);
  };
  const handleSms = () => {
    window.open(`sms:${lead.phone}`);
    onUpdateAfterCall?.(lead);
  };
  const waNumber = lead.whatsapp || lead.phone;
  const handleWhatsApp = () => {
    const num = String(waNumber || '').replace(/\D/g, '');
    if (num) window.open(`https://wa.me/${num}`);
    onUpdateAfterCall?.(lead);
  };
  const handleEmail = () => {
    if (lead.email) window.open(`mailto:${lead.email}?subject=Follow up: ${lead.property || 'Property Interest'}`);
    else window.open(`mailto:?to=&subject=Follow up: ${lead.property || 'Property Interest'}`);
    onUpdateAfterCall?.(lead);
  };

  const getAppointmentIcon = (type: AppointmentType) => {
    switch (type) {
      case AppointmentType.CALL: return <Phone size={12} />;
      case AppointmentType.SITE_VISIT: return <MapPin size={12} />;
      case AppointmentType.MEETING: return <Video size={12} />;
      default: return <Calendar size={12} />;
    }
  };

  return (
    <div 
      id={`lead-${lead.id}`}
      onClick={() => {
        if (isSelectable) onToggleSelect?.();
        else onActiveClick?.();
      }}
      className={cn(
        "p-3.5 rounded-[2rem] border transition-all duration-300 relative group overflow-hidden cursor-pointer",
        statusColor.bg,
        statusColor.border,
        "hover:shadow-md",
        isSelectable && "active:scale-[0.98]",
        (isSelected || isActive) && "ring-2 ring-emerald-500 ring-offset-2 shadow-xl shadow-emerald-200/50 bg-white border-emerald-300 scale-[1.02]"
      )}
    >
      {/* Visual Status Indicator */}
      <div className={cn(
        "absolute top-0 left-0 bottom-0 w-1.5 transition-colors shadow-sm",
        statusColor.accent
      )} />

      {isSelectable && (
        <div className="absolute top-3 right-3 z-10">
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm",
            isSelected ? "bg-emerald-500 border-emerald-500 text-white scale-110" : "bg-white border-slate-200"
          )}>
            {isSelected && <CheckCircle size={12} strokeWidth={3} />}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-3 pl-1">
        <div className="flex gap-3 items-center min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-800 font-black text-lg shrink-0 uppercase shadow-sm">
            {(lead.firstName || lead.name || '?').charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-900 text-[17px] leading-tight mb-0.5 truncate">
              {lead.firstName || lead.name} {lead.lastName || ''}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {urgency && (
                <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest", urgency.color)}>
                  {urgency.icon}
                  {urgency.label}
                </div>
              )}
              <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-md">
                {lead.propertyType || lead.property || 'General'}
              </span>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                {daysInSystem === 0 ? 'Fresh' : `${daysInSystem}d`}
              </span>
            </div>
          </div>
        </div>
        
        {!isDone && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "text-right leading-none uppercase font-black tracking-tight bg-white/70 px-2.5 py-1.5 rounded-xl border border-slate-100 shadow-sm",
                isToday(followUpDate) ? "text-emerald-500" : 
                isPast(followUpDate) ? "text-rose-500" : 
                "text-blue-500"
              )}>
                <p className="text-[7px] mb-0.5 opacity-60">
                  {isToday(followUpDate) ? 'Today' : isPast(followUpDate) ? 'Overdue' : 'Follow up'}
                </p>
                <p className="text-[10px] whitespace-nowrap">
                  {format(followUpDate, 'MMM d')}
                </p>
              </div>
              {onDelete && isAdmin && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                  className="w-8 h-8 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all active:scale-90"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-3 pl-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/70 rounded-xl border border-slate-200/50 shadow-sm transition-all group-hover:border-emerald-200">
          <Phone size={10} className="text-emerald-500" />
          <span className="text-[11px] font-black text-slate-700 tracking-tight">{lead.phone}</span>
        </div>
        {lead.budget && (
          <div className="inline-flex items-center px-2.5 py-1.5 bg-white/50 rounded-xl border border-slate-200/50 shadow-sm">
            <span className="text-[11px] font-black text-slate-700 tracking-tight">{lead.budget}</span>
          </div>
        )}
        {lead.callOutcome && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-xl text-white shadow-sm">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest">{lead.callOutcome}</span>
          </div>
        )}
      </div>

      {nextAppointment && (
        <div className="mb-3 p-3 bg-emerald-50/80 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                {getAppointmentIcon(nextAppointment.type)}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest leading-none">{nextAppointment.type}</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 leading-none bg-white px-2 py-1 rounded-lg">
              <Clock size={9} />
              {nextAppointment.date && isToday(parseISO(nextAppointment.date)) ? 'Today' : (nextAppointment.date ? format(parseISO(nextAppointment.date), 'MMM d') : 'No Date')} @ {nextAppointment.time}
            </div>
          </div>
          {nextAppointment.notes && (
            <p className="text-[10px] text-emerald-600/80 line-clamp-1 font-bold italic-selection ml-6.5">
              "{nextAppointment.notes}"
            </p>
          )}
        </div>
      )}

      {pendingTasks.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-1.5 text-blue-700">
            <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-blue-500 shadow-sm">
              <ListTodo size={12} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest leading-none">{pendingTasks.length} Tasks</span>
          </div>
          <p className="text-[10px] font-black text-blue-600 truncate max-w-[120px] leading-none text-right uppercase tracking-tighter">
            {pendingTasks[0].title}
          </p>
        </div>
      )}

      {/* Action Buttons Row */}
      {!isDone && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          <button 
            onClick={(e) => { e.stopPropagation(); handleWhatsApp(); }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-slate-100 transition-all active:scale-95 shadow-sm hover:border-emerald-200"
          >
            <MessageCircle size={20} className="text-emerald-500" strokeWidth={2} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleSms(); }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-slate-100 transition-all active:scale-95 shadow-sm hover:border-blue-200"
          >
            <MessageSquare size={20} className="text-blue-500" strokeWidth={2} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SMS</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleCall(); }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-slate-100 transition-all active:scale-95 shadow-sm hover:border-emerald-300"
          >
            <Phone size={20} className="text-emerald-600" strokeWidth={2} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Call</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleEmail(); }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-slate-100 transition-all active:scale-95 shadow-sm hover:border-purple-200"
          >
            <Mail size={20} className="text-purple-500" strokeWidth={2} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mail</span>
          </button>
        </div>
      )}

      {/* Quick Interaction Links */}
      {!isDone && (
        <div className="flex items-center gap-3 mb-4 px-2 py-2 bg-slate-50/50 rounded-xl border border-slate-100/50">
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdateAfterCall?.(lead, AppointmentType.SITE_VISIT); }}
            className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-blue-50 transition-all group"
          >
            <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <MapPin size={14} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter text-blue-700">Site Visit</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdateAfterCall?.(lead, AppointmentType.MEETING); }}
            className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-emerald-50 transition-all group"
          >
            <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <Video size={14} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-700">Meeting</span>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onUpdateAfterCall?.(lead, AppointmentType.FOLLOW_UP); }}
            className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-orange-50 transition-all group"
          >
            <div className="bg-orange-100 text-orange-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <PhoneCall size={14} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter text-orange-700">Callback</span>
          </button>
        </div>
      )}

      {/* Main Action Buttons */}
      {!isDone && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdateAfterCall?.(lead); }}
            className="group py-4 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-all hover:bg-emerald-600 shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
          >
            <PhoneCall size={14} className="group-hover:animate-bounce" />
            Update Call
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMarkDone(lead); }}
            className="py-4 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-all hover:bg-slate-800 shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
          >
            <CheckCircle size={14} />
            Mark Done
          </button>
        </div>
      )}

      <div className="space-y-3">
        {isAdmin ? (
          <div className="flex items-center gap-2 p-1.5 bg-white/70 rounded-full border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors">
            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center shrink-0 ml-1">
              <UserPlus size={10} className="text-slate-400" />
            </div>
            <select 
              value={lead.assignedTo || 'admin'}
              onChange={(e) => {
                e.stopPropagation();
                onReassign?.(lead, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent text-[10px] font-black uppercase tracking-[0.05em] text-slate-600 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="admin">Master Admin</option>
              {teamMembers.map(email => (
                <option key={email} value={email}>{email.split('@')[0].toUpperCase()}</option>
              ))}
            </select>
          </div>
        ) : lead.assignedTo && (
          <div className="flex items-center gap-2 p-1.5 bg-white/30 rounded-full border border-white/50">
            <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center shrink-0 ml-1 text-slate-400">
              <UserPlus size={10} />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest truncate">
              {lead.assignedTo === 'admin' ? 'Master Admin' : (lead.assignedTo || '').split('@')[0].toUpperCase()}
            </span>
          </div>
        )}

        {isDone && (
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle size={14} strokeWidth={3} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-700 tracking-tight">Competed</p>
                <p className="text-[9px] text-emerald-600/70 font-black uppercase truncate max-w-[120px]">{lead.doneReason}</p>
              </div>
            </div>
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-rose-300 hover:text-rose-500 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
