import { create } from 'zustand';
import { supabase } from '~/lib/supabase';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'RESIDENT';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
  phone: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserRole>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signOut: async () => {
    // Clear user state immediately so the UI responds instantly
    set({ user: null });
    // Tell Supabase to invalidate session
    await supabase.auth.signOut();
  },

  signIn: async (email, password) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    if (!authData.user) throw new Error("Invalid login credentials");

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role, name, phone')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (roleError || !roleData) {
       throw new Error("User role not configured");
    }

    // Set user state immediately to avoid redirection race conditions in React Router layouts
    set({
      user: {
        id: authData.user.id,
        email: authData.user.email ?? '',
        role: roleData.role as UserRole,
        name: roleData.name,
        phone: roleData.phone,
      },
      initialized: true,
      loading: false
    });

    return roleData.role as UserRole;
  },

  initialize: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, name, phone')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (roleData) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email ?? '',
              role: roleData.role,
              name: roleData.name,
              phone: roleData.phone,
            }
          });
        }
      }
    } finally {
      set({ loading: false, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null });
        return;
      }
      if (session?.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, name, phone')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (roleData) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email ?? '',
              role: roleData.role,
              name: roleData.name,
              phone: roleData.phone,
            }
          });
        }
      }
    });
  },
}));
