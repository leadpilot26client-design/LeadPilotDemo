import { useState } from 'react';
import { KeyRound, Loader2, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col justify-center p-6">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-200 mb-6 font-bold">
            <KeyRound size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">LeadPilot CRM</h1>
          <p className="text-gray-500 mt-2 font-medium">Please login to continue</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center px-2">
              Sign in with your work email to access the LeadPilot CRM dashboard.
            </p>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Continue with Google
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 font-medium italic">
            "The pilot for your real estate success"
          </p>
        </div>
      </div>
    </div>
  );
}
