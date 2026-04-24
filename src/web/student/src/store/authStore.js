// Zustand-style simple auth store (dùng localStorage)
// Thay bằng Zustand sau khi cài: npm install zustand
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: "demo-student-token",
      user: { name: "Student Demo", role: "STUDENT" },
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "unihub-auth" },
  ),
);
