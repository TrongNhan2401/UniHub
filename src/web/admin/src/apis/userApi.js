import api from "../services/api";

export const getUserProfileApi = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
