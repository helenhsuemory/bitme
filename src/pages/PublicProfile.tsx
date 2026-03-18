import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, addDays, startOfWeek, addMonths, subMonths, isSameDay, isBefore, startOfDay, addMinutes, parse } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Twitter, Instagram, Linkedin, Github, Youtube } from 'lucide-react';
import { useAppState, useAppDispatch, useToast } from '../context/AppContext';
import { Service, Booking } from '../types';
import { getThemeById, ThemeDefinition } from '../data/themes';
import { db, functions, httpsCallable } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

type BookingStep = 'links' | 'service' | 'datetime' | 'form' | 'confirmed';

export default function PublicProfile() {
  const { user, links, folders, services, availability, bookings } = useAppState();
  const dispatch = useAppDispatch();
  const addToastMsg = useToast();

  const activeLinks = links.filter(l => l.isActive);
  const activeServices = services.filter(s => s.isActive);

  // Resolve active theme
  const theme = getThemeById(user.themePrefs.themeId);

  // Load Google Fonts for the active theme
  useEffect(() => {
    if (!theme) return;
    const id = `theme-font-${theme.id}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = theme.fontUrl;
      document.head.appendChild(link);
    }
  }, [theme]);

  // Booking flow state
  const [step, setStep] = useState<BookingStep>('links');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Guest form
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [busySlots, setBusySlots] = useState<{ start: string, end: string }[]>([]);

  // Fetch public profile data if not authenticated
  useEffect(() => {
    // If we're already authenticated, the AppContext already handles the sync.
    // If not, we should try to fetch the "active" profile from Firestore.
    const fetchPublicData = async () => {
      try {
        const q = query(collection(db, 'users'), where('username', '==', 'helenhsu'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const cloudData = querySnapshot.docs[0].data();
          dispatch({ type: 'SET_STATE', payload: cloudData as any });
        }
      } catch (error) {
        console.error('Error fetching public profile:', error);
      }
    };

    if (!user.ownerUid) { // Basic check: if ownerUid is missing, we might need real data
      fetchPublicData();
    }
  }, [user.ownerUid, dispatch]);

  // Fetch busy slots from integrations
  useEffect(() => {
    const fetchBusy = async () => {
      try {
        const getBusy = httpsCallable(functions, 'getBusySlots');
        const result: any = await getBusy({ userId: user.id }); // Using owner ID
        if (result.data?.busy) {
          setBusySlots(result.data.busy);
        }
      } catch (err) {
        console.error('Failed to fetch busy slots:', err);
      }
    };
    fetchBusy();
  }, [user.id]);

  // Calendar rendering
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = startOfWeek(firstDay);
    const days = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < 35; i++) {
      const date = addDays(startDate, i);
      const isCurrentMonth = date.getMonth() === month;
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const isPast = isBefore(date, today);
      const dayOfWeek = date.getDay();
      const slot = availability.find(a => a.dayOfWeek === dayOfWeek);
      const isAvailable = isCurrentMonth && !isPast && slot?.enabled;

      days.push(
        <button
          key={i}
          disabled={!isAvailable}
          onClick={() => {
            setSelectedDate(date);
            setSelectedTime(null);
          }}
          className={`p-2 rounded-lg text-center text-sm transition-all ${
            !isCurrentMonth ? 'opacity-30 cursor-default' :
            isSelected ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' :
            !isAvailable ? 'opacity-30 cursor-not-allowed line-through' :
            'hover:bg-primary/10 cursor-pointer font-medium'
          }`}
          style={{ 
            color: isSelected ? '#fff' : (isAvailable ? theme?.colors.text : theme?.colors.textMuted)
          }}
        >
          {date.getDate()}
        </button>
      );
    }
    return days;
  };

  // Generate time slots based on availability + service duration
  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return [];

    const dayOfWeek = selectedDate.getDay();
    const slot = availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!slot?.enabled) return [];

    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);

    const slots: string[] = [];
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + selectedService.durationMinutes <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      // Check if slot conflicts with existing bookings
      const slotStart = new Date(selectedDate);
      slotStart.setHours(h, m, 0, 0);
      const slotEnd = addMinutes(slotStart, selectedService.durationMinutes);

      const hasConflict = bookings.some(b => {
        if (b.status === 'canceled') return false;
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return slotStart < bEnd && slotEnd > bStart;
      });

      // CHECK INTEGRATED CALENDAR CONFLICTS
      const hasExternalConflict = busySlots.some(busy => {
        const bStart = new Date(busy.start);
        const bEnd = new Date(busy.end);
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!hasConflict && !hasExternalConflict) {
        slots.push(timeStr);
      }
      currentMinutes += 30; // 30-min increments
    }
    return slots;
  }, [selectedDate, selectedService, availability, bookings, busySlots]);

  const formatTimeSlot = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m);
    return format(d, 'h:mm a');
  };

  const handleBookingSubmit = () => {
    if (!selectedService || !selectedDate || !selectedTime || !guestName.trim() || !guestEmail.trim()) return;

    const [h, m] = selectedTime.split(':').map(Number);
    const start = new Date(selectedDate);
    start.setHours(h, m, 0, 0);
    const end = addMinutes(start, selectedService.durationMinutes);

    const booking: Booking = {
      id: Date.now().toString(),
      serviceId: selectedService.id,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      notes: notes.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_BOOKING', payload: booking });
    setConfirmedBooking(booking);
    setStep('confirmed');
  };

  const resetBooking = () => {
    setStep('links');
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setGuestName('');
    setGuestEmail('');
    setNotes('');
    setConfirmedBooking(null);
  };

  // Build inline style object from theme
  const themeStyle: React.CSSProperties = theme ? {
    '--t-primary': theme.colors.primary,
    '--t-secondary': theme.colors.secondary,
    '--t-accent': theme.colors.accent,
    '--t-bg': theme.colors.background,
    '--t-surface': theme.colors.surface,
    '--t-text': theme.colors.text,
    '--t-muted': theme.colors.textMuted,
    '--t-heading': `"${theme.fonts.heading}", sans-serif`,
    '--t-body': `"${theme.fonts.body}", sans-serif`,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontFamily: `"${theme.fonts.body}", sans-serif`,
  } as React.CSSProperties : {};

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden" style={themeStyle}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-5 px-4 md:px-10 lg:px-40">
          <div className="layout-content-container flex flex-col max-w-[640px] flex-1">
            <header className="flex items-center justify-between whitespace-nowrap border-b px-4 py-3 mb-8" style={{ borderColor: theme ? `${theme.colors.primary}33` : undefined }}>
              <div className="flex items-center gap-4">
                <div className="size-6" style={{ color: theme?.colors.primary }}>
                  <span className="material-symbols-outlined">layers</span>
                </div>
                <h2 className="text-lg font-bold leading-tight tracking-tight" style={{ fontFamily: theme ? `"${theme.fonts.heading}", sans-serif` : undefined, color: theme?.colors.text }}>{user.displayName}</h2>
              </div>
              <Link to="/admin" className="flex cursor-pointer items-center justify-center rounded-lg h-10 gap-2 text-sm font-bold px-3 transition-colors" style={{ backgroundColor: theme ? `${theme.colors.primary}18` : undefined, color: theme?.colors.primary }}>
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Admin
              </Link>
            </header>
            
            {/* Profile Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex p-4 flex-col items-center text-center gap-4"
            >
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 ring-4"
                style={{ backgroundImage: `url("${user.avatarUrl}")`, ringColor: theme ? `${theme.colors.primary}33` : undefined, boxShadow: theme ? `0 0 0 4px ${theme.colors.primary}33` : undefined }}
              ></div>
              <div className="flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold leading-tight tracking-tight" style={{ fontFamily: theme ? `"${theme.fonts.heading}", sans-serif` : undefined, color: theme?.colors.text }}>{user.displayName}</h1>
                <p className="text-base font-medium mt-1" style={{ color: theme?.colors.textMuted }}>{user.title}</p>
                <p className="text-sm mt-2 max-w-sm" style={{ color: theme ? `${theme.colors.textMuted}CC` : undefined }}>{user.bio}</p>
              </div>
              
              <div className="flex items-center justify-center gap-3 mt-2">
                {[
                  { key: 'twitter', icon: Twitter },
                  { key: 'instagram', icon: Instagram },
                  { key: 'linkedin', icon: Linkedin },
                  { key: 'github', icon: Github },
                  { key: 'youtube', icon: Youtube },
                ].map(({ key, icon: Icon }) => {
                  const url = user.socialLinks?.[key];
                  if (!url) return null;
                  return (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full transition-all active:scale-95" style={{ backgroundColor: theme ? `${theme.colors.primary}18` : undefined, color: theme?.colors.textMuted }} aria-label={key}>
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </motion.div>

            {/* Dynamic Links */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col gap-3 px-4 py-8"
            >
              {folders.map(folder => {
                const folderLinks = activeLinks.filter(l => l.folderId === folder.id);
                if (folderLinks.length === 0) return null;
                return (
                  <div key={folder.id} className="flex flex-col gap-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider pl-1" style={{ color: theme?.colors.textMuted }}>{folder.title}</h3>
                    {folderLinks.map((link, idx) => (
                      <a
                        key={link.id}
                        className="flex items-center justify-center rounded-xl h-14 px-5 text-base font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                        style={idx === 0 && folder === folders[0]
                          ? { backgroundColor: theme?.colors.primary, color: theme ? '#fff' : undefined, boxShadow: theme ? `0 4px 14px ${theme.colors.primary}33` : undefined }
                          : { backgroundColor: theme ? `${theme.colors.primary}15` : undefined, color: theme?.colors.text }
                        }
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="material-symbols-outlined mr-2">{link.icon}</span>
                        {link.title}
                      </a>
                    ))}
                  </div>
                );
              })}
              {/* Uncategorized */}
              {activeLinks.filter(l => !l.folderId).map(link => (
                <a
                  key={link.id}
                  className="flex items-center justify-center rounded-xl h-14 px-5 text-base font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: theme ? `${theme.colors.primary}15` : undefined, color: theme?.colors.text }}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-outlined mr-2">{link.icon}</span>
                  {link.title}
                </a>
              ))}
            </motion.div>

            {/* Booking Section */}
            {activeServices.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="px-4 py-8"
              >
                <h2 className="text-xl font-bold leading-tight tracking-tight mb-6 flex items-center gap-2" style={{ fontFamily: theme ? `"${theme.fonts.heading}", sans-serif` : undefined, color: theme?.colors.text }}>
                  <span className="material-symbols-outlined" style={{ color: theme?.colors.primary }}>calendar_today</span>
                  Book a Session
                </h2>

                <AnimatePresence mode="wait">
                  {/* Step 1: Service Selection */}
                  {(step === 'links' || step === 'service') && (
                    <motion.div
                      key="service-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col gap-4"
                    >
                      {activeServices.map(service => (
                        <label
                          key={service.id}
                          className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                            selectedService?.id === service.id
                              ? 'border-primary shadow-sm shadow-primary/20'
                              : 'hover:border-primary/50'
                          }`}
                          style={{ 
                            backgroundColor: selectedService?.id === service.id ? `${theme?.colors.primary}15` : theme?.colors.surface,
                            borderColor: selectedService?.id === service.id ? theme?.colors.primary : `${theme?.colors.primary}33`
                          }}
                        >
                          <input
                            checked={selectedService?.id === service.id}
                            onChange={() => {
                              setSelectedService(service);
                              setStep('service');
                            }}
                            className="h-5 w-5 border-2 border-slate-300 dark:border-slate-700 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                            name="service"
                            type="radio"
                          />
                          <div className="flex grow flex-col">
                            <p className="text-sm font-bold" style={{ color: theme?.colors.text }}>
                              {service.title} ({service.price === 0 ? 'Free' : `$${service.price}`})
                            </p>
                            <p className="text-xs" style={{ color: theme?.colors.textMuted }}>
                              {service.description} · {service.durationMinutes} min
                            </p>
                          </div>
                        </label>
                      ))}
                      {selectedService && (
                          <button
                            onClick={() => setStep('datetime')}
                            className="w-full py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors mt-2"
                            style={{ backgroundColor: theme?.colors.primary, color: '#fff' }}
                          >
                            Choose Date & Time
                          </button>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: Date & Time */}
                  {step === 'datetime' && (
                    <motion.div
                      key="datetime-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <button onClick={() => setStep('service')} className="text-sm text-primary font-bold mb-4 flex items-center gap-1 hover:opacity-80">
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to services
                      </button>
                      <div className="border rounded-2xl overflow-hidden p-6 shadow-sm" style={{ backgroundColor: theme?.colors.surface, borderColor: `${theme?.colors.primary}22` }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ color: theme?.colors.text }}>
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold" style={{ color: theme?.colors.text }}>{format(currentMonth, 'MMMM yyyy')}</h3>
                              <div className="flex gap-2">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded-lg transition-colors" style={{ color: theme?.colors.text }}><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-lg transition-colors" style={{ color: theme?.colors.text }}><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                              </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold mb-2" style={{ color: theme?.colors.textMuted }}>
                              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center">
                              {renderCalendar()}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <h3 className="font-bold mb-4" style={{ color: theme?.colors.text }}>
                              {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
                            </h3>
                            {selectedDate && timeSlots.length === 0 && (
                              <p className="text-sm italic" style={{ color: theme?.colors.textMuted }}>No available slots on this day.</p>
                            )}
                            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                              {timeSlots.map(time => (
                                <button
                                  key={time}
                                  onClick={() => setSelectedTime(time)}
                                  className={`w-full py-3 rounded-xl border font-medium transition-all ${
                                    selectedTime === time
                                      ? 'border-primary bg-primary shadow-md shadow-primary/20 font-bold'
                                      : 'border-slate-200 hover:border-primary'
                                  }`}
                                  style={{ 
                                    color: selectedTime === time ? '#fff' : theme?.colors.text,
                                    borderColor: selectedTime === time ? theme?.colors.primary : `${theme?.colors.primary}22`
                                  }}
                                >
                                  {formatTimeSlot(time)}
                                </button>
                              ))}
                            </div>
                            {selectedTime && (
                              <button
                                onClick={() => setStep('form')}
                                className="mt-4 w-full py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                                style={{ backgroundColor: theme?.colors.primary, color: '#FFFFFF' }}
                              >
                                Continue
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Guest Info Form */}
                  {step === 'form' && (
                    <motion.div
                      key="form-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <button onClick={() => setStep('datetime')} className="text-sm text-primary font-bold mb-4 flex items-center gap-1 hover:opacity-80">
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to calendar
                      </button>
                      <div className="border rounded-2xl p-6 shadow-sm" style={{ backgroundColor: theme?.colors.surface, borderColor: `${theme?.colors.primary}22` }}>
                        <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: `${theme?.colors.primary}10`, borderColor: `${theme?.colors.primary}33` }}>
                          <p className="font-bold" style={{ color: theme?.colors.text }}>{selectedService?.title}</p>
                          <p className="text-sm mt-1" style={{ color: theme?.colors.textMuted }}>
                            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} · {selectedTime && formatTimeSlot(selectedTime)} · {selectedService?.durationMinutes} min
                          </p>
                          {selectedService && selectedService.price > 0 && (
                            <p className="text-sm font-bold text-emerald-500 mt-1">${selectedService.price.toFixed(2)}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold" style={{ color: theme?.colors.text }}>Your Name *</label>
                            <input
                              type="text"
                              value={guestName}
                              onChange={e => setGuestName(e.target.value)}
                              placeholder="Jane Smith"
                              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                              style={{ 
                                backgroundColor: theme?.colors.surface, 
                                borderColor: `${theme?.colors.primary}44`,
                                color: theme?.colors.text
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold" style={{ color: theme?.colors.text }}>Email *</label>
                            <input
                              type="email"
                              value={guestEmail}
                              onChange={e => setGuestEmail(e.target.value)}
                              placeholder="jane@example.com"
                              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                              style={{ 
                                backgroundColor: theme?.colors.surface, 
                                borderColor: `${theme?.colors.primary}44`,
                                color: theme?.colors.text
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold" style={{ color: theme?.colors.text }}>Notes (optional)</label>
                            <textarea
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                              rows={3}
                              placeholder="Anything you'd like to discuss?"
                              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                              style={{ 
                                backgroundColor: theme?.colors.surface, 
                                borderColor: `${theme?.colors.primary}44`,
                                color: theme?.colors.text
                              }}
                            />
                          </div>
                          <button
                            onClick={handleBookingSubmit}
                            disabled={!guestName.trim() || !guestEmail.trim()}
                            className="w-full py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            style={{ backgroundColor: theme?.colors.primary, color: '#FFFFFF' }}
                          >
                            Confirm Booking
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Confirmation */}
                  {step === 'confirmed' && confirmedBooking && (
                    <motion.div
                      key="confirmed-step"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div className="border rounded-2xl p-8 shadow-sm" style={{ backgroundColor: theme?.colors.surface, borderColor: `${theme?.colors.primary}22` }}>
                        <div className="size-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${theme?.colors.primary}22` }}>
                          <span className="material-symbols-outlined text-4xl" style={{ color: theme?.colors.primary }}>check_circle</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2" style={{ color: theme?.colors.text }}>You're booked!</h3>
                        <p className="mb-6" style={{ color: theme?.colors.textMuted }}>A confirmation has been sent to {confirmedBooking.guestEmail}</p>

                        <div className="rounded-xl p-4 text-left mb-6" style={{ backgroundColor: `${theme?.colors.primary}08` }}>
                          <div className="flex flex-col gap-2 text-sm">
                            <div className="flex justify-between">
                              <span style={{ color: theme?.colors.textMuted }}>Service</span>
                              <span className="font-bold" style={{ color: theme?.colors.text }}>{selectedService?.title}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: theme?.colors.textMuted }}>Date</span>
                              <span className="font-bold" style={{ color: theme?.colors.text }}>{format(new Date(confirmedBooking.startTime), 'EEEE, MMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: theme?.colors.textMuted }}>Time</span>
                              <span className="font-bold" style={{ color: theme?.colors.text }}>{format(new Date(confirmedBooking.startTime), 'h:mm a')} – {format(new Date(confirmedBooking.endTime), 'h:mm a')}</span>
                            </div>
                            {selectedService && selectedService.price > 0 && (
                              <div className="flex justify-between">
                                <span style={{ color: theme?.colors.textMuted }}>Price</span>
                                <span className="font-bold text-emerald-500">${selectedService.price.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={resetBooking}
                          className="text-primary font-bold hover:opacity-80 transition-opacity"
                        >
                          Book another session
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
            
            <footer className="mt-auto py-12 flex flex-col items-center border-t gap-2" style={{ borderColor: theme ? `${theme.colors.textMuted}33` : undefined }}>
              <div className="flex items-center gap-2 opacity-50" style={{ color: theme?.colors.textMuted }}>
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <p className="text-xs font-medium tracking-wide uppercase">Powered by BitMe</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
