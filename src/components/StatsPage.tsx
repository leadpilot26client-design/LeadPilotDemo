import React, { useMemo } from 'react';
import { Lead, LeadStatus, User, DoneReason } from '../types';
import { USERS, LEAD_SOURCES } from '../constants';
import { TrendingUp, Users, Clock, Target, BarChart3, PieChart, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsPageProps {
  leads: Lead[];
  currentUser: User;
  teamMembers?: string[];
  clientId?: string;
}

export default function StatsPage({ leads, currentUser, teamMembers = [], clientId }: StatsPageProps) {
  const isAdmin = currentUser.role === 'admin';
  
  const publicFormUrl = React.useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/lead-form?cid=${clientId || ''}`;
  }, [clientId]);
  
  const stats = useMemo(() => {
    const total = (leads || []).length;
    const active = (leads || []).filter(l => l && l.status === LeadStatus.ACTIVE).length;
    const closed = (leads || []).filter(l => l && l.status === LeadStatus.DONE && l.doneReason === DoneReason.CLOSED_DEAL).length;
    const conversionRate = total > 0 ? ((closed / total) * 100).toFixed(1) : '0';

    const agents = (teamMembers || []).map(email => {
      const uLeads = (leads || []).filter(l => l && (l.assignedTo === email || (email === 'admin' && l.assignedTo === 'admin')));
      const uClosed = uLeads.filter(l => l && l.status === LeadStatus.DONE && l.doneReason === DoneReason.CLOSED_DEAL).length;
      const uActive = uLeads.filter(l => l && l.status === LeadStatus.ACTIVE).length;
      return {
        name: email === 'admin' ? 'Master Admin' : (email || '').split('@')[0] || 'Unknown',
        email: email || '',
        assigned: uLeads.length,
        closed: uClosed,
        active: uActive,
        rate: uLeads.length > 0 ? ((uClosed / uLeads.length) * 100).toFixed(1) : '0'
      };
    });

    const sources = (LEAD_SOURCES || []).map(s => ({
      name: s,
      count: (leads || []).filter(l => l && l.source === s).length
    })).sort((a, b) => b.count - a.count);

    return { total, active, closed, conversionRate, agents, sources };
  }, [leads, teamMembers]);

  const handleCopyForm = () => {
    navigator.clipboard.writeText(publicFormUrl);
    alert('Link copied to clipboard!');
  };

  const handleShareForm = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LeadPilot Public Form',
          text: 'Register your interest here:',
          url: publicFormUrl
        });
      } catch (err) {
        handleCopyForm();
      }
    } else {
      handleCopyForm();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Lead Capture Card */}
      {isAdmin && (
        <section className="bg-slate-900 p-6 rounded-3xl text-white shadow-2xl shadow-slate-900/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/30 transition-colors" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Target size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-none mb-1">Growth Engine</h2>
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] opacity-80">Connected Public Form</p>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl mb-4 border border-white/10 flex items-center justify-between gap-3 relative z-10">
            <p className="text-[10px] text-gray-400 font-mono truncate tracking-tight">{publicFormUrl}</p>
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleCopyForm} 
                className="bg-white/10 p-2.5 rounded-xl text-white hover:bg-white/20 transition-all active:scale-95 border border-white/5"
                title="Copy Link"
              >
                <Share2 size={16} strokeWidth={2.5} />
              </button>
              <button 
                onClick={handleShareForm} 
                className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg active:scale-95 transition-all flex items-center justify-center hover:bg-emerald-600 border border-white/10"
              >
                <span className="text-[10px] font-black uppercase tracking-widest px-2">Share</span>
              </button>
            </div>
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
            Link this secure endpoint to your marketing campaigns to sync leads instantly.
          </p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-4">
        {[
          { label: 'Intelligence', value: stats.total, unit: 'Records', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Efficiency', value: `${stats.conversionRate}%`, unit: 'Success', icon: PieChart, color: 'text-amber-500', bg: 'bg-amber-50' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon size={20} strokeWidth={2.5} />
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{stat.unit}</p>
            </div>
          </div>
        ))}
      </section>

      {isAdmin && (stats.agents.length > 0) && (
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Users size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-base font-black tracking-tight text-slate-900">Performance</h2>
            </div>
            <div className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </div>
          </div>
          
          <div className="space-y-10">
            {stats.agents.sort((a, b) => Number(b.rate) - Number(a.rate)).map((agent, index) => (
              <div key={agent.email} className="relative">
                {index === 0 && agent.closed > 0 && (
                  <div className="absolute -top-4 right-0 bg-amber-400 text-[8px] font-black text-white px-3 py-1 rounded-full shadow-lg shadow-amber-200 z-10 uppercase tracking-widest">
                    Elite Agent
                  </div>
                )}
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl font-black text-emerald-500 uppercase shadow-sm">
                          {(agent.name || '?').charAt(0)}
                        </div>
                        {agent.active > 0 && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{agent.name}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {agent.email === currentUser.email ? 'Current Profile' : 'External Member'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center shrink-0">
                      {[
                        { label: 'Leads', val: agent.assigned, color: 'text-slate-900' },
                        { label: 'Deals', val: agent.closed, color: 'text-emerald-500' }
                      ].map((m, i) => (
                        <div key={i} className="text-center">
                          <p className={cn("text-sm font-black leading-none mb-1", m.color)}>{m.val}</p>
                          <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400">Conversion Efficiency</span>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 italic">{agent.rate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full border border-gray-100 overflow-hidden p-[1px]">
                      <div 
                        style={{ width: `${agent.rate}%` }} 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-500" />
            Lead Sources
          </h2>
          <div className="space-y-3">
            {stats.sources.map(source => (
              <div key={source.name} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-gray-500">{source.name}</span>
                  <span className="text-gray-900">{source.count}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${(source.count / (stats.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isAdmin && (
        <section className="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-100">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Your Focus</p>
          <h2 className="text-2xl font-bold mb-4">You have {stats.total} leads assigned.</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Closed</p>
              <p className="text-2xl font-bold">{stats.closed}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Conversion</p>
              <p className="text-2xl font-bold">{stats.conversionRate}%</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
