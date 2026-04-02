import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, loginWithPassword, logout, refreshToken, requestLoginOtp, signup, verifyLoginOtp, verifySignupOtp } from "./api";
import { clearTokens, readTokens, saveTokens } from "./storage";
import { AppUser } from "./types";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  verifySignUpOtp: (input: { email: string; code: string }) => Promise<void>;
  signInPassword: (input: { email: string; password: string }) => Promise<{ requiresOtp?: boolean; email?: string }>;
  requestOtpSignIn: (input: { email: string }) => Promise<void>;
  verifyOtpSignIn: (input: { email: string; code: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  // Must stay a real boolean — a string like "false" is truthy and breaks `if (loading)` and native props.
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const tokens = await readTokens();
        if (!tokens) return;

        try {
          const me = await fetchMe(tokens.accessToken);
          setUser(me.user);
          return;
        } catch {
          const refreshed = await refreshToken({ refreshToken: tokens.refreshToken });
          await saveTokens(refreshed);
          const me = await fetchMe(refreshed.accessToken);
          setUser(me.user);
        }
      } catch {
        await clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const refreshUser = useCallback(async () => {
    const tokens = await readTokens();
    if (!tokens) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe(tokens.accessToken);
      setUser(me.user);
    } catch {
      try {
        const refreshed = await refreshToken({ refreshToken: tokens.refreshToken });
        await saveTokens(refreshed);
        const me = await fetchMe(refreshed.accessToken);
        setUser(me.user);
      } catch {
        await clearTokens();
        setUser(null);
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refreshUser,
      async signUp(input) {
        await signup(input);
      },
      async verifySignUpOtp(input) {
        const payload = await verifySignupOtp(input);
        await saveTokens({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        });
        setUser(payload.user);
      },
      async signInPassword(input) {
        const payload = await loginWithPassword(input);
        if ("requiresOtp" in payload) return payload;

        await saveTokens({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        });
        setUser(payload.user);
        return {};
      },
      async requestOtpSignIn(input) {
        await requestLoginOtp(input);
      },
      async verifyOtpSignIn(input) {
        const payload = await verifyLoginOtp(input);
        await saveTokens({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        });
        setUser(payload.user);
      },
      async signOut() {
        const tokens = await readTokens();
        if (tokens?.refreshToken) {
          await logout(tokens.refreshToken).catch(() => null);
        }
        await clearTokens();
        setUser(null);
      },
    }),
    [loading, user, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
