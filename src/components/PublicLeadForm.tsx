import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ArrowLeft, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { PROPERTY_TYPES } from '../constants';

interface PublicLeadFormProps {
  onSubmit: (data: { firstName: string; phone: string; property: string }) => Promise<void>;
}

export default function PublicLeadForm({ onSubmit }: PublicLeadFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
    property: ''
  });

  useEffect(() => {
    // Check if user is logged in to show "Return to App" buttons
    const user = localStorage.getItem('user');
    if (user) setIsAuth(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl text-center space-y-6 animate-in zoom-in duration-300">
          <div className="flex justify-center">
             <div className="bg-emerald-100 p-4 rounded-full">
                <CheckCircle2 size={48} className="text-emerald-500" />
             </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Thank you!</h1>
            <p className="text-gray-500 italic">"We will contact you soon."</p>
          </div>

          {isAuth ? (
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all"
            >
              <Home size={18} />
              Return to Dashboard
            </button>
          ) : (
            <div className="pt-4 border-t border-gray-50">
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                 Submission Received
               </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col p-6 items-center">
      <div className="w-full max-w-md space-y-8 mt-12 mb-12">
        <div className="flex justify-between items-start">
          <div className="text-left">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif tracking-tight">LeadPilot</h1>
            <p className="text-gray-500 text-sm">Enter your details for a callback.</p>
          </div>
          {isAuth && (
            <button 
              onClick={() => navigate('/')}
              className="p-3 bg-white text-gray-400 rounded-full shadow-sm hover:text-emerald-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">First Name</label>
            <input
              required
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:border-emerald-500 transition-all font-medium"
              placeholder="Your first name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Phone Number</label>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:border-emerald-500 transition-all font-medium"
              placeholder="Your phone number"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Interested In</label>
            <select
              required
              value={formData.property}
              onChange={(e) => setFormData({ ...formData, property: e.target.value })}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:border-emerald-500 transition-all font-medium appearance-none"
            >
              <option value="">Select Category...</option>
              {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <button
            disabled={loading}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : 'Request Callback'}
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Secure Form Powered by LeadPilot CRM
        </p>
      </div>
    </div>
  );
}
