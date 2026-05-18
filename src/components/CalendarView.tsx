import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Video,
  AlertCircle
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isPast,
  isToday,
  parseISO
} from 'date-fns';
import { cn } from '../lib/utils';
import { Appointment, AppointmentType } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ appointments }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month');

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
    setViewMode('Day');
  };

  const getAppointmentsForDate = (date: Date) => {
    return (appointments || []).filter(app => app && app.date && app.date.length > 5 && isSameDay(parseISO(app.date), date));
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-slate-900 leading-none">
            {format(currentMonth, 'MMMM')}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1.5">
            {format(currentMonth, 'yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-90 text-slate-400">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="h-4 w-[1px] bg-slate-100" />
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-90 text-slate-400">
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, index) => (
          <div key={index} className="text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{day}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const apps = getAppointmentsForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const today = isToday(day);

          return (
            <button
              key={day.toString()}
              onClick={() => onDateClick(day)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all active:scale-90 border-2",
                !isCurrentMonth ? "opacity-20 pointer-events-none" : "hover:border-slate-200",
                isSelected ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 z-10" : "bg-white border-transparent",
                today && !isSelected && "text-emerald-600 bg-emerald-50/50"
              )}
            >
              <span className={cn(
                "text-sm font-black",
                today && !isSelected && "animate-pulse"
              )}>
                {format(day, 'd')}
              </span>
              
              {apps.length > 0 && (
                <div className="absolute bottom-2 flex gap-0.5">
                  {apps.slice(0, 3).map((app, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-white" : 
                        app.type === AppointmentType.CALL ? "bg-blue-500" :
                        app.type === AppointmentType.SITE_VISIT ? "bg-emerald-500" :
                        (app.date && isPast(parseISO(app.date))) ? "bg-rose-500" : "bg-blue-500"
                      )} 
                    />
                  ))}
                  {apps.length > 3 && <div className="w-1 h-1 rounded-full bg-slate-400" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderAppointmentsList = () => {
    const dayApps = getAppointmentsForDate(selectedDate);
    
    return (
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')} Schedule
          </h3>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {dayApps.length} Events
          </span>
        </div>

        {dayApps.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
            <CalendarIcon size={32} className="text-slate-200 mb-3" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No activities scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayApps.map((app) => (
              <div 
                key={app.id}
                className={cn(
                  "p-5 rounded-[2rem] border-2 bg-white flex items-center gap-4 group transition-all hover:shadow-lg active:scale-[0.98]",
                  app.type === AppointmentType.CALL ? "border-blue-50" :
                  app.type === AppointmentType.SITE_VISIT ? "border-emerald-50" :
                  "border-slate-50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  app.type === AppointmentType.CALL ? "bg-blue-50 text-blue-600" :
                  app.type === AppointmentType.SITE_VISIT ? "bg-emerald-50 text-emerald-600" :
                  "bg-slate-50 text-slate-600"
                )}>
                  {app.type === AppointmentType.CALL && <Phone size={20} strokeWidth={2.5} />}
                  {app.type === AppointmentType.SITE_VISIT && <MapPin size={20} strokeWidth={2.5} />}
                  {app.type === AppointmentType.MEETING && <Video size={20} strokeWidth={2.5} />}
                  {app.type === AppointmentType.FOLLOW_UP && <CalendarIcon size={20} strokeWidth={2.5} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg",
                      app.type === AppointmentType.CALL ? "bg-blue-100 text-blue-700" :
                      app.type === AppointmentType.SITE_VISIT ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {app.type}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                      <Clock size={10} />
                      {app.time}
                    </div>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">{app.leadName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <User size={10} className="text-slate-300" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{app.assignedTo.split('@')[0]}</span>
                  </div>
                </div>

                {app.date && isPast(parseISO(app.date)) && !isToday(parseISO(app.date)) && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                      <AlertCircle size={16} strokeWidth={3} />
                    </div>
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Late</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 border border-white shadow-xl shadow-slate-200/50">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      {renderAppointmentsList()}
    </div>
  );
};
