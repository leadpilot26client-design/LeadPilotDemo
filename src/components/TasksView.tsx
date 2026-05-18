import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  LayoutList,
  Search,
  CheckCircle
} from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { Task, TaskStatus } from '../types';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (task: any) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  teamMembers: string[];
}

export const TasksView: React.FC<TasksViewProps> = ({ 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask,
  teamMembers
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [assignedTo, setAssignedTo] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.leadName?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.status === b.status) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return a.status === TaskStatus.PENDING ? -1 : 1;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onAddTask({
      title,
      date,
      assignedTo,
      status: TaskStatus.PENDING
    });
    
    setTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Header & Stats */}
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Control Center</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1.5 flex items-center gap-2">
            <LayoutList size={12} />
            {tasks.filter(t => t.status === TaskStatus.PENDING).length} Active Tasks
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90",
            isAdding ? "bg-slate-900 text-white shadow-slate-200" : "bg-emerald-500 text-white shadow-emerald-200"
          )}
        >
          {isAdding ? <Plus className="rotate-45" size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}
        </button>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-6 border-2 border-emerald-100 shadow-xl shadow-emerald-200/20 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-4">
            <input 
              autoFocus
              type="text" 
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              <div className="relative">
                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:ring-4 focus:ring-emerald-500/10 appearance-none"
                >
                  <option value="admin">Assign: Admin</option>
                  {teamMembers.map(email => (
                    <option key={email} value={email}>Assign: {email.split('@')[0].toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-emerald-500 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 active:scale-95 transition-all hover:bg-emerald-600"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} strokeWidth={2.5} />
        <input 
          type="text" 
          placeholder="Search all tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-3xl pl-14 pr-6 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-200 shadow-xl shadow-slate-200/10 transition-all placeholder:text-slate-300"
        />
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <LayoutList size={24} className="text-slate-200" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
              All caught up!<br />No tasks found.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isLate = isPast(parseISO(task.date)) && !isToday(parseISO(task.date)) && task.status === TaskStatus.PENDING;
            
            return (
              <div 
                key={task.id}
                className={cn(
                  "group p-5 rounded-[2rem] bg-white border border-slate-100 flex items-center gap-4 transition-all hover:shadow-xl active:scale-[0.98]",
                  task.status === TaskStatus.COMPLETED && "opacity-50",
                  isLate && "border-rose-100 bg-rose-50/10"
                )}
              >
                <button 
                  onClick={() => onUpdateTask(task.id, { 
                    status: task.status === TaskStatus.PENDING ? TaskStatus.COMPLETED : TaskStatus.PENDING 
                  })}
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 active:scale-75",
                    task.status === TaskStatus.COMPLETED 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
                      : isLate 
                        ? "bg-rose-50 text-rose-500 border-2 border-rose-100" 
                        : "bg-slate-50 text-slate-300 border-2 border-slate-100 group-hover:border-emerald-200 group-hover:text-emerald-500"
                  )}
                >
                  {task.status === TaskStatus.COMPLETED ? <CheckCircle size={20} strokeWidth={3} /> : <Circle size={20} strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest",
                      isLate ? "text-rose-500" : "text-slate-400"
                    )}>
                      {isToday(parseISO(task.date)) ? 'Due Today' : format(parseISO(task.date), 'MMM d, yyyy')}
                    </span>
                    {task.leadName && (
                      <>
                        <span className="text-slate-200">•</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">{task.leadName}</span>
                      </>
                    )}
                  </div>
                  <h4 className={cn(
                    "text-sm font-extrabold text-slate-900 truncate",
                    task.status === TaskStatus.COMPLETED && "line-through text-slate-400"
                  )}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full">
                      <User size={10} className="text-slate-300" />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{task.assignedTo.split('@')[0]}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
