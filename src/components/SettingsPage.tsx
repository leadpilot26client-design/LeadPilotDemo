import { useState } from 'react';
import { User, LogOut, Check, Save, UserCircle, Briefcase, Mail, UserPlus, Trash2, ShieldCheck, AlertCircle, PlusCircle, Share2, Bell, RefreshCw, Loader2 } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { User as UserType } from '../types';
import { USERS } from '../constants';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface SettingsPageProps {
  user: UserType;
  onUpdateProfile: (updates: Partial<UserType>) => void;
  onLogout: () => void;
  clientData?: any;
  onInstall?: () => void;
  canInstall?: boolean;
  remindersEnabled?: boolean;
  onToggleReminders?: () => void;
}

export default function SettingsPage({ 
  user, 
  onUpdateProfile, 
  onLogout, 
  clientData, 
  onInstall, 
  canInstall,
  remindersEnabled = true,
  onToggleReminders
}: SettingsPageProps) {
  const [username, setUsername] = useState(user.username);
  const [isSaved, setIsSaved] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncTeam = async () => {
    if (!clientData || !user.email) return;
    setSyncing(true);
    try {
      const authorizedEmails = Array.from(new Set([
        user.email.toLowerCase(),
        ...USERS.map(u => u.email.toLowerCase())
      ]));

      const clientRef = doc(db, 'clients', clientData.clientId);
      await updateDoc(clientRef, {
        users: authorizedEmails,
        updatedAt: new Date().toISOString()
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      alert('Team access synced successfully! All authorized agents can now log in.');
    } catch (e) {
      console.error(e);
      alert('Failed to sync team. Please check your connection.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = () => {
    onUpdateProfile({ username });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddUser = async (emailToAdd?: string) => {
    const targetEmail = (emailToAdd || newUserEmail).toLowerCase().trim();
    if (!targetEmail || !clientData) return;
    
    if (clientData.users.includes(targetEmail)) {
      alert("This agent has already been added.");
      return;
    }

    if (clientData.users.length >= clientData.maxUsers) {
      alert("Plan limit reached. You can only have " + clientData.maxUsers + " agents.");
      return;
    }
    
    setLoading(true);
    try {
      const clientRef = doc(db, 'clients', clientData.clientId);
      await updateDoc(clientRef, {
        users: arrayUnion(targetEmail)
      });
      setNewUserEmail('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to add agent. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (email === clientData.ownerEmail) return;
    if (!window.confirm(`Are you sure you want to remove agent ${email}?`)) return;

    try {
      const clientRef = doc(db, 'clients', clientData.clientId);
      await updateDoc(clientRef, {
        users: arrayRemove(email)
      });
    } catch (e) {
      console.error(e);
      alert('Failed to remove agent.');
    }
  };

  const isOwner = clientData && (user.email === clientData.ownerEmail || user.username === clientData.ownerEmail);

  const handleUpdateDefaultAgent = async (email: string) => {
    if (!clientData) return;
    try {
      const clientRef = doc(db, 'clients', clientData.clientId);
      await updateDoc(clientRef, {
        defaultAgent: email
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to update default agent.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
          <UserCircle size={48} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
        <span className="mt-1 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
          {isOwner ? 'Company Administrator' : 'Sales Representative'}
        </span>
      </div>

      {clientData && isOwner && (
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-1">
              <RefreshCw size={16} className="text-emerald-600" />
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Authorized Team Sync</h3>
            </div>
            {isSaved && (
             <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-top-2 duration-300">
               <Check size={12} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Synced</span>
             </div>
           )}
          </div>
          <p className="text-[10px] text-emerald-600 font-medium px-1 leading-relaxed">
            Push the authorized users defined in the app constants to the database to ensure all team members have access.
          </p>
          <button 
            onClick={handleSyncTeam}
            disabled={syncing}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {syncing ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <RefreshCw size={18} />
                <span>Sync Authorized Team Access</span>
              </>
            )}
          </button>
        </div>
      )}

      {clientData && isOwner && (
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Share2 size={16} className="text-emerald-600" />
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Public Lead Form</h3>
          </div>
          <p className="text-[10px] text-emerald-600 font-medium px-1 leading-relaxed">
            Share this link on your social media, business cards, or website. Leads will automatically sync to your app and Google Sheet.
          </p>
          <div className="p-4 bg-white rounded-2xl border border-emerald-100 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Your Link</p>
              <p className="text-[10px] text-emerald-600 font-mono underline truncate leading-relaxed">
                {`${window.location.origin}/lead-form?cid=${clientData.clientId}`}
              </p>
            </div>
            <button 
              onClick={() => {
                const url = `${window.location.origin}/lead-form?cid=${clientData.clientId}`;
                if (navigator.share) {
                  navigator.share({ title: 'LeadPilot Form', url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard!');
                }
              }}
              className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100 active:scale-95 transition-all"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      )}

      {clientData && isOwner && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Assignment Settings</h3>
           <div className="space-y-4">
             <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Global Default Agent</label>
               <select 
                 value={clientData.defaultAgent || 'admin'}
                 onChange={(e) => handleUpdateDefaultAgent(e.target.value)}
                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none"
               >
                 <option value="admin">Master Admin (Default)</option>
                 {clientData.users.filter((u: string) => u !== clientData.ownerEmail && u !== 'admin').map((email: string) => (
                   <option key={email} value={email}>{email}</option>
                 ))}
               </select>
               <p className="mt-2 text-[10px] text-gray-400 font-medium px-1">
                 New leads from the public form will be automatically assigned to this person.
               </p>
             </div>
           </div>
           {isSaved && (
             <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-top-2 duration-300">
               <Check size={16} />
               <span className="text-xs font-bold uppercase tracking-widest">Settings Updated</span>
             </div>
           )}
        </div>
      )}

      {clientData && isOwner && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Team Members</h3>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold",
              clientData.users.length >= clientData.maxUsers ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {clientData.users.length} / {clientData.maxUsers} Agents
            </span>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-[10px] text-blue-700 font-medium">
             Add agents by email to allow them to log in and manage leads assigned to them.
          </div>

          {showSuccess && (
            <div className="p-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest text-center animate-in slide-in-from-top duration-300">
               Agent added successfully!
            </div>
          )}

          <div className="space-y-3">
            {clientData.users.map((email: string) => (
              <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100">
                    <Mail size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{email}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      {email === clientData.ownerEmail ? 'Owner' : 'Agent'}
                    </p>
                  </div>
                </div>
                {email !== clientData.ownerEmail && (
                  <button 
                    onClick={() => handleRemoveUser(email)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {clientData.users.length < clientData.maxUsers ? (
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">Add New Agent</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="agent@email.com"
                  />
                </div>
                <button 
                  onClick={() => handleAddUser()}
                  disabled={!newUserEmail.includes('@') || loading}
                  className="bg-emerald-500 text-white px-6 h-14 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all disabled:opacity-50 font-bold text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={20} />
                      <span>Add Agent</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">User limit reached</p>
                <p className="text-[10px] text-amber-600 font-medium">Please upgrade your plan to add more sales representatives.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">License Info</h3>
        <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
           <ShieldCheck size={24} className="text-emerald-600" />
           <div>
             <p className="text-xs font-bold text-gray-900">{clientData?.name || 'Active Subscription'}</p>
             <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Client ID: {clientData?.clientId || 'STANDALONE'}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <PlusCircle size={16} className="text-emerald-500" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">App Setup</h3>
        </div>
         <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-900 mb-2">Install LeadPilot for faster access</p>
            <p className="text-[10px] text-emerald-700 font-medium leading-relaxed mb-4">
              You can add LeadPilot Multi-Agent to your home screen to use it like a regular app.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={onInstall}
                className="w-full bg-emerald-600 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-200 active:scale-95 transition-all mb-4"
              >
                {canInstall ? 'Install App Now' : 'Show Install Instructions'}
              </button>

              <div className="bg-white/50 p-3 rounded-xl">
               <p className="text-[10px] font-bold text-emerald-800 mb-1">On Android (Chrome):</p>
               <p className="text-[9px] text-emerald-600">Tap the 3 dots at the top right and select <span className="font-bold">"Install App"</span> or <span className="font-bold">"Add to Home Screen"</span>.</p>
             </div>
             <div className="bg-white/50 p-3 rounded-xl">
               <p className="text-[10px] font-bold text-emerald-800 mb-1">On iPhone (Safari):</p>
               <p className="text-[9px] text-emerald-600">Tap the Share icon (square with arrow) at the bottom and select <span className="font-bold">"Add to Home Screen"</span>.</p>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Notifications</h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Push Reminders</p>
              <p className="text-[10px] text-gray-400 font-medium">30 min before activities</p>
            </div>
          </div>
          <button 
            onClick={onToggleReminders}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
              remindersEnabled ? "bg-emerald-500" : "bg-slate-300"
            )}
          >
            <div className={cn(
              "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
              remindersEnabled ? "translate-x-6" : "translate-x-0"
            )} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-4">Security</h3>
        <button 
          onClick={onLogout}
          className="w-full bg-red-50 text-red-600 rounded-2xl py-4 text-sm font-bold border border-red-100 hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Sign Out of Account
        </button>
      </div>

      <div className="text-center pb-4 py-2">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-1">LeadPilot v1.5.0</p>
        <p className="text-[10px] text-gray-300">Enterprise Cloud Sync Enabled</p>
      </div>
    </div>
  );
}
