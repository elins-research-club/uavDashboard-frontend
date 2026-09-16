"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "@/lib/api";

/* ============================================================
   TYPES
============================================================ */

export type SystemRole = "god" | "admin" | "member" | string;

export type SubscriptionInfo = {
  tier?: string | null;
  status?: string | null;
  end_date?: string | null;
  billing_cycle?: string | null;
  start_date?: string | null;
};

export type AuthUser = {
  id?: string;
  username?: string;
  email?: string;

  role: SystemRole;

  is_protected?: boolean;

  permissions?: string[];

  tier?: string | null;

  subscription?: SubscriptionInfo | null;

  avatar_url?: string | null;

  created_at?: string;
  updated_at?: string;
};

type UserRoleContextValue = {
  user: AuthUser | null;
  userRole: SystemRole | "guest";
  userName: string;
  memberTier: string | null;

  isAuthenticated: boolean;
  isLoading: boolean;

  permissions: string[];

  hasPermission: (permission: string) => boolean;

  isGod: boolean;
  isProtected: boolean;
  isAdmin: boolean;
  isMember: boolean;

  loginAs: (
    role: SystemRole,
    name?: string,
    tier?: string | null,
    extra?: Partial<AuthUser>
  ) => void;

  setAuthenticatedUser: (nextUser: AuthUser) => void;

  refreshCurrentUser: () => Promise<AuthUser | null>;

  logout: () => void;
};

/* ============================================================
   CONTEXT
============================================================ */

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/* ============================================================
   STORAGE HELPERS
============================================================ */

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem("user");

    if (
      !stored ||
      stored === "undefined" ||
      stored === "null" ||
      stored.trim() === ""
    ) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as AuthUser;
  } catch (error) {
    console.warn("Gagal membaca data user dari localStorage:", error);

    try {
      localStorage.removeItem("user");
    } catch {
      // Ignore storage errors.
    }

    return null;
  }
}

function normalizeUser(user: AuthUser): AuthUser {
  const subscriptionTier = user.subscription?.tier ?? user.tier ?? null;

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  return {
    ...user,

    role: user.role || "member",

    is_protected: Boolean(user.is_protected),

    permissions: [...new Set(permissions)],

    tier: subscriptionTier,

    subscription: user.subscription ?? null,
  };
}

/* ============================================================
   PROVIDER
============================================================ */

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ----------------------------------------------------------
     Persist user
  ---------------------------------------------------------- */

  const persistUser = useCallback((nextUser: AuthUser) => {
    const normalized = normalizeUser(nextUser);

    setUser(normalized);

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(normalized));
    }
  }, []);

  /* ----------------------------------------------------------
     Initial localStorage load
  ---------------------------------------------------------- */

  useEffect(() => {
    const storedUser = readStoredUser();

    if (storedUser) {
      setUser(normalizeUser(storedUser));
    }

    setIsLoading(false);
  }, []);

  /* ----------------------------------------------------------
     Refresh current user from backend
  ---------------------------------------------------------- */

  const refreshCurrentUser = useCallback(async () => {
    if (typeof window === "undefined") {
      return null;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const { data } = await api.get<AuthUser>("/users/me");

      const normalized = normalizeUser(data);

      setUser(normalized);

      localStorage.setItem("user", JSON.stringify(normalized));

      return normalized;
    } catch (error: any) {
      /*
       * A 401 is already handled by api.ts.
       *
       * For other errors, retain the current local user so
       * the application does not unnecessarily log the user out.
       */
      if (error?.response?.status === 401) {
        setUser(null);
      }

      return null;
    }
  }, []);

  /* ----------------------------------------------------------
     Backend synchronization
  ---------------------------------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    refreshCurrentUser();
  }, [refreshCurrentUser]);

  /* ----------------------------------------------------------
     Permission helper
  ---------------------------------------------------------- */

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) {
        return false;
      }

      if (user.role === "god") {
        return true;
      }

      if (user.is_protected) {
        return true;
      }

      const permissions = user.permissions ?? [];

      return permissions.includes("all") || permissions.includes(permission);
    },
    [user]
  );

  /* ----------------------------------------------------------
     Login compatibility helper
  ---------------------------------------------------------- */

  const loginAs = useCallback(
    (
      role: SystemRole,
      name = "USERNAME",
      tier: string | null = null,
      extra: Partial<AuthUser> = {}
    ) => {
      const nextUser: AuthUser = normalizeUser({
        role,
        username: name,
        tier,
        ...extra,
      });

      persistUser(nextUser);
    },
    [persistUser]
  );

  /* ----------------------------------------------------------
     Authenticated user setter
  ---------------------------------------------------------- */

  const setAuthenticatedUser = useCallback(
    (nextUser: AuthUser) => {
      persistUser(nextUser);
    },
    [persistUser]
  );

  /* ----------------------------------------------------------
     Logout
  ---------------------------------------------------------- */

  const logout = useCallback(() => {
    setUser(null);

    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("memberTier");
  }, []);

  /* ----------------------------------------------------------
     Idle timeout
  ---------------------------------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined" || !localStorage.getItem("token")) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const logoutForIdle = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      localStorage.removeItem("memberTier");

      setUser(null);

      window.location.href = "/login?reason=idle";
    };

    const resetIdleTimer = () => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(logoutForIdle, IDLE_TIMEOUT_MS);
    };

    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];

    events.forEach((event) =>
      window.addEventListener(event, resetIdleTimer, { passive: true })
    );

    resetIdleTimer();

    return () => {
      clearTimeout(timeoutId);

      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
    };
  }, [user]);

  /* ----------------------------------------------------------
     Derived values
  ---------------------------------------------------------- */

  const permissions = useMemo(() => user?.permissions ?? [], [user]);

  const value = useMemo<UserRoleContextValue>(
    () => ({
      user,

      userRole: user?.role || "guest",

      userName: user?.username || user?.email || "GUEST",

      memberTier: user?.subscription?.tier ?? user?.tier ?? null,

      isAuthenticated: Boolean(user),

      isLoading,

      permissions,

      hasPermission,

      isGod: user?.role === "god",

      isProtected: Boolean(user?.is_protected),

      isAdmin: user?.role === "admin",

      isMember: user?.role === "member",

      loginAs,

      setAuthenticatedUser,

      refreshCurrentUser,

      logout,
    }),
    [
      user,
      isLoading,
      permissions,
      hasPermission,
      loginAs,
      setAuthenticatedUser,
      refreshCurrentUser,
      logout,
    ]
  );

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
}

/* ============================================================
   HOOK
============================================================ */

export function useUserRole(): UserRoleContextValue {
  const context = useContext(UserRoleContext);

  if (!context) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }

  return context;
}
