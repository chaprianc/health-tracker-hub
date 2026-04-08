import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    setProfile(data ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const syncSession = async (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        return;
      }

      try {
        await fetchProfile(nextSession.user.id);
      } catch (e) {
        console.error("Failed to fetch profile", e);
        if (mounted) setProfile(null);
      }
    };

    // Safety timeout - never stay loading more than 5 seconds
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id).catch((e) => {
          console.error("Failed to fetch profile in auth change", e);
          if (mounted) setProfile(null);
        });
      } else {
        setProfile(null);
      }

      if (initialized && mounted) setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await syncSession(session);
      initialized = true;
      if (mounted) setLoading(false);
    }).catch((e) => {
      console.error("Failed to restore session", e);
      initialized = true;
      if (mounted) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Navigate to /auth after sign-out (user/session cleared triggers AuthRoute)

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
