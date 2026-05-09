import api from "./api";

export const authService = {
  login: (data) => api.post("/auth/login", data),
  createCheckinStaff: (data) =>
    api.post("/auth/signup", {
      ...data,
      role: "CHECKIN_STAFF",
    }),
};

export const workshopService = {
  getAll: (params) => api.get("/workshops", { params }),
  create: (data) => api.post("/workshops", data),
  update: (id, data) => api.put(`/workshops/${id}`, data),
  delete: (id) => api.delete(`/workshops/${id}`),
};

export const registrationService = {
  getAll: (params) => api.get("/registrations", { params }),
  exportCsv: (workshopId) => api.get(`/registrations/export`, { params: { workshopId }, responseType: "blob" }),
};

export const notificationService = {
  sendTestEmail: (toEmail, toName) => api.post("/notifications/test-email", { toEmail, toName }),
};
