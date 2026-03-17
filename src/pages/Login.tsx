import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';

export default function Login() {
  const { authUser, authLoading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser) {
      navigate('/admin', { replace: true });
    }
  }, [authUser, navigate]);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center">
        
        <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/30">
          <span className="material-symbols-outlined text-3xl">dashboard_customize</span>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
          Sign in to manage your public profile, links, and bookings.
        </p>

        <button
          onClick={loginWithGoogle}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 px-6 py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="size-5" />
          {authLoading ? 'Loading...' : 'Sign in with Google'}
        </button>

        <div className="mt-8 text-center text-sm text-slate-500">
          <a href="/" className="hover:text-primary transition-colors hover:underline">
            &larr; Back to public profile
          </a>
        </div>
      </div>
    </div>
  );
}
