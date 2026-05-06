import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/queryClient';
import type { User, Role } from '@/types/domain';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  currentUser: User | null;
  roles: Role[];
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Load current user profile from Users table once authenticated
  const { data: currentUser = null } = useQuery({
    queryKey: qk.currentUser,
    enabled: !!session,
    staleTime: 60_000,
    queryFn: async (): Promise<User | null> => {
      if (!session) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('AuthUserId', session.user.id)
        .eq('IsActive', true)
        .maybeSingle();
      if (error) throw error;
      return data as User | null;
    },
  });

  // Roles list (needed for permission resolution + UI badges)
  const { data: roles = [] } = useQuery({
    queryKey: qk.roles,
    enabled: !!session,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Role[]> => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('SortOrder');
      if (error) throw error;
      return (data ?? []) as Role[];
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, currentUser, roles, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
