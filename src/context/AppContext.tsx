import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AppState, AppAction, Toast, AuthUser } from '../types';
import { seedData } from '../data/seedData';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // --- Links ---
    case 'ADD_LINK':
      return { ...state, links: [...state.links, action.payload] };
    case 'UPDATE_LINK':
      return { ...state, links: state.links.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LINK':
      return { ...state, links: state.links.filter(l => l.id !== action.payload) };
    case 'REORDER_LINKS':
      return { ...state, links: action.payload };

    // --- Folders ---
    case 'ADD_FOLDER':
      return { ...state, folders: [...state.folders, action.payload] };
    case 'DELETE_FOLDER':
      return {
        ...state,
        folders: state.folders.filter(f => f.id !== action.payload),
        links: state.links.map(l => l.folderId === action.payload ? { ...l, folderId: null } : l),
      };

    // --- Services ---
    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] };
    case 'UPDATE_SERVICE':
      return { ...state, services: state.services.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SERVICE':
      return { ...state, services: state.services.filter(s => s.id !== action.payload) };

    // --- Availability ---
    case 'SET_AVAILABILITY':
      return { ...state, availability: action.payload };

    // --- Bookings ---
    case 'ADD_BOOKING':
      return { ...state, bookings: [...state.bookings, action.payload] };
    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.payload.id ? { ...b, status: action.payload.status } : b
        ),
      };

    // --- User ---
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'UPDATE_THEME':
      return { ...state, user: { ...state.user, themePrefs: { ...state.user.themePrefs, ...action.payload } } };
    case 'TOGGLE_INTEGRATION': {
      const currentIntegrations = state.user.integrations || { google: false, outlook: false };
      return {
        ...state,
        user: {
          ...state.user,
          integrations: {
            ...currentIntegrations,
            [action.payload]: !currentIntegrations[action.payload]
          }
        }
      };
    }

    // --- Toasts ---
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    // --- Auth ---
    case 'SET_AUTH_USER':
      return { ...state, authUser: action.payload };
    case 'SET_AUTH_LOADING':
      return { ...state, authLoading: action.payload };
    case 'SET_STATE':
      return { ...state, ...action.payload, authUser: state.authUser, authLoading: state.authLoading, toasts: state.toasts };

    default:
      return state;
  }
}

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | null>(null);

const STORAGE_KEY = 'bitme_app_state';

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure auth defaults overrides so we rely on Firebase actual check
      // Also ensure toasts are cleared so they don't get stuck forever on reload
      return { ...parsed, authUser: null, authLoading: true, toasts: [] };
    }
  } catch (e) {
    console.warn('Failed to load state', e);
  }
  return { ...seedData, authUser: null, authLoading: true, toasts: [] };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, loadState());

  useEffect(() => {
    // Avoid saving auth user flag to local storage directly, let firebase manage the token
    // Also do not save toasts to local storage since they are ephemeral
    const stateToSave = { ...state, authUser: null, authLoading: true, toasts: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [state]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        dispatch({ 
          type: 'SET_AUTH_USER', 
          payload: { 
            uid: user.uid, 
            email: user.email || '', 
            displayName: user.displayName || '', 
            photoURL: user.photoURL || '' 
          } 
        });

        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const cloudData = userDoc.data() as Partial<AppState>;
            dispatch({ type: 'SET_STATE', payload: cloudData as AppState });
          }
        } catch (error) {
          console.error('Error fetching user data from Firestore:', error);
        }
      } else {
        dispatch({ type: 'SET_AUTH_USER', payload: null });
      }
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    });
    return () => unsubscribe();
  }, []);

  // Sync to Firestore when state changes and user is authenticated
  useEffect(() => {
    if (state.authUser) {
      const syncToFirestore = async () => {
        try {
          // We only sync the core data, not auth state or toasts
          const { authUser, authLoading, toasts, ...dataToSync } = state;
          await setDoc(doc(db, 'users', state.authUser!.uid), dataToSync, { merge: true });
        } catch (error) {
          console.error('Error syncing to Firestore:', error);
        }
      };
      
      // Debounce sync slightly to avoid hitting limits during rapid edits
      const timer = setTimeout(syncToFirestore, 1000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx;
}

export function useAuth() {
  const { authUser, authLoading } = useAppState();
  
  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return { authUser, authLoading, loginWithGoogle, logout };
}

export function useToast() {
  const dispatch = useAppDispatch();

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, 3000);
  }, [dispatch]);

  return addToast;
}
