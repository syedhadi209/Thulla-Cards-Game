"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "./client";

interface AuthContextValue {
  user: User | null;
  uid: string | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  uid: null,
  loading: true,
  error: null,
  signIn: async () => ({ error: "Auth not ready" }),
  signUp: async () => ({ error: "Auth not ready", needsConfirm: false }),
  signOut: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data, error: getError }) => {
      if (getError) {
        setUser(null);
        // Missing session is normal when logged out — don't banner it.
        if (getError.message && !/session|jwt|auth session/i.test(getError.message)) {
          setError(getError.message);
        }
      } else {
        setUser(data.user);
        setError(null);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    if (signError) return { error: signError.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error: signError } = await supabase.auth.signUp({ email, password });
    if (signError) return { error: signError.message, needsConfirm: false };
    // No session means email confirmation is required in the project settings.
    const needsConfirm = !data.session;
    return { error: null, needsConfirm };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      uid: user?.id ?? null,
      loading,
      error,
      signIn,
      signUp,
      signOut,
    }),
    [user, loading, error, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
