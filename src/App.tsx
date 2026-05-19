import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { parseISO, isToday, isPast, isFuture, startOfDay, format } from 'date-fns';
import { LogOut, Plus, Search, Building2, Users, Bell, AlertCircle, Share2, UserPlus, CheckSquare, Square, ShieldAlert, Loader2, X, LayoutDashboard, Home, MapPin, Video, PhoneCall } from 'lucide-react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, getDocs, orderBy, serverTimestamp, limit } from 'firebase/firestore';

import { Lead, LeadStatus, DoneReason, FilterTab, Appointment, Task, TaskStatus, AppointmentType, CallOutcome } from './types';
import { USERS } from './constants';
import LoginForm from './components/LoginForm';
import PublicLeadForm from './components/PublicLeadForm';
import BottomNav from './components/BottomNav';
import LeadCard from './components/LeadCard';
import StatsCards from './components/StatsCards';
import AddLeadModal from './components/AddLeadModal';
import StatsPage from './components/StatsPage';
import SettingsPage from './components/SettingsPage';
import { CalendarView } from './components/CalendarView';
import { TasksView } from './components/TasksView';
import { ScheduleModal } from './components/ScheduleModal';
import { UpdateCallModal, MarkDoneModal, ReassignModal } from './components/Modals';
import { cn } from './lib/utils';
import { useAuth } from './context/AuthContext';
import { db, logout, handleFirestoreError, OperationType } from './lib/firebase';

import { ActivitySummary } from './components/ActivitySummary';
import { CompactSchedule } from './components/CompactSchedule';
import { ReminderSystem } from './components/ReminderSystem';

// Helper for Google Sheets
const GOOGLE_SHEETS_SCRIPT_URL = (import.meta as any).env.VITE_GOOGLE_SHEETS_URL || 'YOUR_APPS_SCRIPT_URL_HERE';

const sendToGoogleSheets = async (lead: any) => {
  const url = GOOGLE_SHEETS_SCRIPT_URL;
  if (!url || url === 'YOUR_APPS_SCRIPT_URL_HERE') return;
  
  try {
    // Map to EXACT column names requested by user
    const payload = {
      id: lead.id,
      dateAdded: lead.createdAt ? (typeof lead.createdAt === 'string' ? new Date(lead.createdAt).toLocaleString() : new Date().toLocaleString()) : new Date().toLocaleString(),
      firstName: lead.firstName || lead.name || '',
      lastName: lead.lastName || '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || lead.phone || '',
      email: lead.email || '',
      property: lead.property || lead.propertyType || '',
      budget: lead.budget || '',
      location: lead.location || '',
      source: lead.source || 'Public Form',
      followUp: lead.followUpDate || '',
      assignedTo: lead.assignedTo || 'admin',
      status: lead.status || 'Active',
      notes: lead.notes || lead.doneReason || ''
    };

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Sheet Sync Error:', error);
  }
};

