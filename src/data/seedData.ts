import { AppState } from '../types';

const now = new Date();
const today = now.toISOString().slice(0, 10);

function isoDate(daysFromNow: number, hour: number, minute: number = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const seedData: AppState = {
  authUser: null,
  authLoading: true,
  user: {
    id: 'u1',
    username: 'helenhsu',
    email: 'helen@example.com',
    displayName: 'Helen Hsu',
    title: 'Enterprise Risk Strategist | AI & Compliance',
    bio: 'Helping enterprises scale securely. Specializing in SOX compliance and AI-driven risk solutions.',
    avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocL8jXj7jRz9O3kH5v7o1V2y3n8u0z9s=s288-c-no',
    timezone: 'America/New_York',
    themePrefs: {
      themeId: 'forest-canopy',
      primaryColor: '#2D6A4F',
      buttonStyle: 'filled',
    },
    socialLinks: {
      twitter: '',
      instagram: 'https://instagram.com/helenhsu',
      linkedin: 'https://linkedin.com/in/helenhsu',
      github: '',
      youtube: '',
    },
  },

  folders: [
    { id: 'f1', title: 'Portfolio & Work' },
    { id: 'f2', title: 'Social Media' },
  ],

  links: [
    { id: 'l1', title: 'Venture Studio for Woman', url: 'https://venture-studio.com', icon: 'public', clicks: 0, folderId: 'f1', isActive: true },
    { id: 'l2', title: 'AI-Powered Workspace', url: 'https://ai-workspace.com', icon: 'dashboard', clicks: 0, folderId: 'f1', isActive: true },
  ],

  services: [
    {
      id: 's1',
      title: '15-min Discovery Call',
      description: 'Introductory chat to discuss your project',
      durationMinutes: 15,
      price: 0,
      icon: 'call',
      isActive: true,
    },
    {
      id: 's2',
      title: '1-hour Strategy Consultation',
      description: 'Deep dive into your product strategy',
      durationMinutes: 60,
      price: 150,
      icon: 'psychology',
      isActive: true,
    },
  ],

  availability: [
    { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 1, enabled: true,  startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 2, enabled: true,  startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 3, enabled: true,  startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 4, enabled: true,  startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 5, enabled: true,  startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '17:00' },
  ],

  bookings: [
    {
      id: 'b1',
      serviceId: 's2',
      guestName: 'Jane Smith',
      guestEmail: 'jane@example.com',
      notes: 'Want to discuss our new product launch.',
      startTime: isoDate(0, 9, 0),
      endTime: isoDate(0, 10, 0),
      status: 'confirmed',
      createdAt: isoDate(-2, 14, 0),
    },
    {
      id: 'b2',
      serviceId: 's1',
      guestName: 'Marcus Davis',
      guestEmail: 'marcus@example.com',
      notes: '',
      startTime: isoDate(0, 14, 30),
      endTime: isoDate(0, 14, 45),
      status: 'confirmed',
      createdAt: isoDate(-1, 10, 0),
    },
    {
      id: 'b3',
      serviceId: 's2',
      guestName: 'Alice Lawson',
      guestEmail: 'alice@example.com',
      notes: 'Need help with our rebrand.',
      startTime: isoDate(1, 10, 0),
      endTime: isoDate(1, 11, 0),
      status: 'confirmed',
      createdAt: isoDate(-1, 16, 0),
    },
    {
      id: 'b4',
      serviceId: 's2',
      guestName: 'Robert King',
      guestEmail: 'robert@example.com',
      notes: 'Follow-up from last session.',
      startTime: isoDate(1, 16, 0),
      endTime: isoDate(1, 17, 0),
      status: 'confirmed',
      createdAt: isoDate(0, 8, 0),
    },
    {
      id: 'b5',
      serviceId: 's1',
      guestName: 'Emily Chen',
      guestEmail: 'emily@example.com',
      notes: '',
      startTime: isoDate(-3, 11, 0),
      endTime: isoDate(-3, 11, 15),
      status: 'completed',
      createdAt: isoDate(-5, 9, 0),
    },
  ],

  toasts: [],
};
