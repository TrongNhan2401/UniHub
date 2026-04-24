import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: "demo-admin-token",
      user: { name: "Admin Demo", role: "ORGANIZER" },
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "unihub-admin-auth" },
  ),
);
