import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim();
  }

  // Android emulator cannot reach host machine via localhost.
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5186/api";
  }

  return "http://localhost:5186/api";
}

// SecureStore is not available on web — fall back to localStorage
const storage = {
  getItem: async (key) => {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export { storage as tokenStorage };

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("checkin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const checkinService = {
  login: (data) => api.post("/auth/signin", data),
  getWorkshops: (params = {}) => api.get("/workshops", { params }),
  getAttendanceByWorkshop: (workshopId) => api.get(`/checkins/workshops/${workshopId}`),
  preloadRegistrations: (workshopId) => api.get(`/checkins/workshops/${workshopId}/registrations`),
  validateRegistration: (registrationId, workshopId) =>
    api.get(`/checkins/registrations/${registrationId}/validate`, {
      params: { workshop_id: workshopId },
    }),
  checkin: (payload) => api.post("/checkins", payload),
  sync: (records) => api.post("/checkins/sync", { records }),
};

export default api;
