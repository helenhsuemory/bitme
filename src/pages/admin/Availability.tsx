import React, { useState } from 'react';
import { useAppState, useAppDispatch, useToast } from '../../context/AppContext';
import { AvailabilitySlot } from '../../types';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Availability() {
  const { availability, user } = useAppState();
  const dispatch = useAppDispatch();
  const addToast = useToast();

  const [slots, setSlots] = useState<AvailabilitySlot[]>([...availability]);
  const [timezone, setTimezone] = useState(user.timezone);

  const updateSlot = (dayOfWeek: number, updates: Partial<AvailabilitySlot>) => {
    setSlots(prev => prev.map(s => s.dayOfWeek === dayOfWeek ? { ...s, ...updates } : s));
  };

  const handleSave = () => {
    dispatch({ type: 'SET_AVAILABILITY', payload: slots });
    if (timezone !== user.timezone) {
      dispatch({ type: 'UPDATE_USER', payload: { timezone } });
    }
    addToast('Schedule saved');
  };

  const commonTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col">
        <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">Weekly Availability</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Set your standard working hours for bookings.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">public</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Timezone:</span>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="bg-slate-100 dark:bg-primary/10 border-none rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 outline-none"
            >
              {commonTimezones.map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20"
        >
          Save Schedule
        </button>
      </div>

      <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-primary/10">
          {slots.map(slot => (
            <div
              key={slot.dayOfWeek}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 transition-colors ${
                slot.enabled ? 'hover:bg-slate-50 dark:hover:bg-primary/5' : 'bg-slate-50 dark:bg-black/20'
              }`}
            >
              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    checked={slot.enabled}
                    onChange={() => updateSlot(slot.dayOfWeek, { enabled: !slot.enabled })}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
                <span className={`font-bold w-24 ${slot.enabled ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {dayNames[slot.dayOfWeek]}
                </span>
              </div>

              {slot.enabled ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-100 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg overflow-hidden">
                    <input
                      className="bg-transparent border-none text-sm px-3 py-2 focus:ring-0 text-slate-900 dark:text-slate-100 font-medium w-24 text-center"
                      type="time"
                      value={slot.startTime}
                      onChange={e => updateSlot(slot.dayOfWeek, { startTime: e.target.value })}
                    />
                  </div>
                  <span className="text-slate-400 font-medium">–</span>
                  <div className="flex items-center bg-slate-100 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg overflow-hidden">
                    <input
                      className="bg-transparent border-none text-sm px-3 py-2 focus:ring-0 text-slate-900 dark:text-slate-100 font-medium w-24 text-center"
                      type="time"
                      value={slot.endTime}
                      onChange={e => updateSlot(slot.dayOfWeek, { endTime: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center pr-12">
                  <span className="text-sm text-slate-400 font-medium italic">Unavailable</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-6 mt-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Date Overrides</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Add specific dates when your availability changes from your weekly hours.</p>
        <button className="text-primary hover:text-primary/80 font-bold text-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Date Override
        </button>
      </div>
    </div>
  );
}
