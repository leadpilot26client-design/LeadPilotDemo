import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Lead, LeadStatus, User } from '../types';
import { format } from 'date-fns';
import { USERS, LEAD_SOURCES, PROPERTY_TYPES } from '../constants';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  currentUser: User;
  teamMembers?: string[];
  defaultAssignee?: string;
}

export default function AddLeadModal({ isOpen, onClose, onAdd, currentUser, teamMembers = [], defaultAssignee }: AddLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    whatsapp: '',
    email: '',
    property: '',
    budget: '',
    location: '',
    source: 'Facebook',
    followUpDate: format(new Date(), 'yyyy-MM-dd'),
    assignedTo: defaultAssignee || currentUser.email || currentUser.id || 'admin'
  });

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onAdd(formData);
      setSuccess(true);
      
      // Clear data immediately
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        whatsapp: '',
        email: '',
        property: '',
        budget: '',
        location: '',
        source: 'Facebook',
        followUpDate: format(new Date(), 'yyyy-MM-dd'),
        assignedTo: defaultAssignee || currentUser.email || currentUser.id || 'admin'
      });

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE') {
        setError('A lead with this phone number already exists!');
      } else {
        setError('Failed to add lead. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const usersList = teamMembers.length > 0 
    ? teamMembers.map(email => ({ id: email, username: email }))
    : USERS;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
          <h2 className="font-bold text-gray-900">Add New Lead</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">First Name *</label>
              <input
                required
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Phone *</label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
                placeholder="+1..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">WhatsApp</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
              placeholder="john@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Property Type</label>
          <select
            value={formData.property}
            onChange={(e) => setFormData({ ...formData, property: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
          >
            <option value="">Select Category...</option>
            {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
              >
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Budget</label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
                placeholder="$500k+"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
                placeholder="Downtown"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Follow-up Date *</label>
            <input
              required
              type="date"
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
            />
          </div>

          {usersList.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Assign To</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 bg-gray-50/50 text-sm"
              >
                {usersList.map(item => (
                  <option key={item.id} value={item.id}>{item.username}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2">
            {error && <p className="text-red-500 text-[10px] font-bold text-center mb-3 uppercase tracking-widest">{error}</p>}
            {success && <p className="text-emerald-500 text-[10px] font-bold text-center mb-3 uppercase tracking-widest">Lead Created! 🎉</p>}

            <button
              disabled={loading || success}
              type="submit"
              className="w-full py-4 bg-[#10B981] text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-emerald-100"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
