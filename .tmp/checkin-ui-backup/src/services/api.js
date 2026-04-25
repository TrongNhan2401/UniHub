import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("checkin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const checkinService = {
  login: (data) => api.post("/auth/login", data),
  verify: (qrCode) => api.post("/checkin/verify", { qrCode }),
};

export default api;
