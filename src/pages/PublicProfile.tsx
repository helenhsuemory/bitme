import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, addDays, startOfWeek, addMonths, subMonths, isSameDay, isBefore, startOfDay, addMinutes, parse } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Twitter, Instagram, Linkedin, Github, Youtube, Mail } from 'lucide-react';
import { useAppState, useAppDispatch, useToast } from '../context/AppContext';
import { Service, Booking } from '../types';
import { getThemeById, ThemeDefinition } from '../data/themes';
import { db, functions, httpsCallable } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

type BookingStep = 'links' | 'service' | 'datetime' | 'form' | 'confirmed';

export default function PublicProfile() {
  const { user, links = [], folders = [], services = [], availability = [], bookings = [] } = useAppState();
  const dispatch = useAppDispatch();
  const addToastMsg = useToast();

  const activeLinks = (links || []).filter(l => l?.isActive);
  const activeServices = (services || []).filter(s => s?.isActive && s?.title !== '1-hour Strategy Consultation');

  // Resolve active theme
  const theme = getThemeById(user?.themePrefs?.themeId || 'ocean-depths');

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
        const result: any = await getBusy({ userId: user?.id || user?.ownerUid }); // Using owner ID
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
          className={`p-2 rounded-lg text-center text-sm transition-all ${!isCurrentMonth ? 'opacity-30 cursor-default' :
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

  // Explicit static styling for the new design
  const themeStyle: React.CSSProperties = {
    backgroundColor: '#D3C7D4',
    color: '#000000',
    fontFamily: '"Inter", sans-serif',
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden font-sans" style={{ backgroundColor: '#D3C7D4' }}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center pb-12 pt-4 px-4 md:px-10 lg:px-40">
          <div className="layout-content-container flex flex-col max-w-[640px] flex-1">
            <header className="w-full flex items-center justify-center pt-8 pb-4">
              {/* Removed top buttons as requested */}
            </header>

            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex px-4 pt-2 pb-6 flex-col items-center text-center gap-3"
            >
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full h-[120px] w-[120px] overflow-hidden"
              >
                <img src="/helen-circle.png" alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.backgroundImage = `url("${user.avatarUrl}")`; }} />
              </div>
              <div className="flex flex-col items-center justify-center">
                <h1 className="text-[26px] font-bold leading-tight tracking-tight text-black">{user.displayName || '@huilunhsu'}</h1>
                <p className="text-[15px] font-medium mt-1.5 text-black">{user.title || 'Entrepreneur | Consultant | Investor'}</p>
                {user.bio && <p className="text-sm mt-2 max-w-sm text-black/80">{user.bio}</p>}
              </div>

              <div className="flex items-center justify-center gap-5 mt-1">
                <a href="https://www.linkedin.com/in/huilunhsu/" target="_blank" rel="noopener noreferrer" className="p-1 transition-all hover:scale-105 text-black" aria-label="linkedin">
                  <Linkedin strokeWidth={2.5} className="w-7 h-7" />
                </a>
                <a href="https://www.youtube.com/@hehehe_helen" target="_blank" rel="noopener noreferrer" className="p-1 transition-all hover:scale-105 text-black" aria-label="youtube">
                  <Youtube strokeWidth={2.5} className="w-7 h-7" />
                </a>
                <a href="https://www.instagram.com/hehehe_helen/" target="_blank" rel="noopener noreferrer" className="p-1 transition-all hover:scale-105 text-black" aria-label="instagram">
                  <Instagram strokeWidth={2.5} className="w-7 h-7" />
                </a>
                <a href="mailto:helenhsu1016@gmail.com" target="_blank" rel="noopener noreferrer" className="p-1 transition-all hover:scale-105 text-black" aria-label="email">
                  <Mail strokeWidth={2.5} className="w-7 h-7" />
                </a>
              </div>
            </motion.div>

            {/* Hardcoded Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col gap-6 px-4 py-4"
            >
              <div className="flex flex-col gap-3">
                <a
                  className="flex items-center justify-center relative bg-white h-[68px] px-5 text-base font-medium transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-[0.98] rounded-xl text-black"
                  href="https://iabuddy.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="https://www.google.com/s2/favicons?domain=iabuddy.ai&sz=128" alt="IAbuddy.ai" className="absolute left-4 w-9 h-9 rounded-lg object-contain bg-white/50" />
                  <span className="text-center font-bold truncate px-10">IAbuddy.ai: AI copilot for Internal Audit & SOX</span>
                </a>
                <a
                  className="flex items-center justify-center relative bg-white h-[68px] px-5 text-base font-medium transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-[0.98] rounded-xl text-black"
                  href="https://herinventure.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="https://www.google.com/s2/favicons?domain=herinventure.com&sz=128" alt="Her In Venture" className="absolute left-4 w-9 h-9 rounded-lg object-contain bg-white/50" />
                  <span className="text-center font-bold truncate px-10">Her In Venture: Venture Studio for Woman</span>
                </a>
                <a
                  className="flex items-center justify-center relative bg-white h-[68px] px-5 text-base font-medium transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-[0.98] rounded-xl text-black"
                  href="https://teamtonic.space/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="https://www.google.com/s2/favicons?domain=teamtonic.space&sz=128" alt="TeamTonic" className="absolute left-4 w-9 h-9 rounded-lg object-contain bg-white/50" />
                  <span className="text-center font-bold truncate px-10">TeamTonic: AI-Powered Workspace</span>
                </a>
              </div>
            </motion.div>

            {/* Booking Section */}
            {activeServices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="px-4 py-8"
              >
                <h2 className="text-xl font-bold leading-tight tracking-tight mb-6 flex items-center gap-2 text-black">
                  <span className="material-symbols-outlined text-black">calendar_today</span>
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
                      className="flex flex-col gap-4 bg-white rounded-2xl p-6 shadow-xl"
                    >
                      {activeServices.map(service => (
                        <label
                          key={service.id}
                          className={`flex items-center gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer transition-all ${selectedService?.id === service.id
                            ? 'bg-gray-50 border-black shadow-sm'
                            : 'bg-white hover:bg-gray-50 border-transparent'
                            }`}
                        >
                          <input
                            checked={selectedService?.id === service.id}
                            onChange={() => {
                              setSelectedService(service);
                              setStep('service');
                            }}
                            className="h-5 w-5 bg-transparent text-black focus:ring-black border-gray-300 rounded-md"
                            name="service"
                            type="radio"
                          />
                          <div className="flex grow flex-col">
                            <p className="text-base font-bold text-black">
                              {service.title} <span className="font-normal opacity-80 text-gray-600">({service.price === 0 ? 'Free' : `$${service.price}`})</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {service.description} · {service.durationMinutes} min
                            </p>
                          </div>
                        </label>
                      ))}
                      {selectedService && (
                        <button
                          onClick={() => setStep('datetime')}
                          className="w-full mt-4 py-3.5 rounded-xl font-bold shadow-sm hover:bg-gray-800 transition-colors bg-black text-white"
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
                      <button onClick={() => setStep('service')} className="text-sm font-bold mb-4 flex items-center gap-1 hover:text-gray-600 transition-colors text-black">
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to services
                      </button>
                      <div className="rounded-2xl overflow-hidden p-6 shadow-xl bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-black">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
                              <div className="flex gap-2 text-black">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded-lg transition-colors hover:bg-gray-100"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-lg transition-colors hover:bg-gray-100"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                              </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold mb-2 text-gray-500">
                              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center">
                              {(() => {
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
                                      className={`p-2 rounded-xl text-center text-sm transition-all focus:outline-none ${!isCurrentMonth ? 'opacity-30 cursor-default text-gray-400' :
                                        isSelected ? 'bg-black text-white font-bold shadow-md' :
                                          !isAvailable ? 'opacity-30 cursor-not-allowed line-through text-gray-400' :
                                            'hover:bg-gray-100 cursor-pointer font-medium text-black'
                                        }`}
                                    >
                                      {date.getDate()}
                                    </button>
                                  );
                                }
                                return days;
                              })()}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <h3 className="font-bold mb-4 text-lg">
                              {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
                            </h3>
                            {selectedDate && timeSlots.length === 0 && (
                              <p className="text-sm italic text-gray-500">No available slots on this day.</p>
                            )}
                            <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                              {timeSlots.map(time => (
                                <button
                                  key={time}
                                  onClick={() => setSelectedTime(time)}
                                  className={`w-full py-3.5 rounded-xl font-medium transition-all text-sm tracking-wide ${selectedTime === time
                                    ? 'bg-black text-white shadow-md font-bold border border-black'
                                    : 'bg-white text-black border border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                  {formatTimeSlot(time)}
                                </button>
                              ))}
                            </div>
                            {selectedTime && (
                              <button
                                onClick={() => setStep('form')}
                                className="mt-6 w-full py-3.5 rounded-xl font-bold shadow-sm hover:bg-gray-800 transition-colors bg-black text-white"
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
                      <button onClick={() => setStep('datetime')} className="text-sm font-bold mb-4 flex items-center gap-1 hover:text-gray-600 transition-colors text-black">
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to calendar
                      </button>
                      <div className="rounded-2xl p-6 shadow-xl bg-white">
                        <div className="mb-6 p-4 rounded-xl border bg-gray-50 border-gray-200">
                          <p className="font-bold text-black">{selectedService?.title}</p>
                          <p className="text-sm mt-1 text-gray-600">
                            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} · {selectedTime && formatTimeSlot(selectedTime)} · {selectedService?.durationMinutes} min
                          </p>
                          {selectedService && selectedService.price > 0 && (
                            <p className="text-sm font-bold text-black mt-1">${selectedService.price.toFixed(2)}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-4 text-black">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Your Name *</label>
                            <input
                              type="text"
                              value={guestName}
                              onChange={e => setGuestName(e.target.value)}
                              placeholder="Jane Smith"
                              className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-black/50 focus:border-black outline-none transition-all placeholder-gray-400 text-black bg-white border border-gray-300"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Email *</label>
                            <input
                              type="email"
                              value={guestEmail}
                              onChange={e => setGuestEmail(e.target.value)}
                              placeholder="jane@example.com"
                              className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-black/50 focus:border-black outline-none transition-all placeholder-gray-400 text-black bg-white border border-gray-300"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Notes (optional)</label>
                            <textarea
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                              rows={3}
                              placeholder="Anything you'd like to discuss?"
                              className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-black/50 focus:border-black outline-none transition-all resize-none placeholder-gray-400 text-black bg-white border border-gray-300"
                            />
                          </div>
                          <button
                            onClick={handleBookingSubmit}
                            disabled={!guestName.trim() || !guestEmail.trim()}
                            className="w-full mt-4 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="rounded-2xl p-8 shadow-xl bg-white">
                        <div className="size-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-gray-50 border border-gray-200">
                          <span className="material-symbols-outlined text-4xl text-black">check_circle</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-black">You're booked!</h3>
                        <p className="mb-6 text-gray-600">A confirmation has been sent to {confirmedBooking.guestEmail}</p>

                        <div className="rounded-xl p-4 text-left mb-6 bg-gray-50 border border-gray-200">
                          <div className="flex flex-col gap-2 text-sm text-black">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Service</span>
                              <span className="font-bold">{selectedService?.title}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date</span>
                              <span className="font-bold">{format(new Date(confirmedBooking.startTime), 'EEEE, MMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Time</span>
                              <span className="font-bold">{format(new Date(confirmedBooking.startTime), 'h:mm a')} – {format(new Date(confirmedBooking.endTime), 'h:mm a')}</span>
                            </div>
                            {selectedService && selectedService.price > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Price</span>
                                <span className="font-bold text-black">${selectedService.price.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={resetBooking}
                          className="font-bold transition-opacity underline text-black hover:text-gray-600"
                        >
                          Book another session
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            <footer className="mt-8 py-8 flex flex-col items-center gap-2">
              <div className="flex flex-col items-center justify-center gap-1 opacity-70 text-black">
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
