import React from 'react';
import { Calendar, CheckSquare, LayoutDashboard, AlertCircle, UserCircle, Plus, BarChart2, ListTodo, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterTab } from '../types';

interface BottomNavProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  onAddClick: () => void;
  todayCount?: number;
  isAdmin?: boolean;
}

export default function BottomNav({ activeTab, onTabChange, onAddClick, todayCount, isAdmin }: BottomNavProps) {
  const navItems = [
    { label: 'Today', icon: Calendar, tab: 'Today' as FilterTab },
    { label: 'Visit', icon: MapPin, tab: 'Site Visits' as FilterTab },
    { label: 'Add', icon: Plus, tab: 'Add' as any },
    { label: 'Tasks', icon: ListTodo, tab: 'Tasks' as FilterTab },
    { label: 'User', icon: UserCircle, tab: 'Settings' as FilterTab },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-6 pt-2 bg-gradient-to-t from-gray-50/80 to-transparent pointer-events-none">
      <nav className="max-w-md mx-auto h-16 bg-white shadow-2xl shadow-emerald-500/10 rounded-2xl flex items-center justify-between px-1 pointer-events-auto border border-slate-100">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.tab === 'Add' ? onAddClick() : onTabChange(item.tab)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all flex-1 py-1 px-0.5 relative rounded-xl",
              activeTab === item.tab 
                ? "text-emerald-700 bg-emerald-50/50" 
                : item.tab === 'Add' ? "text-emerald-500" : "text-gray-400 opacity-60 hover:opacity-100"
            )}
          >
            <item.icon size={item.tab === 'Add' ? 22 : 16} strokeWidth={activeTab === item.tab || item.tab === 'Add' ? 3 : 2} />
            <span className="text-[7.5px] font-black uppercase tracking-tighter leading-none text-center">{item.label}</span>
            {item.tab === 'Today' && todayCount !== undefined && todayCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                {todayCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
