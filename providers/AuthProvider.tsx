import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '@/api/services';
import { clearTokens, getTokens, saveTokens } from '@/utils/storage';
import type { User } from '@/types';

type LoginPayload = { email: string; password: string };
type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  ready: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshMe = async () => {
    const me = await authApi.me();
    setUser(me);
  };

  useEffect(() => {
    (async () => {
      try {
        const tokens = await getTokens();
        if (tokens?.access) {
          await refreshMe();
        }
      } catch {
        await clearTokens();
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      ready,
      isAuthenticated: !!user,

      login: async (payload) => {
        setLoading(true);
        try {
          const response = await authApi.login(payload);
          await saveTokens(response.tokens);
          setUser(response.user);
        } finally {
          setLoading(false);
        }
      },

      register: async (payload) => {
        setLoading(true);
        try {
          const response = await authApi.register(payload);
          await saveTokens(response.tokens);
          setUser(response.user);
        } finally {
          setLoading(false);
        }
      },

      logout: async () => {
        setLoading(true);
        try {
          const tokens = await getTokens();
          await authApi.logout(tokens?.refresh);
        } catch {
        } finally {
          await clearTokens();
          setUser(null);
          setLoading(false);
        }
      },

      refreshMe,
    }),
    [loading, ready, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
