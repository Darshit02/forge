import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/api.js";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: localStorage.getItem("forge_access_token") || null,
      isAuthenticated: !!localStorage.getItem("forge_access_token"),

      setAuth: (user, accessToken) => {
        localStorage.setItem("forge_access_token", accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem("forge_access_token");
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "forge_auth_state",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
