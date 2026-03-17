export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  title: string;
  bio: string;
  avatarUrl: string;
  timezone: string;
  themePrefs: ThemePrefs;
  socialLinks: Record<string, string>; // e.g. { twitter: 'https://...', instagram: '...' }
  ownerUid?: string | null;
}

export interface ThemePrefs {
  themeId: string; // references a ThemeDefinition.id
  primaryColor: string;
  buttonStyle: 'filled' | 'outline' | 'soft';
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  clicks: number;
  folderId: string | null;
  isActive: boolean;
}

export interface Folder {
  id: string;
  title: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  icon: string;
  isActive: boolean;
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0=Sun, 1=Mon, ... 6=Sat
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export type BookingStatus = 'confirmed' | 'canceled' | 'completed';

export interface Booking {
  id: string;
  serviceId: string;
  guestName: string;
  guestEmail: string;
  notes: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  status: BookingStatus;
  createdAt: string; // ISO string
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export interface AppState {
  user: User;
  links: LinkItem[];
  folders: Folder[];
  services: Service[];
  availability: AvailabilitySlot[];
  bookings: Booking[];
  toasts: Toast[];
  authUser: AuthUser | null;
  authLoading: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// --- Actions ---

export type AppAction =
  | { type: 'ADD_LINK'; payload: LinkItem }
  | { type: 'UPDATE_LINK'; payload: LinkItem }
  | { type: 'DELETE_LINK'; payload: string }
  | { type: 'REORDER_LINKS'; payload: LinkItem[] }
  | { type: 'ADD_FOLDER'; payload: Folder }
  | { type: 'DELETE_FOLDER'; payload: string }
  | { type: 'ADD_SERVICE'; payload: Service }
  | { type: 'UPDATE_SERVICE'; payload: Service }
  | { type: 'DELETE_SERVICE'; payload: string }
  | { type: 'SET_AVAILABILITY'; payload: AvailabilitySlot[] }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'UPDATE_BOOKING'; payload: { id: string; status: BookingStatus } }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_THEME'; payload: Partial<ThemePrefs> }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_AUTH_USER'; payload: AuthUser | null }
  | { type: 'SET_AUTH_LOADING'; payload: boolean };
