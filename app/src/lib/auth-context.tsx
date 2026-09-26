import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  getSupabase,
  isSupabaseConfigured,
  type Profile,
  type UserRole,
} from "./supabase";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  signInWithGitHub: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const fetchOrCreateProfile = useCallback(
    async (authUser: User): Promise<Profile | null> => {
      const client = getSupabase();
      try {
        const githubUsername =
          authUser.user_metadata?.user_name ||
          authUser.user_metadata?.preferred_username ||
          "";

        // First try to fetch the profile from public.profiles
        const { data, error: selectError } = await client
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (data && !selectError) {
          const loadedProfile = {
            ...(data as Profile),
            github_username: (data as Profile).github_username || githubUsername,
          };
          setProfile(loadedProfile);
          return loadedProfile;
        }

        // If not found or trigger has not run yet, create it as customer
        const fullName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          githubUsername ||
          authUser.email?.split("@")[0] ||
          "Learner";
        const email = authUser.email || authUser.user_metadata?.email || "";
        const avatarUrl =
          authUser.user_metadata?.avatar_url ||
          "";

        const newProfile: Partial<Profile> = {
          id: authUser.id,
          full_name: fullName,
          email,
          avatar_url: avatarUrl,
          github_username: githubUsername,
          role: "customer",
        };

        const { data: inserted, error: insertError } = await client
          .from("profiles")
          .upsert(newProfile, { onConflict: "id" })
          .select()
          .maybeSingle();

        if (inserted && !insertError) {
          const synced = {
            ...(inserted as Profile),
            github_username: (inserted as Profile).github_username || githubUsername,
          };
          setProfile(synced);
          return synced;
        }

        // Fallback in-memory profile if database is unreachable or offline
        const fallbackProfile: Profile = {
          id: authUser.id,
          full_name: fullName,
          email,
          avatar_url: avatarUrl,
          github_username: githubUsername,
          role: "customer",
          created_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        return fallbackProfile;
      } catch (err) {
        console.error("Failed to load or sync profile:", err);
        const githubUsername =
          authUser.user_metadata?.user_name ||
          authUser.user_metadata?.preferred_username ||
          "";
        const fallbackProfile: Profile = {
          id: authUser.id,
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            githubUsername ||
            "Learner",
          email: authUser.email || "",
          avatar_url:
            authUser.user_metadata?.avatar_url ||
            "",
          github_username: githubUsername,
          role: "customer",
          created_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const client = getSupabase();

    // 1. Check for initial session on mount (restores session after refresh)
    client.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error: sessionError }) => {
        if (sessionError) {
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchOrCreateProfile(initialSession.user);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Auth session recovery error:", err);
        setLoading(false);
      });

    // 2. Subscribe to auth state changes (sign-in, token refresh, sign-out)
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (newSession?.user) {
          await fetchOrCreateProfile(newSession.user);
        }
        setError(null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      } else if (event === "USER_UPDATED") {
        if (newSession?.user) {
          await fetchOrCreateProfile(newSession.user);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchOrCreateProfile]);

  const signInWithGitHub = useCallback(
    async (redirectTo?: string) => {
      if (typeof window === "undefined") return;
      setError(null);

      if (!configured) {
        setError(
          "Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
        );
        return;
      }

      const client = getSupabase();
      const origin = window.location.origin;
      const callbackUrl = new URL("/auth/callback", origin);
      if (redirectTo) {
        callbackUrl.searchParams.set("next", redirectTo);
      }

      const { error: signInError } = await client.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (signInError) {
        setError(signInError.message);
        throw signInError;
      }
    },
    [configured]
  );

  const signOut = useCallback(async () => {
    if (typeof window === "undefined") return;
    setError(null);
    const client = getSupabase();
    try {
      await client.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      window.location.assign("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      setUser(null);
      setProfile(null);
      setSession(null);
      window.location.assign("/login");
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    return fetchOrCreateProfile(user);
  }, [user, fetchOrCreateProfile]);

  const clearError = useCallback(() => setError(null), []);

  const role: UserRole = profile?.role || "customer";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        session,
        loading,
        error,
        isConfigured: configured,
        signInWithGitHub,
        signOut,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
