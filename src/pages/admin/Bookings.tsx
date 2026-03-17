import React, { useState } from 'react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { useAppState, useAppDispatch, useToast } from '../../context/AppContext';

type TabFilter = 'upcoming' | 'past' | 'canceled';

export default function Bookings() {
  const { bookings, services } = useAppState();
  const dispatch = useAppDispatch();
  const addToast = useToast();
  const [tab, setTab] = useState<TabFilter>('upcoming');

  const getServiceTitle = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.title ?? 'Unknown Service';
  };

  const now = new Date();

  const filtered = bookings.filter(b => {
    if (tab === 'canceled') return b.status === 'canceled';
    if (tab === 'past') return b.status === 'completed' || (b.status === 'confirmed' && new Date(b.endTime) < now);
    // upcoming
    return b.status === 'confirmed' && new Date(b.endTime) >= now;
  }).sort((a, b) => {
    if (tab === 'upcoming') return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });

  const handleCancel = (id: string) => {
    dispatch({ type: 'UPDATE_BOOKING', payload: { id, status: 'canceled' } });
    addToast('Booking canceled');
  };

  const tabs: { key: TabFilter; label: string; icon: string }[] = [
    { key: 'upcoming', label: 'Upcoming', icon: 'event_upcoming' },
    { key: 'past', label: 'Past', icon: 'history' },
    { key: 'canceled', label: 'Canceled', icon: 'event_busy' },
  ];

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const colorPool = [
    'bg-primary/20 text-primary',
    'bg-blue-500/20 text-blue-500',
    'bg-emerald-500/20 text-emerald-500',
    'bg-amber-500/20 text-amber-500',
    'bg-rose-500/20 text-rose-500',
    'bg-cyan-500/20 text-cyan-500',
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col">
        <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">Bookings</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your appointments</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-1.5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">calendar_month</span>
          <p className="font-medium">No {tab} bookings</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((booking, idx) => {
            const service = services.find(s => s.id === booking.serviceId);
            const start = new Date(booking.startTime);
            const end = new Date(booking.endTime);
            const color = colorPool[idx % colorPool.length];

            return (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 p-5 rounded-2xl hover:border-primary/40 transition-all"
              >
                <div className={`size-12 rounded-full ${color} flex items-center justify-center font-bold text-sm shrink-0`}>
                  {initials(booking.guestName)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{booking.guestName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{booking.guestEmail}</p>
                  {booking.notes && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate italic">"{booking.notes}"</p>
                  )}
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                  <span className="text-sm font-bold text-primary">{getServiceTitle(booking.serviceId)}</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {format(start, 'MMM d, yyyy')} · {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                  </span>
                  {service && service.price > 0 && (
                    <span className="text-xs font-bold text-emerald-500">${service.price.toFixed(2)}</span>
                  )}
                </div>

                {tab === 'upcoming' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="px-4 py-2 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                )}

                {tab === 'canceled' && (
                  <span className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0">
                    Canceled
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
