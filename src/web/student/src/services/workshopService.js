import api from "./api";

export const authService = {
  login: (data) => api.post("/auth/signin", data),
};

export const workshopService = {
  getAll: (params) => api.get("/workshops", { params }),
  getById: (id) => api.get(`/workshops/${id}`),
};

export const registrationService = {
  register: (workshopId, idempotencyKey) =>
    api.post(
      "/registrations",
      { workshopId },
      {
        headers: { "Idempotency-Key": idempotencyKey },
      },
    ),
  getMyRegistrations: () => api.get("/registrations/mine"),
};
