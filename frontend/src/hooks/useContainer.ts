import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { containersApi } from "../lib/api/containers.js";
import { useUIStore } from "../stores/ui.store.js";
import { toast } from "sonner";
import { useEffect } from "react";

export function useContainer(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const setContainerStatus = useUIStore((s) => s.setContainerStatus);
  const containerStatus = useUIStore((s) => s.containerStatus);

  const statusQuery = useQuery({
    queryKey: ["container-status", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Missing projectId");
      const res = await containersApi.status(projectId);
      return res.container;
    },
    enabled: !!projectId,
    refetchInterval: containerStatus === "starting" ? 2000 : false,
  });

  useEffect(() => {
    if (statusQuery.data?.status) {
      setContainerStatus(statusQuery.data.status);
    }
  }, [statusQuery.data?.status, setContainerStatus]);

  const startMutation = useMutation({
    mutationFn: () => {
      if (!projectId) throw new Error("Missing projectId");
      setContainerStatus("starting");
      return containersApi.start(projectId);
    },
    onSuccess: (data) => {
      setContainerStatus(data.container.status);
      queryClient.invalidateQueries({ queryKey: ["container-status", projectId] });
      toast.success("Container started successfully", {
        description: `Listening on 127.0.0.1:${data.container.hostPort}`,
      });
    },
    onError: (err: any) => {
      setContainerStatus("error");
      toast.error(err.message || "Failed to start container");
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => {
      if (!projectId) throw new Error("Missing projectId");
      return containersApi.stop(projectId);
    },
    onSuccess: (data) => {
      setContainerStatus(data.container.status);
      queryClient.invalidateQueries({ queryKey: ["container-status", projectId] });
      toast.info("Container stopped");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to stop container");
    },
  });

  const restartMutation = useMutation({
    mutationFn: () => {
      if (!projectId) throw new Error("Missing projectId");
      setContainerStatus("starting");
      return containersApi.restart(projectId);
    },
    onSuccess: (data) => {
      setContainerStatus(data.container.status);
      queryClient.invalidateQueries({ queryKey: ["container-status", projectId] });
      toast.success("Container restarted");
    },
    onError: (err: any) => {
      setContainerStatus("error");
      toast.error(err.message || "Failed to restart container");
    },
  });

  return {
    status: containerStatus,
    hostPort: statusQuery.data?.hostPort,
    containerId: statusQuery.data?.containerId,
    isLoading: statusQuery.isLoading,
    start: startMutation.mutateAsync,
    isStarting: startMutation.isPending || containerStatus === "starting",
    stop: stopMutation.mutateAsync,
    isStopping: stopMutation.isPending,
    restart: restartMutation.mutateAsync,
    isRestarting: restartMutation.isPending,
  };
}