function AccessDenied({ email }: { email: string }) {
  const [initializing, setInitializing] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const { error: authError } = useAuth();

  const MASTER_ADMIN = 'leadpilot25@gmail.com';

  // Auto-init for authorized team members
  const handleInitialize = async () => {
    setInitializing(true);
    const emailLower = email.toLowerCase();
    
    try {
      // We use a fixed client ID for the Master Team to ensure everyone stays together
      const MASTER_CLIENT_ID = 'client_lp_master_v1';
      const clientsRef = collection(db, 'clients');
      
      const authorizedEmails = Array.from(new Set([
        MASTER_ADMIN,
        ...USERS.map(u => u.email.toLowerCase()),
        emailLower
      ]));

      // Check if document exists first
      const clientDoc = await getDoc(doc(db, 'clients', MASTER_CLIENT_ID));
      
      if (clientDoc.exists()) {
        const existingData = clientDoc.data();
        const currentUsers = existingData.users || [];
        const mergedUsers = Array.from(new Set([...currentUsers, ...authorizedEmails]));
        
        await updateDoc(doc(db, 'clients', MASTER_CLIENT_ID), {
          users: mergedUsers,
          updatedAt: new Date().toISOString()
        });
        console.log("Updated MASTER client users list");
      } else {
        // Create the master client
        await setDoc(doc(db, 'clients', MASTER_CLIENT_ID), {
          clientId: MASTER_CLIENT_ID,
          maxUsers: 50,
          users: authorizedEmails,
          ownerEmail: MASTER_ADMIN,
          name: 'LeadPilot Master Portal',
          defaultAgent: 'admin',
          createdAt: new Date().toISOString()
        });
        console.log("Created MASTER client portal");
      }
      
      alert('Initialization successful! Restarting...');
      window.location.reload();
    } catch (e: any) {
      console.error("Initialization error:", e);
      alert('Error: ' + (e.message || 'Check Firestore rules or internet connection.'));
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center text-red-500">
          <ShieldAlert size={64} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 text-sm">
            Authenticated as: <span className="font-bold text-gray-900">{email}</span>
          </p>
        </div>

        {authError && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-left">
            <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1 flex items-center gap-1">
              <AlertCircle size={12} /> System Diagnostic
            </p>
            <pre className="text-[9px] text-red-600 font-mono whitespace-pre-wrap overflow-hidden">
              {authError}
            </pre>
          </div>
        )}
        
        {USERS.some(u => u.email.toLowerCase() === email.toLowerCase()) ? (
          <div className="space-y-4">
             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-left">
               <div className="flex justify-between items-center mb-2">
                 <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Authorized Team Member</p>
                 <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">MATCH</span>
               </div>
               <p className="text-[10px] text-emerald-600 font-bold leading-relaxed">
                 You are recognized as an authorized team member in the system code. 
                 If you cannot enter, the database needs to be initialized for your team.
               </p>
             </div>
             
             <button 
              onClick={handleInitialize}
              disabled={initializing}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {initializing ? <Loader2 className="animate-spin" size={20} /> : 'Initialize / Sync Master Team Access'}
            </button>
            <p className="text-[9px] text-gray-400 font-medium">This will grant database permissions to all team emails listed in constants.ts</p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Notice</p>
             <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
               This account is not in the hardcoded USERS list. Contact your Master Admin (leadpilot25@gmail.com) to add you.
             </p>
          </div>
        )}

        <div className="pt-4 space-y-3">
          <button 
            onClick={() => logout()}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-xs hover:bg-gray-200 transition-colors"
          >
            Logout & Try Another Email
          </button>
          
          <button 
            onClick={() => setShowDiagnostic(!showDiagnostic)}
            className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-emerald-500"
          >
            {showDiagnostic ? 'Hide' : 'Show'} Database Config
          </button>
          
          {showDiagnostic && (
            <div className="p-3 bg-slate-900 rounded-xl text-left overflow-hidden">
               <p className="text-[8px] font-mono text-emerald-400 mb-1 tracking-tighter">PROJECT: {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'loading...'}</p>
               <p className="text-[8px] font-mono text-emerald-400 tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">USER: {email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Logo Fallback Helper
const LogoWithFallback = () => {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <Building2 size={24} strokeWidth={2.5} />;
  }
  
  return (
    <img 
      src="/logo.png" 
      alt="LeadPilot" 
      className="w-full h-full object-contain p-1" 
      onError={() => setImgError(true)} 
    />
  );
};

function Dashboard({ user, clientData, leads, appointments, tasks }: { 
  user: any;
  clientData: any;
  leads: Lead[];
  appointments: Appointment[];
  tasks: Task[];
}) {
  const [activeTab, setActiveTab] = useState<FilterTab>('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [appTypeFilter, setAppTypeFilter] = useState<AppointmentType | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedLeadForUpdate, setSelectedLeadForUpdate] = useState<Lead | null>(null);
  const [initialUpdateType, setInitialUpdateType] = useState<AppointmentType | null>(null);
  const [selectedLeadForDone, setSelectedLeadForDone] = useState<Lead | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkAssignUserId, setBulkAssignUserId] = useState('');
  const [selectedLeadForReassign, setSelectedLeadForReassign] = useState<Lead | null>(null);
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);

  // Focus specific lead from schedule
  const handleFocusLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    setSearchQuery('');
    setAppTypeFilter(null);
    setActiveTab('All'); // Show all to ensure it's visible
    setSelectedLeadId(leadId);
    
    // Smooth scroll to card
    setTimeout(() => {
      const element = document.getElementById(`lead-${leadId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Memos FIRST
  const leadsByAccess = useMemo(() => {
    if (!leads) return [];
    if (!clientData) return [];
    const isOwner = user.email === clientData.ownerEmail;
    let baseLeads = leads.filter(l => !!l);
    if (!isOwner) {
      baseLeads = baseLeads.filter(l => l.assignedTo === user.email || l.assignedTo === user.uid);
    }
    
    if (isOwner && agentFilter !== 'all') {
      baseLeads = baseLeads.filter(l => l.assignedTo === agentFilter);
    }
    
    return baseLeads;
  }, [leads, user, clientData, agentFilter]);

  const alertLeads = useMemo(() => {
    return (leadsByAccess || []).filter(l => 
      l && l.status === LeadStatus.ACTIVE && l.followUpDate &&
      (isToday(parseISO(l.followUpDate)) || isPast(parseISO(l.followUpDate)))
    );
  }, [leadsByAccess]);

  const filteredLeads = useMemo(() => {
    let result = [...(leadsByAccess || [])];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => {
        if (!l) return false;
        const nameMatch = (l.firstName || l.name || '').toLowerCase().includes(q) || 
                         (l.lastName && l.lastName.toLowerCase().includes(q));
        const propMatch = (l.property && l.property.toLowerCase().includes(q)) ||
                         (l.propertyType && l.propertyType.toLowerCase().includes(q));
        const phoneMatch = l.phone && l.phone.includes(q);
        return nameMatch || propMatch || phoneMatch;
      });
    }

    if (appTypeFilter) {
      const idsWithApp = (appointments || [])
        .filter(a => a && a.type === appTypeFilter && a.date && a.date.length > 5 && isToday(parseISO(a.date)))
        .map(a => a.leadId);
      result = result.filter(l => l && idsWithApp.includes(l.id));
      
      // If we are filtering by appointment type, we don't want the tab filters to hide our results
      return result.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      });
    }

    switch (activeTab) {
      case 'Dashboard':
        result = result.filter(l => l && l.status === LeadStatus.ACTIVE && l.followUpDate && l.followUpDate.length > 5 && isToday(parseISO(l.followUpDate)));
        result.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
        break;
      case 'Today':
        result = result.filter(l => l && l.status === LeadStatus.ACTIVE && l.followUpDate && l.followUpDate.length > 5 && isToday(parseISO(l.followUpDate)));
        result.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
        break;
      case 'Overdue':
        result = result.filter(l => l && l.status === LeadStatus.ACTIVE && l.followUpDate && l.followUpDate.length > 5 && isPast(parseISO(l.followUpDate)) && !isToday(parseISO(l.followUpDate)));
        result.sort((a, b) => {
          const dateA = new Date(a.followUpDate || 0).getTime();
          const dateB = new Date(b.followUpDate || 0).getTime();
          return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
        });
        break;
      case 'Upcoming':
        result = result.filter(l => l && l.status === LeadStatus.ACTIVE && l.followUpDate && l.followUpDate.length > 5 && isFuture(parseISO(l.followUpDate)));
        result.sort((a, b) => {
          const dateA = new Date(a.followUpDate || 0).getTime();
          const dateB = new Date(b.followUpDate || 0).getTime();
          return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
        });
        break;
      case 'Done':
        result = result.filter(l => l && l.status === LeadStatus.DONE);
        result.sort((a, b) => {
          const dateA = new Date(a.updatedAt || 0).getTime();
          const dateB = new Date(b.updatedAt || 0).getTime();
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
        break;
      case 'Site Visits':
        const siteVisitLeadIds = new Set(
          (appointments || [])
            .filter(a => a && a.type === AppointmentType.SITE_VISIT)
            .map(a => a.leadId)
        );
        result = result.filter(l => l && (siteVisitLeadIds.has(l.id) || l.notes?.toLowerCase().includes('site visit') || l.callOutcome === CallOutcome.SITE_VISIT));
        result.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
        break;
      case 'All':
        result.sort((a, b) => {
          if (!a || !b) return 0;
          if (a.status !== b.status) return a.status === LeadStatus.ACTIVE ? -1 : 1;
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
        break;
    }

    return result;
  }, [leadsByAccess, searchQuery, activeTab, appTypeFilter, appointments]);

  const stats = useMemo(() => {
    const list = leadsByAccess || [];
    const accessibleLeadIds = new Set(list.map(l => l.id));
    const todayAcrossAccess = (appointments || []).filter(a => 
      a && a.date && a.date.length > 5 && isToday(parseISO(a.date)) && accessibleLeadIds.has(a.leadId)
    );
    const todayDoneLeads = list.filter(l => l && l.status === LeadStatus.DONE && l.updatedAt && l.updatedAt.length > 5 && isToday(parseISO(l.updatedAt))).length;
    
    // Dynamic counts for activity summary
    const activityCounts: Record<AppointmentType, number> = {
      [AppointmentType.CALL]: todayAcrossAccess.filter(a => a && a.type === AppointmentType.CALL).length,
      [AppointmentType.SITE_VISIT]: todayAcrossAccess.filter(a => a && a.type === AppointmentType.SITE_VISIT).length,
      [AppointmentType.MEETING]: todayAcrossAccess.filter(a => a && a.type === AppointmentType.MEETING).length,
      [AppointmentType.FOLLOW_UP]: todayAcrossAccess.filter(a => a && a.type === AppointmentType.FOLLOW_UP).length,
    };

    return {
      today: list.filter(l => l && l.status === LeadStatus.ACTIVE && l.followUpDate && l.followUpDate.length > 5 && isToday(parseISO(l.followUpDate))).length,
      overdue: list.filter(l => l && l.status === LeadStatus.ACTIVE && l.followUpDate && l.followUpDate.length > 5 && isPast(parseISO(l.followUpDate)) && !isToday(parseISO(l.followUpDate))).length,
      total: list.length,
      upcoming: list.filter(l => l && l.status === LeadStatus.ACTIVE && l.followUpDate && l.followUpDate.length > 5 && isFuture(parseISO(l.followUpDate))).length,
      done: list.filter(l => l && l.status === LeadStatus.DONE).length,
      doneToday: todayDoneLeads,
      dailyGoal: 20,
      busyLevel: todayAcrossAccess.length > 8 ? 'High' : todayAcrossAccess.length > 4 ? 'Moderate' : 'Light',
      activityCounts,
      todayAppointments: todayAcrossAccess,
      totalActivitiesToday: todayAcrossAccess.length
    };
  }, [leadsByAccess, appointments]);

  const priorityAppointments = useMemo(() => {
    return (appointments || []).filter(a => 
      a && a.date && a.date.length > 5 && (a.type === AppointmentType.SITE_VISIT || a.type === AppointmentType.MEETING) && 
      (!isPast(parseISO(a.date)) || isToday(parseISO(a.date)))
    ).sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
    });
  }, [appointments]);

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showFollowUpAlert, setShowFollowUpAlert] = useState(false);

  // Effects AFTER memos
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (alertLeads.length > 0) {
      setShowFollowUpAlert(true);
      const timer = setTimeout(() => setShowFollowUpAlert(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [alertLeads.length > 0]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleInstall = async () => {
    if (!installPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert('To install on iPhone:\n1. Tap Share (bottom icon)\n2. Tap "Add to Home Screen"');
      } else {
        alert('To install on Android:\n1. Tap Chrome Menu (top right)\n2. Tap "Install App"');
      }
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // Logic functions
  const deleteLead = async (leadId: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteDoc(doc(db, 'leads', leadId));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const reassignLead = async (leadId: string, agentId: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), { 
        assignedTo: agentId, 
        updatedAt: new Date().toISOString() 
      });
      const fullLead = leads.find(l => l.id === leadId);
      if (fullLead) {
        await sendToGoogleSheets({ ...fullLead, assignedTo: agentId, updateType: 'REASSIGN' });
      }
    } catch (e) {
      console.error(e);
      alert('Failed to reassign lead.');
    }
  };
  
  const toggleLeadSelection = (id: string) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignUserId || selectedLeads.length === 0) return;
    try {
      const updatedAt = new Date().toISOString();
      await Promise.all(selectedLeads.map(async (id) => {
        await updateDoc(doc(db, 'leads', id), { assignedTo: bulkAssignUserId, updatedAt });
        const lead = leads.find(l => l.id === id);
        if (lead) {
          await sendToGoogleSheets({ ...lead, assignedTo: bulkAssignUserId, updatedAt, updateType: 'BULK_ASSIGN' });
        }
      }));
      setSelectedLeads([]);
      setIsBulkMode(false);
      setBulkAssignUserId('');
    } catch (e) {
      console.error(e);
      alert('Failed to update leads.');
    }
  };

  const addLead = async (data: any) => {
    const isDuplicate = leads.some(l => l.phone === data.phone && l.status === LeadStatus.ACTIVE);
    if (isDuplicate) throw new Error('DUPLICATE');

    const leadId = Math.random().toString(36).substr(2, 9);
    const newLead = {
      ...data,
      id: leadId,
      clientId: clientData?.clientId,
      status: LeadStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'leads', leadId), newLead);
    await sendToGoogleSheets(newLead);
  };

  const updateLeadFollowUp = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const leadRef = doc(db, 'leads', leadId);
      const updatedFields = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(leadRef, updatedFields);
      
      const fullLead = leads.find(l => l.id === leadId);
      if (fullLead) {
        await sendToGoogleSheets({ ...fullLead, ...updatedFields, updateType: 'FOLLOW_UP' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markLeadDone = async (leadId: string, reason: DoneReason) => {
    try {
      const leadRef = doc(db, 'leads', leadId);
      const updatedFields = {
        status: LeadStatus.DONE,
        doneReason: reason,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(leadRef, updatedFields);
      
      const fullLead = leads.find(l => l.id === leadId);
      if (fullLead) {
        await sendToGoogleSheets({ ...fullLead, ...updatedFields, updateType: 'status_DONE' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (taskData: any) => {
    try {
      const taskId = Math.random().toString(36).substr(2, 9);
      const newTask = {
        ...taskData,
        id: taskId,
        clientId: clientData.clientId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'tasks', taskId), newTask);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleScheduleAppointment = async (appData: any) => {
    try {
      const appId = Math.random().toString(36).substr(2, 9);
      const newApp = {
        ...appData,
        id: appId,
        clientId: clientData.clientId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'appointments', appId), newApp);
      
      // Also update lead's follow up date if it's a follow-up type
      if (appData.type === AppointmentType.FOLLOW_UP) {
        await updateLeadFollowUp(appData.leadId, { followUpDate: appData.date });
      }

      setSchedulingLead(null);
    } catch (e) {
      console.error(e);
    }
  };

  const dashboardFilter = (tab: FilterTab) => {
    setActiveTab(tab);
    setAppTypeFilter(null);
    if (tab === 'Today' || tab === 'Dashboard') {
      const element = document.getElementById('today-schedule');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const todayStr = format(new Date(), 'EEEE, MMMM d');
  const publicFormUrl = useMemo(() => {
    if (!clientData?.clientId) return '';
    try {
      const url = new URL(window.location.href);
      return `${url.origin}/lead-form?cid=${clientData.clientId}`;
    } catch (e) {
      return `${window.location.origin}/lead-form?cid=${clientData.clientId}`;
    }
  }, [clientData?.clientId]);

  const handleSharePublicForm = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LeadPilot CRM Form',
          text: 'Submit your details here:',
          url: publicFormUrl
        });
      } catch (err) {
        navigator.clipboard.writeText(publicFormUrl);
        alert('Link copied!');
      }
    } else {
      navigator.clipboard.writeText(publicFormUrl);
      alert('Link copied!');
    }
  };

  const cUser = { 
    id: user.uid, 
    username: user.displayName || user.email, 
    email: user.email,
    role: user.email === clientData?.ownerEmail ? 'admin' : 'agent' 
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-emerald-100 italic-selection overflow-x-hidden">
      <div className="max-w-md mx-auto relative min-h-screen flex flex-col shadow-2xl shadow-slate-200 bg-white sm:bg-white">
        <ReminderSystem 
          appointments={appointments} 
          onFocusLead={handleFocusLead}
          enabled={remindersEnabled}
        />
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          {/* Startup Follow-up Alert */}
          {showFollowUpAlert && (
            <div className="bg-rose-500 text-white p-3 flex items-center justify-between px-5 animate-in slide-in-from-top duration-500 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Bell size={16} className="animate-bounce" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Action Required</p>
                  <p className="text-[11px] font-medium opacity-90">{alertLeads.length} leads pending for follow-up today.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setActiveTab('Today');
                    setShowFollowUpAlert(false);
                  }}
                  className="bg-white text-rose-600 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                >
                  View Now
                </button>
                <button onClick={() => setShowFollowUpAlert(false)} className="p-1 opacity-60 hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <header className="px-5 pt-5 pb-3">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl border border-slate-100 flex items-center justify-center bg-white transition-all">
                  <LogoWithFallback />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">LeadPilot</h1>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-[0.15em] mt-1.5">{todayStr}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('Dashboard')}
                  className={cn(
                    "w-11 h-11 flex items-center justify-center rounded-2xl transition-all active:scale-95 border shadow-sm",
                    activeTab === 'Dashboard' 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-200" 
                      : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Home size={20} strokeWidth={2.5} />
                </button>
                
                <button 
                  onClick={() => logout()}
                  className="bg-white text-gray-400 w-11 h-11 rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95 border border-slate-100 shadow-sm"
                >
                  <LogOut size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {activeTab !== 'Stats' && activeTab !== 'Settings' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                {activeTab === 'Dashboard' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <ActivitySummary 
                      counts={stats.activityCounts} 
                      activeFilter={appTypeFilter}
                      onFilterChange={(type) => {
                        setAppTypeFilter(type);
                        if (type) {
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }
                      }}
                    />

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 mb-4">Quick Stats</p>
                      <StatsCards 
                        todayCount={stats.today} 
                        overdueCount={stats.overdue} 
                        totalLeads={stats.total} 
                        upcomingCount={stats.upcoming} 
                        doneCount={stats.done}
                        activeTab={activeTab}
                        onCardClick={dashboardFilter} 
                      />
                    </div>
                  </div>
                )}

                {/* Sub-header Controls: Search & Agent Filter */}
                <div className="space-y-4 pb-2">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={16} strokeWidth={2.5} />
                    <input 
                      type="text" 
                      placeholder="Search leads, property, phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-200 shadow-sm transition-all placeholder:text-gray-300"
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        {user.email === clientData?.ownerEmail && (
                          <button 
                            onClick={() => {
                              setIsBulkMode(!isBulkMode);
                              setSelectedLeads([]);
                            }}
                            className={cn(
                              "text-[10px] font-black uppercase tracking-[0.1em] px-5 py-2.5 rounded-full border transition-all flex items-center gap-2 shadow-sm active:scale-95",
                              isBulkMode ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                            )}
                          >
                            <UserPlus size={14} strokeWidth={2.5} />
                            {isBulkMode ? 'Cancel' : 'Bulk'}
                          </button>
                        )}
                      </div>
                      
                      <div className={cn(
                        "text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-sm transition-colors",
                        appTypeFilter === AppointmentType.SITE_VISIT ? "bg-blue-50 text-blue-600 border-blue-100" :
                        appTypeFilter === AppointmentType.MEETING ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        appTypeFilter === AppointmentType.FOLLOW_UP ? "bg-slate-50 text-slate-600 border-slate-100" :
                        appTypeFilter === AppointmentType.CALL ? "bg-orange-50 text-orange-600 border-orange-100" :
                        activeTab === 'Today' || activeTab === 'Dashboard' ? "bg-slate-50 text-slate-600 border-slate-100" : 
                        activeTab === 'Overdue' ? "bg-rose-50 text-rose-600 border-rose-100" : 
                        "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          appTypeFilter === AppointmentType.SITE_VISIT ? "bg-blue-500 animate-pulse" :
                          appTypeFilter === AppointmentType.MEETING ? "bg-emerald-500 animate-pulse" :
                          appTypeFilter === AppointmentType.FOLLOW_UP ? "bg-slate-500 animate-pulse" :
                          appTypeFilter === AppointmentType.CALL ? "bg-orange-500 animate-pulse" :
                          activeTab === 'Today' || activeTab === 'Dashboard' ? "bg-slate-400 animate-pulse" : 
                          activeTab === 'Overdue' ? "bg-rose-500 animate-pulse" : "bg-blue-500 animate-pulse"
                        )} />
                        {filteredLeads.length} {
                          appTypeFilter === AppointmentType.SITE_VISIT ? 'Site Visit' :
                          appTypeFilter === AppointmentType.MEETING ? 'Meeting' :
                          appTypeFilter === AppointmentType.FOLLOW_UP ? 'Follow-up' :
                          appTypeFilter === AppointmentType.CALL ? 'Call Back' :
                          activeTab === 'Dashboard' ? 'HOME' : 
                          activeTab
                        } Records
                      </div>
                    </div>

                    {user.email === clientData?.ownerEmail && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar">
                        <button 
                          onClick={() => setAgentFilter('all')}
                          className={cn(
                            "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm",
                            agentFilter === 'all' ? "bg-emerald-500 text-white border-emerald-500 shadow-md scale-105" : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"
                          )}
                        >
                          All
                        </button>
                        <button 
                          onClick={() => setAgentFilter('admin')}
                          className={cn(
                            "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm",
                            agentFilter === 'admin' ? "bg-emerald-500 text-white border-emerald-500 shadow-md scale-105" : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"
                          )}
                        >
                          Admin
                        </button>
                        {(clientData?.users || []).filter((u: string) => u !== clientData?.ownerEmail).map((email: string) => (
                          <button 
                            key={email}
                            onClick={() => setAgentFilter(email)}
                            className={cn(
                              "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm",
                              agentFilter === email ? "bg-emerald-500 text-white border-emerald-500 shadow-md scale-105" : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"
                            )}
                          >
                            {email.split('@')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </header>
        </div>

        <main className="p-5 pb-32 space-y-8 flex-1">
          {activeTab === 'Stats' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <StatsPage 
                leads={leadsByAccess} 
                currentUser={cUser as any} 
                teamMembers={clientData?.users || []} 
                clientId={clientData?.clientId} 
              />
            </div>
          ) : activeTab === 'Settings' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SettingsPage 
                user={cUser as any} 
                onLogout={logout} 
                onUpdateProfile={() => {}} 
                clientData={clientData} 
                onInstall={handleInstall}
                canInstall={!!installPrompt}
                remindersEnabled={remindersEnabled}
                onToggleReminders={() => setRemindersEnabled(!remindersEnabled)}
              />
            </div>
          ) : activeTab === 'Calendar' ? (
            <CalendarView appointments={appointments} />
          ) : activeTab === 'Tasks' ? (
            <TasksView 
              tasks={tasks} 
              onAddTask={handleAddTask} 
              onUpdateTask={handleUpdateTask} 
              onDeleteTask={handleDeleteTask} 
              teamMembers={clientData?.users || []}
            />
          ) : (
            <>
              <div className="space-y-6">
                
                {isBulkMode && (
                  <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-200 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">Bulk Assignment Mode</p>
                    <p className="text-xs text-emerald-600">Tap leads below to select/deselect them. After selecting, use the panel that appears to assign them all at once.</p>
                  </div>
                )}
                
                {isBulkMode && selectedLeads.length > 0 && (
                  <div className="bg-white p-4 rounded-3xl border-2 border-emerald-500 shadow-2xl shadow-emerald-200 animate-in zoom-in duration-300 sticky top-24 z-30">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-gray-900">{selectedLeads.length} Leads Ready</p>
                      <button onClick={() => setSelectedLeads([])} className="text-[10px] text-gray-400 font-bold uppercase hover:text-red-500">Reset Selection</button>
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={bulkAssignUserId}
                        onChange={(e) => setBulkAssignUserId(e.target.value)}
                        className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Choose Agent...</option>
                        <option value="admin">Master Admin</option>
                        {(clientData?.users || []).filter((u: string) => u !== clientData?.ownerEmail).map((u: string) => (
                          <option key={u} value={u}>{u.split('@')[0].toUpperCase()}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleBulkAssign}
                        disabled={!bulkAssignUserId}
                        className="bg-emerald-600 text-white px-6 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all shadow-md"
                      >
                        Assign Now
                      </button>
                    </div>
                  </div>
                )}
                
                {filteredLeads.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center animate-in fade-in zoom-in duration-500 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <LayoutDashboard size={32} strokeWidth={1} />
                    </div>
                    <h3 className="text-slate-900 font-black uppercase text-[10px] tracking-[0.2em] mb-2 italic">Clean Slate</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">No records found matching your current view or search query.</p>
                  </div>
                ) : (
                  filteredLeads.map(lead => {
                    const leadApps = (appointments || []).filter(a => a && a.leadId === lead.id).sort((a, b) => {
                      const dateA = new Date(a.date || 0).getTime();
                      const dateB = new Date(b.date || 0).getTime();
                      return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
                    });
                    const nextApp = leadApps.find(a => a.date && a.date.length > 5 && (!isPast(parseISO(a.date)) || isToday(parseISO(a.date))));
                    const leadTasks = tasks.filter(t => t.leadId === lead.id && t.status === TaskStatus.PENDING);

                    return (
                      <LeadCard 
                        key={lead.id}
                        lead={lead} 
                        onUpdateAfterCall={(l, type) => {
                          setSelectedLeadForUpdate(l);
                          setInitialUpdateType(type || null);
                        }}
                        onMarkDone={(l) => setSelectedLeadForDone(l)}
                        onDelete={() => deleteLead(lead.id)}
                        onReassign={(l, agentId) => {
                          if (agentId) reassignLead(l.id, agentId);
                          else setSelectedLeadForReassign(l);
                        }}
                        onSchedule={(l) => setSchedulingLead(l)}
                        isAdmin={user.email === clientData?.ownerEmail}
                        isSelectable={isBulkMode}
                        isSelected={selectedLeads.includes(lead.id)}
                        onToggleSelect={() => toggleLeadSelection(lead.id)}
                        isActive={selectedLeadId === lead.id}
                        onActiveClick={() => setSelectedLeadId(lead.id === selectedLeadId ? null : lead.id)}
                        teamMembers={clientData?.users || []}
                        nextAppointment={nextApp}
                        pendingTasks={leadTasks}
                      />
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>

        <BottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onAddClick={() => setIsAddMode(true)} 
          todayCount={stats.today} 
          isAdmin={user.email === clientData?.ownerEmail}
        />

        <AddLeadModal 
          isOpen={isAddMode} 
          onClose={() => setIsAddMode(false)} 
          onAdd={addLead} 
          currentUser={cUser as any} 
          teamMembers={clientData?.users || []}
          defaultAssignee={clientData?.defaultAgent}
        />
        <UpdateCallModal 
          isOpen={!!selectedLeadForUpdate} 
          lead={selectedLeadForUpdate} 
          onClose={() => {
            setSelectedLeadForUpdate(null);
            setInitialUpdateType(null);
          }} 
          onUpdate={updateLeadFollowUp} 
          onSchedule={handleScheduleAppointment}
          teamMembers={clientData?.users || []}
          initialType={initialUpdateType}
        />
        <MarkDoneModal isOpen={!!selectedLeadForDone} lead={selectedLeadForDone} onClose={() => setSelectedLeadForDone(null)} onConfirm={markLeadDone} />
        <ReassignModal 
          isOpen={!!selectedLeadForReassign} 
          lead={selectedLeadForReassign} 
          onClose={() => setSelectedLeadForReassign(null)} 
          onReassign={reassignLead}
          teamMembers={(clientData?.users || []).filter((u: string) => u !== clientData?.ownerEmail)}
        />
        {schedulingLead && (
          <ScheduleModal 
            lead={schedulingLead} 
            onClose={() => setSchedulingLead(null)} 
            onSchedule={handleScheduleAppointment}
            teamMembers={clientData?.users || []}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  const { user, loading, authorized, clientData } = useAuth();
  
  // Real-time leads sync
  const leadsRef = collection(db, 'leads');
  const leadsQuery = user && clientData ? query(
    leadsRef, 
    where('clientId', '==', clientData.clientId),
    orderBy('createdAt', 'desc')
  ) : null;
  
  const [leadsValue, leadsLoading] = useCollectionData(leadsQuery);
  const leads = (leadsValue as Lead[]) || [];

  // Appointments sync
  const appointmentsRef = collection(db, 'appointments');
  const appointmentsQuery = user && clientData ? query(
    appointmentsRef,
    where('clientId', '==', clientData.clientId),
    orderBy('date', 'asc')
  ) : null;
  const [appointmentsValue] = useCollectionData(appointmentsQuery);
  const appointments = (appointmentsValue as Appointment[]) || [];

  // Tasks sync
  const tasksRef = collection(db, 'tasks');
  const tasksQuery = user && clientData ? query(
    tasksRef,
    where('clientId', '==', clientData.clientId),
    orderBy('date', 'asc')
  ) : null;
  const [tasksValue] = useCollectionData(tasksQuery);
  const tasks = (tasksValue as Task[]) || [];

  const [initializationStatus, setInitializationStatus] = useState<'loading' | 'slow'>('loading');

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setInitializationStatus('slow');
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setInitializationStatus('loading');
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
        {initializationStatus === 'slow' && (
          <div className="animate-in fade-in duration-500 space-y-4">
            <p className="text-slate-500 font-bold">Taking longer than usual...</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
              Verifying Authentication & Connection<br/>
              Check if Firebase is reachable
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
            >
              Reload App
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/lead-form" element={<PublicLeadForm onSubmit={async (data) => {
            // Need CID from URL for public form
            const params = new URLSearchParams(window.location.search);
            const cid = params.get('cid');
            if (!cid) return;
            const leadId = Math.random().toString(36).substr(2, 9);
            const now = new Date().toISOString();
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + 1); // Default +1 day

            const clientDoc = await getDoc(doc(db, 'clients', cid));
            const cData = clientDoc.exists() ? clientDoc.data() : null;
            const defaultAssignee = cData?.defaultAgent || 'admin';

            const newLead = {
              id: leadId,
              clientId: cid,
              firstName: data.firstName,
              lastName: '',
              phone: data.phone,
              whatsapp: data.phone,
              email: '',
              property: data.property,
              budget: '',
              location: '',
              source: 'Public Form',
              followUpDate: followUpDate.toISOString(),
              status: LeadStatus.ACTIVE,
              assignedTo: defaultAssignee,
              notes: 'Lead from public form',
              createdAt: now,
              updatedAt: now,
            };
            await setDoc(doc(db, 'leads', leadId), newLead);
            await sendToGoogleSheets(newLead);
          }} />} />
          <Route path="*" element={<LoginForm />} />
        </Routes>
      </Router>
    );
  }

  if (!authorized) {
    return <AccessDenied email={user.email!} />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<Dashboard user={user} clientData={clientData} leads={leads} appointments={appointments} tasks={tasks} />} 
        />
        <Route path="/lead-form" element={<PublicLeadForm onSubmit={async (data) => {
          const leadId = Math.random().toString(36).substr(2, 9);
          const now = new Date().toISOString();
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + 1);

          const newLead = {
            id: leadId,
            clientId: clientData.clientId,
            firstName: data.firstName,
            lastName: '',
            phone: data.phone,
            whatsapp: data.phone,
            email: '',
            property: data.property,
            budget: '',
            location: '',
            source: 'Public Form',
            followUpDate: followUpDate.toISOString(),
            status: LeadStatus.ACTIVE,
            assignedTo: clientData.defaultAgent || 'admin',
            notes: 'Lead from public form',
            createdAt: now,
            updatedAt: now,
          };
          await setDoc(doc(db, 'leads', leadId), newLead);
          await sendToGoogleSheets(newLead);
        }} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
