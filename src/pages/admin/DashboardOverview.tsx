import React from 'react';
import { format } from 'date-fns';
import { useAppState } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export default function DashboardOverview() {
  const { bookings, services, links } = useAppState();

  const now = new Date();

  // Derived stats
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => {
    const svc = services.find(s => s.id === b.serviceId);
    return sum + (svc?.price ?? 0);
  }, 0);
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' && new Date(b.endTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const colorPool = [
    'bg-primary/20 text-primary',
    'bg-blue-500/20 text-blue-500',
    'bg-emerald-500/20 text-emerald-500',
    'bg-amber-500/20 text-amber-500',
    'bg-rose-500/20 text-rose-500',
  ];

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const relativeDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return format(d, 'MMM d');
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col">
        <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back, here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="p-6 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Link Clicks</span>
            <span className="material-symbols-outlined text-primary">touch_app</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">{totalClicks.toLocaleString()}</h3>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Bookings</span>
            <span className="material-symbols-outlined text-primary">event_available</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">{confirmedBookings.length}</h3>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue</span>
            <span className="material-symbols-outlined text-primary">payments</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">${totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Traffic Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold">Quick Stats: Profile Traffic</h4>
            <select className="bg-transparent border-none text-sm text-slate-500 dark:text-slate-400 focus:ring-0">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[250px] w-full relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 478 150">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8c2bee" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#8c2bee" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d="M0 109C18.1 109 18.1 21 36.3 21C54.4 21 54.4 41 72.6 41C90.7 41 90.7 93 108.9 93C127 93 127 33 145.2 33C163.3 33 163.3 101 181.5 101C199.6 101 199.6 61 217.8 61C236 61 236 45 254.1 45C272.3 45 272.3 121 290.4 121C308.6 121 308.6 149 326.7 149C344.9 149 344.9 1 363 1C381.2 1 381.2 81 399.3 81C417.5 81 417.5 129 435.6 129C453.8 129 453.8 25 472 25" fill="none" stroke="#8c2bee" strokeLinecap="round" strokeWidth="3"></path>
              <path d="M0 109C18.1 109 18.1 21 36.3 21C54.4 21 54.4 41 72.6 41C90.7 41 90.7 93 108.9 93C127 93 127 33 145.2 33C163.3 33 163.3 101 181.5 101C199.6 101 199.6 61 217.8 61C236 61 236 45 254.1 45C272.3 45 272.3 121 290.4 121C308.6 121 308.6 149 326.7 149C344.9 149 344.9 1 363 1C381.2 1 381.2 81 399.3 81C417.5 81 417.5 129 435.6 129C453.8 129 453.8 25 472 25 V150 H0 Z" fill="url(#chartGradient)"></path>
            </svg>
          </div>
          <div className="flex justify-between mt-4 px-2">
            <span className="text-xs font-bold text-slate-400">Mon</span>
            <span className="text-xs font-bold text-slate-400">Tue</span>
            <span className="text-xs font-bold text-slate-400">Wed</span>
            <span className="text-xs font-bold text-slate-400">Thu</span>
            <span className="text-xs font-bold text-slate-400">Fri</span>
            <span className="text-xs font-bold text-slate-400">Sat</span>
            <span className="text-xs font-bold text-slate-400">Sun</span>
          </div>
        </div>

        {/* Upcoming Bookings Section */}
        <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold">Upcoming Bookings</h4>
            <Link className="text-xs font-semibold text-primary hover:underline" to="/admin/bookings">View All</Link>
          </div>
          <div className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No upcoming bookings</p>
            ) : (
              upcomingBookings.map((booking, idx) => {
                const service = services.find(s => s.id === booking.serviceId);
                const color = colorPool[idx % colorPool.length];
                return (
                  <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg bg-background-light dark:bg-background-dark/50 border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                    <div className={`size-10 rounded-full ${color} flex items-center justify-center font-bold text-sm`}>
                      {initials(booking.guestName)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold truncate">{booking.guestName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{service?.title ?? 'Session'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">{format(new Date(booking.startTime), 'h:mm a')}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{relativeDay(booking.startTime)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="mt-2 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-primary/10">
          <h4 className="text-lg font-bold">Recent Links Activity</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-background-dark/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3">Link Label</th>
                <th className="px-6 py-3">Clicks</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-primary/10">
              {links.slice(0, 5).map(link => (
                <tr key={link.id}>
                  <td className="px-6 py-4 font-medium">{link.title}</td>
                  <td className="px-6 py-4">{link.clicks.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${link.isActive ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400'}`}>
                      {link.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to="/admin/links" className="text-primary hover:text-primary/70 material-symbols-outlined">edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
