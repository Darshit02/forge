import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { environmentsApi } from "../lib/api/environments.js";
import { toast } from "sonner";

export function useEnvironments(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const environmentsQuery = useQuery({
    queryKey: ["environments", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await environmentsApi.list(projectId);
      return res.environments;
    },
    enabled: Boolean(projectId),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      variables?: Record<string, string>;
      isActive?: boolean;
    }) => {
      if (!projectId) throw new Error("No project ID");
      return environmentsApi.create(projectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environments", projectId] });
      toast.success("Environment created");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create environment");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        variables?: Record<string, string>;
        isActive?: boolean;
      };
    }) => environmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environments", projectId] });
      toast.success("Environment updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update environment");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => environmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environments", projectId] });
      toast.success("Environment deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete environment");
    },
  });

  return {
    environments: environmentsQuery.data ?? [],
    isLoading: environmentsQuery.isLoading,
    refetch: environmentsQuery.refetch,
    createEnvironment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateEnvironment: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteEnvironment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
