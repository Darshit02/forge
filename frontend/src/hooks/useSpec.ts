import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { specApi } from "../lib/api/spec.js";
import { toast } from "sonner";

export function useSpec(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const specQuery = useQuery({
    queryKey: ["spec", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Missing projectId");
      const res = await specApi.get(projectId);
      return res.spec;
    },
    enabled: !!projectId,
  });

  const refreshMutation = useMutation({
    mutationFn: () => {
      if (!projectId) throw new Error("Missing projectId");
      return specApi.refresh(projectId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["spec", projectId], data.spec);
      queryClient.invalidateQueries({ queryKey: ["collections", projectId] });
      toast.success("OpenAPI specification re-extracted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to refresh spec");
    },
  });

  return {
    spec: specQuery.data,
    isLoading: specQuery.isLoading,
    isError: specQuery.isError,
    refresh: refreshMutation.mutateAsync,
    isRefreshing: refreshMutation.isPending,
  };
}
