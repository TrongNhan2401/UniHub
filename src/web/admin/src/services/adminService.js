import api from "./api";

export const authService = {
  login: (email, password) => api.post("/auth/signin", { email, password }),
  me: () => api.get("/auth/me"),
  createCheckinStaff: (data) =>
    api.post("/auth/signup", {
      ...data,
      role: "CHECKIN_STAFF",
    }),
};

export const workshopService = {
  getAll: (params) => api.get("/workshops", { params }),
  getById: (id) => api.get(`/workshops/${id}`),
  create: (data) => api.post("/workshops", data),
  update: (id, data) => api.put(`/workshops/${id}`, data),
  cancel: (id) => api.patch(`/workshops/${id}/cancel`),
  publish: (id) => api.patch(`/workshops/${id}/publish`),
  uploadPdf: (id, formData) => api.post(`/workshops/${id}/pdf`, formData),
};

export const registrationService = {
  getAll: (params) => api.get("/registrations", { params }),
  exportCsv: (workshopId) => api.get(`/registrations/export`, { params: { workshopId }, responseType: "blob" }),
};

export const notificationService = {
  sendTestEmail: (toEmail, toName) => api.post("/notifications/test-email", { toEmail, toName }),
};

export const checkinService = {
  getByWorkshop: (workshopId) => api.get(`/checkins/workshops/${workshopId}`),
  getRegistrationsByWorkshop: (workshopId) => api.get(`/checkins/workshops/${workshopId}/registrations`),
};
