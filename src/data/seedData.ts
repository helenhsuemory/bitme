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
  user: {
    id: 'u1',
    username: 'alexrivera',
    email: 'alex@example.com',
    displayName: 'Alex Rivera',
    title: 'Digital Product Designer & Strategy Consultant',
    bio: 'Helping brands scale through design. Specializing in high-growth tech startups and design systems.',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBI9Zly9IQbxwf6erWAJ3S-mRTpJPVaoUw1p7XoHzOkQyDUkzL6RB9G9cn36xi1HnR2UQUW_Jd5tK51if9UHIMb5V6VmnW9iVV37EP48YdEw_yqoxyocbhVxAh4TXDZi2nLxNJlXk3aY2o-zDGpb5-eNcNfhjYXgA0OOKZZcgzgyFJ0kIhnarmB3Zuc7uWVquRmzixern8vooiytSYIdsAVlW_L_vffe1YaKRDqKwnMZLIJGui43kn0i25e69dvGQPpAY7IXq9O5Hc',
    timezone: 'America/New_York',
    themePrefs: {
      themeId: 'tech-innovation',
      primaryColor: '#6C63FF',
      buttonStyle: 'filled',
    },
    socialLinks: {
      twitter: 'https://x.com/alexrivera',
      instagram: 'https://instagram.com/alexrivera',
      linkedin: 'https://linkedin.com/in/alexrivera',
      github: 'https://github.com/alexrivera',
      youtube: '',
    },
  },

  folders: [
    { id: 'f1', title: 'Portfolio & Work' },
    { id: 'f2', title: 'Social Media' },
  ],

  links: [
    { id: 'l1', title: 'Latest Case Study', url: 'https://case-study-link.com', icon: 'rocket_launch', clicks: 450, folderId: 'f1', isActive: true },
    { id: 'l2', title: 'Design Portfolio', url: 'https://portfolio-link.com', icon: 'grid_view', clicks: 320, folderId: 'f1', isActive: true },
    { id: 'l3', title: 'Follow me on X', url: 'https://x.com/alexrivera', icon: 'alternate_email', clicks: 210, folderId: 'f2', isActive: true },
    { id: 'l4', title: 'Newsletter Subscription', url: 'https://newsletter.com', icon: 'mail', clicks: 150, folderId: 'f2', isActive: true },
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
