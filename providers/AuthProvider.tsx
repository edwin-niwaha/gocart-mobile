import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '@/api/services';
import { clearTokens, getTokens, saveTokens } from '@/utils/storage';
import { showError, showInfo, showSuccess } from '@/utils/toast';
import type {
  User,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from '@/types';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  ready: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  googleLogin: (accessToken: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setAuthUser: (user: User | null) => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getApiErrorMessage(error: any, fallback = 'Something went wrong.') {
  const data = error?.response?.data;

  if (typeof data === 'string') return data;
  if (Array.isArray(data) && data.length) return String(data[0]);
  if (data?.detail) return String(data.detail);
  if (data?.message) return String(data.message);
  if (data?.non_field_errors?.[0]) return String(data.non_field_errors[0]);

  if (data?.email?.[0]) return String(data.email[0]);
  if (data?.username?.[0]) return String(data.username[0]);
  if (data?.password?.[0]) return String(data.password[0]);
  if (data?.password_confirm?.[0]) return String(data.password_confirm[0]);
  if (data?.code?.[0]) return String(data.code[0]);

  if (typeof error?.message === 'string') return error.message;

  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const setAuthUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch (error) {
      await clearTokens();
      setUser(null);
      throw error;
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const response = await authApi.login(payload);
      await saveTokens(response.tokens);
      setUser(response.user);
      showSuccess('Logged in successfully.');
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Login failed.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const response = await authApi.register(payload);
      await saveTokens(response.tokens);
      setUser(response.user);
      showSuccess('Account created successfully.');
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Registration failed.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (accessToken: string) => {
    setLoading(true);
    try {
      const response = await authApi.googleLogin(accessToken);
      await saveTokens(response.tokens);
      setUser(response.user);
      showSuccess('Signed in with Google successfully.');
      return response.user;
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Google sign-in failed.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const tokens = await getTokens();
      await authApi.logout(tokens?.refresh);
      showInfo('Logged out successfully.');
    } catch {
    } finally {
      await clearTokens();
      setUser(null);
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      showSuccess('Password reset instructions sent to your email.');
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Failed to send reset email.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    setLoading(true);
    try {
      await authApi.resetPassword(payload);
      showSuccess('Password reset successfully.');
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Password reset failed.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    setLoading(true);
    try {
      await authApi.changePassword(payload);
      showSuccess('Password changed successfully.');
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Failed to change password.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendEmailVerification = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.sendEmailVerification();
      showSuccess('Verification email sent.');
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Failed to send verification email.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(
    async (code: string) => {
      setLoading(true);
      try {
        const response = await authApi.verifyEmail(code);

        if (response?.user) {
          setUser(response.user);
        } else {
          await refreshMe();
        }

        showSuccess('Email verified successfully.');
      } catch (error: any) {
        showError(getApiErrorMessage(error, 'Email verification failed.'));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refreshMe]
  );

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        const tokens = await getTokens();

        if (tokens?.access) {
          const me = await authApi.me();
          if (mounted) setUser(me);
        }
      } catch {
        await clearTokens();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setReady(true);
      }
    };

    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      ready,
      isAuthenticated: !!user,
      login,
      register,
      googleLogin,
      logout,
      refreshMe,
      setAuthUser,
      forgotPassword,
      resetPassword,
      changePassword,
      sendEmailVerification,
      verifyEmail,
    }),
    [
      user,
      loading,
      ready,
      login,
      register,
      googleLogin,
      logout,
      refreshMe,
      setAuthUser,
      forgotPassword,
      resetPassword,
      changePassword,
      sendEmailVerification,
      verifyEmail,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}