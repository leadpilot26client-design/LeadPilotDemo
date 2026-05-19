import React, { useState } from 'react';
import { X, Loader2, Award, UserPlus, PhoneCall, Calendar, MessageSquare, ClipboardList } from 'lucide-react';
import { Lead, LeadStatus, DoneReason, AppointmentType, CallOutcome } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface UpdateCallModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onSchedule?: (data: any) => Promise<void>;
  teamMembers: string[];
}

export function UpdateCallModal({ lead, isOpen, onClose, onUpdate, onSchedule, teamMembers }: UpdateCallModalProps) {
  const [loading, setLoading] = useState(false);
  const [createApp, setCreateApp] = useState(false);
  const [formData, setFormData] = useState({
    followUpDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    budget: '',
    location: '',
    propertyType: '',
    appTime: '10:00',
    appType: AppointmentType.FOLLOW_UP as string,
    callOutcome: '' as string
  });

  // Reset/sync form when lead changes
  React.useEffect(() => {
    if (lead && isOpen) {
      document.body.style.overflow = 'hidden';
      setFormData({
        followUpDate: lead.followUpDate ? format(new Date(lead.followUpDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        notes: lead.notes || '',
        budget: lead.budget || '',
        location: lead.location || '',
        propertyType: lead.property || '',
        appTime: '10:00',
        appType: AppointmentType.FOLLOW_UP,
        callOutcome: (lead.callOutcome as string) || ''
      });
      setCreateApp(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const updates: Partial<Lead> = {
      followUpDate: new Date(formData.followUpDate).toISOString(),
      notes: formData.notes,
      budget: formData.budget,
      location: formData.location,
      property: formData.propertyType,
      callOutcome: formData.callOutcome as CallOutcome || undefined
    };

    await onUpdate(lead.id, updates);
    
    if (createApp && onSchedule) {
      const appDateTime = new Date(`${formData.followUpDate}T${formData.appTime}`);
      await onSchedule({
        leadId: lead.id,
        leadName: lead.firstName || lead.name,
        date: appDateTime.toISOString(),
        title: `${formData.appType}: ${lead.firstName || lead.name}`,
        type: formData.appType,
        notes: formData.notes,
        assignedTo: lead.assignedTo || 'admin'
      });
    }
    
    setLoading(false);
    onClose();
  };

  const outcomes = Object.values(CallOutcome);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-500 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-white shrink-0">
          <h3 className="font-bold text-slate-800 text-lg">Update After Call</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-all">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-10">
          {/* Next Follow-up */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Next Follow-up *</label>
            <input 
              type="date" 
              required
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              className="w-full px-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Call Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Call Notes</label>
            <textarea 
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="What did the client say?"
              className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm focus:outline-none focus:border-emerald-500 transition-all resize-none placeholder:text-slate-300"
            />
          </div>

          {/* Appointment Toggle */}
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">Schedule Next Step</p>
              <p className="text-[9px] text-emerald-600 font-bold">Create a reminder for this lead</p>
            </div>
            <button 
              type="button"
              onClick={() => setCreateApp(!createApp)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                createApp ? "bg-emerald-500" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                createApp ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>

          {createApp && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Step Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[AppointmentType.FOLLOW_UP, AppointmentType.SITE_VISIT, AppointmentType.MEETING, AppointmentType.CALL].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, appType: type })}
                        className={cn(
                          "py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.appType === type 
                            ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                            : "bg-white border-slate-50 text-slate-500"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Time</label>
                   <input 
                     type="time" 
                     value={formData.appTime}
                     onChange={(e) => setFormData({ ...formData, appTime: e.target.value })}
                     className="w-full p-3 rounded-xl border-2 border-slate-50 bg-white font-bold text-xs"
                   />
                 </div>
               </div>
            </div>
          )}

          {/* Call Outcome */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Call Outcome</label>
            <div className="flex flex-wrap gap-2">
              {outcomes.map(outcome => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => setFormData({ ...formData, callOutcome: outcome })}
                  className={cn(
                    "px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    formData.callOutcome === outcome 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100" 
                      : "bg-slate-50 border-slate-50 text-slate-500 hover:border-slate-100"
                  )}
                >
                  {outcome}
                </button>
              ))}
            </div>
          </div>

          {/* Lead Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Budget</label>
              <input 
                type="text" 
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g. 50L"
                className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Location</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Kochi"
                className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          <div>
             <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Property Interest</label>
             <select 
               value={formData.propertyType}
               onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
               className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm focus:outline-none focus:border-emerald-500 transition-all appearance-none"
             >
               <option value="">Select Category...</option>
               <option value="Apartment">Apartment</option>
               <option value="Villa">Villa</option>
               <option value="Plot">Plot / Land</option>
               <option value="Commercial">Commercial</option>
             </select>
          </div>

          <div className="pt-2">
            <button
              disabled={loading}
              className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              Save Status Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MarkDoneModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (leadId: string, reason: DoneReason) => Promise<void>;
}

export function MarkDoneModal({ lead, isOpen, onClose, onConfirm }: MarkDoneModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<DoneReason | ''>('');

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setLoading(true);
    await onConfirm(lead.id, reason as DoneReason);
    setLoading(false);
    onClose();
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Follow-up Complete</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Closure Reason Required</p>
          <select 
            required
            value={reason}
            onChange={(e) => setReason(e.target.value as DoneReason)}
            className="w-full p-4 rounded-2xl border-2 border-slate-50 mb-8 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all appearance-none"
          >
            <option value="">Why is this finished?</option>
            <option value={DoneReason.CLOSED_DEAL}>Closed Deal 💰</option>
            <option value={DoneReason.NOT_INTERESTED}>Not Interested 🛑</option>
            <option value={DoneReason.NO_RESPONSE}>No Response ⏳</option>
          </select>
          <button
            disabled={loading || !reason}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Confirm Completion
          </button>
        </form>
      </div>
    </div>
  );
}

interface ReassignModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onReassign: (leadId: string, agentId: string) => Promise<void>;
  teamMembers: string[];
}

export function ReassignModal({ isOpen, lead, onClose, onReassign, teamMembers }: ReassignModalProps) {
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !lead) return null;

  const handleSelect = async (agentId: string) => {
    setLoading(true);
    await onReassign(lead.id, agentId);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-full duration-500 shadow-2xl">
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-4 shadow-inner">
              <UserPlus size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Assign Agent</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              For {lead.firstName || lead.name}
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <button
              disabled={loading}
              onClick={() => handleSelect('admin')}
              className={cn(
                "w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.98] group",
                lead.assignedTo === 'admin' 
                  ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                  : "bg-white border-slate-50 hover:border-slate-100 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                lead.assignedTo === 'admin' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>
                MA
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Master Admin</p>
                <p className={cn(
                  "text-[9px] font-black uppercase tracking-widest leading-none mt-0.5",
                  lead.assignedTo === 'admin' ? "text-white/60" : "text-slate-400"
                )}>Full Access</p>
              </div>
              {lead.assignedTo === 'admin' && <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
            </button>

            {(teamMembers || []).map(email => {
              const initial = email.charAt(0).toUpperCase();
              const name = email.split('@')[0];
              const isSelected = lead.assignedTo === email;
              
              return (
                <button
                  key={email}
                  disabled={loading}
                  onClick={() => handleSelect(email)}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.98] group",
                    isSelected 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                      : "bg-white border-slate-50 hover:border-slate-100 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                    isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {initial}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold capitalize">{name}</p>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest leading-none mt-0.5",
                      isSelected ? "text-white/60" : "text-slate-400"
                    )}>{email}</p>
                  </div>
                  {isSelected && <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
