import api from "../services/api";

export const signinApi = async (email, password) => {
  const response = await api.post("/auth/signin", { email, password });
  // Based on adminService.js, it seems to return data directly or through axios response
  return response.data; 
};

export const signupApi = async (payload) => {
  const response = await api.post("/auth/signup", payload);
  return response.data;
};

export const verifyOtpApi = async (email, otp) => {
  const response = await api.post("/auth/verify-otp", { email, otp });
  return response.data;
};

