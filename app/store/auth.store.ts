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
    // If already initialized or currently loading, don't run again
    const state = useAuthStore.getState();
    if (state.initialized) return;

    set({ loading: true });

    // Fail-safe timeout: ensure initialized is true after 5s regardless of network
    const timeoutId = setTimeout(() => {
      const currentState = useAuthStore.getState();
      if (!currentState.initialized) {
        console.warn("Auth initialization timed out. Forcing initialized state.");
        set({ loading: false, initialized: true });
      }
    }, 5000);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session?.user) {
        const { data: roleData, error: roleError } = await supabase
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
    } catch (err) {
      console.error("Auth initialization error:", err);
    } finally {
      clearTimeout(timeoutId);
      set({ loading: false, initialized: true });
    }

    // Single listener setup
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null, loading: false });
        return;
      }
      
      if (session?.user) {
        // Only fetch if user state is missing or doesn't match
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || currentUser.id !== session.user.id) {
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
              },
              loading: false
            });
          }
        }
      }
    });
  },
}));
