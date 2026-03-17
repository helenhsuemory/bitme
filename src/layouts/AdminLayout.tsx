import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppState, useAuth, useAppDispatch, useToast } from '../context/AppContext';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppState();
  const { authUser, authLoading, logout } = useAuth();
  const dispatch = useAppDispatch();
  const addToast = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        navigate('/login', { replace: true });
        return;
      }

      if (!user.ownerUid) {
        // Claim the page - First user to log in becomes the owner
        dispatch({
          type: 'UPDATE_USER',
          payload: { ownerUid: authUser.uid }
        });
        addToast('Admin access claimed successfully!', 'success');
      } else if (user.ownerUid !== authUser.uid) {
        // Access completely denied
        logout();
        addToast('Access Denied: You are not the owner of this page.', 'error');
        navigate('/', { replace: true });
      }
    }
  }, [authUser, authLoading, user.ownerUid, dispatch, navigate, logout, addToast]);

  if (authLoading || (!authUser && !authLoading) || (authUser && user.ownerUid && user.ownerUid !== authUser.uid)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">autorenew</span>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', icon: 'grid_view', label: 'Dashboard' },
    { path: '/admin/links', icon: 'link', label: 'My Links' },
    { path: '/admin/services', icon: 'work', label: 'Services' },
    { path: '/admin/availability', icon: 'calendar_today', label: 'Availability' },
    { path: '/admin/bookings', icon: 'event_available', label: 'Bookings' },
    { path: '/admin/settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-primary/20 px-6 py-3 lg:px-40 bg-white dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">dashboard_customize</span>
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">Admin Dashboard</h2>
          </div>
          <div className="flex flex-1 justify-end gap-4 lg:gap-8 items-center">
            <label className="hidden md:flex flex-col min-w-40 !h-10 max-w-64">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full overflow-hidden">
                <div className="text-slate-400 flex items-center justify-center pl-4 bg-slate-100 dark:bg-primary/10">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input className="form-input flex w-full min-w-0 flex-1 border-none bg-slate-100 dark:bg-primary/10 focus:ring-0 h-full placeholder:text-slate-400 px-4 pl-2 text-base font-normal" placeholder="Search" />
              </div>
            </label>
            <div className="flex gap-2">
              <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-300 hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button onClick={logout} title="Sign Out" className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-primary/10 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col lg:flex-row lg:px-40 py-8 gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex flex-col gap-6 px-4 lg:px-0 shrink-0">
            <div className="flex flex-col">
              <h1 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-normal truncate">{authUser.displayName || user.displayName}</h1>
              <p className="text-slate-500 dark:text-primary/60 text-sm font-medium truncate">{authUser.email || 'Administrator'}</p>
            </div>
            <nav className="flex flex-col gap-1 flex-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/10'
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </Link>
                );
              })}
              <div className="h-px bg-slate-200 dark:bg-primary/20 my-2"></div>
              <Link to="/help" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined">help</span>
                <span className="text-sm font-semibold">Help Center</span>
              </Link>
            </nav>
            
            <div className="mt-auto pt-4">
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Pro Plan</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Upgrade for advanced analytics and branding.</p>
                <button className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-opacity">Upgrade Now</button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col gap-6 px-4 lg:px-0 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

