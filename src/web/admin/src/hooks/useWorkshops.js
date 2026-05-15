import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workshopService } from "../services/adminService";

/**
 * Hook for fetching paged workshops list
 */
export function useWorkshopsList(params = { pageNumber: 1, pageSize: 10 }) {
  return useQuery({
    queryKey: ["workshops", params],
    queryFn: async () => {
      const response = await workshopService.getAll(params);
      return response.data;
    },
  });
}

/**
 * Hook for fetching workshop detail by ID
 */
export function useWorkshopDetail(id) {
  return useQuery({
    queryKey: ["workshop", id],
    queryFn: async () => {
      const response = await workshopService.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for creating a new workshop
 */
export function useCreateWorkshop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await workshopService.create(formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });
}

/**
 * Hook for updating an existing workshop
 */
export function useUpdateWorkshop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await workshopService.update(id, formData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
      queryClient.invalidateQueries({ queryKey: ["workshop", variables.id] });
    },
  });
}

/**
 * Hook for publishing a workshop
 */
export function usePublishWorkshop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await workshopService.publish(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
      queryClient.invalidateQueries({ queryKey: ["workshop", id] });
    },
  });
}

/**
 * Hook for canceling a workshop
 */
export function useCancelWorkshop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await workshopService.cancel(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
      queryClient.invalidateQueries({ queryKey: ["workshop", id] });
    },
  });
}

/**
 * Hook for uploading workshop image
 */
export function useUploadWorkshopImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await workshopService.uploadImage(id, formData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workshop", variables.id] });
    },
  });
}
