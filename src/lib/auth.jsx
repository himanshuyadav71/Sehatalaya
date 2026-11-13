import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';

const AuthContext = createContext(null);

// The browser only *asks* the database whether the signed-in user is the
// owner (public.is_owner()). This drives what the UI shows. The actual
// protection is Row Level Security: every write is re-checked in Postgres.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));

  const checkOwner = useCallback(async (nextSession) => {
    if (!supabase || !nextSession) {
      setIsOwner(false);
      return false;
    }
    const { data, error } = await supabase.rpc('is_owner');
    const ok = !error && data === true;
    setIsOwner(ok);
    return ok;
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await checkOwner(data.session);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      // Defer the RPC so it does not run inside the auth callback.
      setTimeout(() => {
        if (active) checkOwner(nextSession);
      }, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [checkOwner]);

  const signIn = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      const ok = await checkOwner(data.session);
      if (!ok) {
        await supabase.auth.signOut();
        return { error: 'This account is not the site owner.' };
      }
      return { error: null };
    },
    [checkOwner],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsOwner(false);
  }, []);

  const value = useMemo(
    () => ({ session, isOwner, loading, signIn, signOut }),
    [session, isOwner, loading, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
