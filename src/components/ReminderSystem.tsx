import React, { useEffect, useState } from 'react';
import { Bell, Clock, X } from 'lucide-react';
import { parseISO, isToday, differenceInMinutes, format } from 'date-fns';
import { Appointment } from '../types';
import { cn } from '../lib/utils';

interface Reminder {
  id: string;
  message: string;
  time: string;
  type: '30min' | 'now';
  appointmentId: string;
}

interface ReminderSystemProps {
  appointments: Appointment[];
  onFocusLead: (leadId: string) => void;
  enabled?: boolean;
}

export function ReminderSystem({ appointments, onFocusLead, enabled = true }: ReminderSystemProps) {
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [processedReminders, setProcessedReminders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const newReminders: Reminder[] = [];

      appointments.forEach(app => {
        if (!app || !app.date || !app.time || !isToday(parseISO(app.date))) return;

        // Parse time (HH:mm)
        const timeParts = app.time.split(':');
        if (timeParts.length < 2) return;
        
        const hours = Number(timeParts[0]);
        const minutes = Number(timeParts[1]);
        if (isNaN(hours) || isNaN(minutes)) return;
        
        const appDate = new Date(now);
        appDate.setHours(hours, minutes, 0, 0);

        const diffMinutes = differenceInMinutes(appDate, now);
        
        // exact time
        const nowKey = `${app.id}-now`;
        if (diffMinutes === 0 && !processedReminders.has(nowKey)) {
          newReminders.push({
            id: Math.random().toString(),
            message: `${app.type} starting now with ${app.leadName}`,
            time: app.time,
            type: 'now',
            appointmentId: app.id
          });
          setProcessedReminders(prev => new Set(prev).add(nowKey));
        }

        // 30 mins before
        const beforeKey = `${app.id}-30min`;
        if (diffMinutes === 30 && !processedReminders.has(beforeKey)) {
          newReminders.push({
            id: Math.random().toString(),
            message: `Reminder: ${app.type} with ${app.leadName} at ${app.time}`,
            time: app.time,
            type: '30min',
            appointmentId: app.id
          });
          setProcessedReminders(prev => new Set(prev).add(beforeKey));
        }
      });

      if (newReminders.length > 0) {
        setActiveReminders(prev => [...prev, ...newReminders]);
        // Auto remove after 10 seconds? No, let user close or snooze.
      }
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30s
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [appointments, enabled]); // Removed processedReminders to prevent re-trigger cycles

  const removeReminder = (id: string) => {
    setActiveReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleSnooze = (reminder: Reminder, minutes: number) => {
    removeReminder(reminder.id);
    // In a real app, we'd schedule a new reminder. 
    // Here we'll just show a message.
    console.log(`Snoozing reminder ${reminder.id} for ${minutes} minutes`);
  };

  if (activeReminders.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] space-y-3 pointer-events-none">
      {activeReminders.map((reminder) => (
        <div 
          key={reminder.id}
          className="bg-white border-2 border-emerald-500 rounded-[2rem] shadow-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-500 pointer-events-auto max-w-md mx-auto"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                <Bell size={24} className="animate-bounce" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Upcoming Activity</p>
                <p className="text-sm font-black text-slate-900 leading-tight">{reminder.message}</p>
              </div>
            </div>
            <button onClick={() => removeReminder(reminder.id)} className="text-slate-300 hover:text-slate-500 p-1">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleSnooze(reminder, 10)}
              className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              Snooze 10m
            </button>
            <button 
              onClick={() => handleSnooze(reminder, 30)}
              className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              Snooze 30m
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
