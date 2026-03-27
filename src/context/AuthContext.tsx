import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}


interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helper: map Supabase user to AppUser ────────────────────────────────────

function mapUser(supabaseUser: User): AppUser {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: (meta.name as string) ?? (meta.full_name as string) ?? supabaseUser.email ?? '',
    role: (meta.role as UserRole) ?? 'student',
  };
}

async function mapUserFromProfile(supabaseUser: User): Promise<AppUser> {
  const fallback = mapUser(supabaseUser);
  const { data } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', supabaseUser.id)
    .maybeSingle();

  const dbRole = data?.role;
  const role: UserRole = dbRole === 'admin' || dbRole === 'student' ? dbRole : fallback.role;
  const name = data?.name || fallback.name;

  return {
    ...fallback,
    name,
    role,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrateUserFromSession(activeSession: Session | null) {
      if (!activeSession?.user) {
        if (!cancelled) setUser(null);
        return;
      }

      try {
        const hydrated = await mapUserFromProfile(activeSession.user);
        if (!cancelled) setUser(hydrated);
      } catch {
        // Never block auth state on profile hydration failures.
        if (!cancelled) setUser(mapUser(activeSession.user));
      }
    }

    // 1. Load existing session on mount
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        await hydrateUserFromSession(data.session);
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // 2. Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (cancelled) return;
        setSession(newSession);
        if (!newSession?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        // Run hydration outside the auth callback to avoid callback deadlocks.
        setTimeout(() => {
          void hydrateUserFromSession(newSession).finally(() => {
            if (!cancelled) setLoading(false);
          });
        }, 0);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  // ── Register ───────────────────────────────────────────────────────────────

  const register = async (name: string, email: string, password: string, phone: string) => {
    const phoneTrim = phone.trim();
    const phoneNorm = phoneTrim.replace(/[\s\-().]/g, '');
    if (!phoneNorm || phoneNorm.length < 8) {
      throw new Error('Enter a valid phone number (at least 8 digits).');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: 'student', phone: phoneTrim },
      },
    });
    if (error) throw new Error(error.message);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}