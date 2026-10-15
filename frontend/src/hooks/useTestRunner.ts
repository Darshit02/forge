import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { testerApi } from "../lib/api/tester.js";
import { useTesterStore } from "../stores/tester.store.js";
import { analytics } from "../lib/analytics.js";
import { toast } from "sonner";

export function useTestRunner(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const {
    activeRequest,
    activeResponse,
    setActiveResponse,
    setIsSending,
    isSending,
  } = useTesterStore();

  const historyQuery = useQuery({
    queryKey: ["test-history", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await testerApi.history(projectId);
      return res.history;
    },
    enabled: !!projectId,
  });

  const runTestMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Missing projectId");

      let parsedBody: unknown = undefined;
      if (
        activeRequest.method !== "GET" &&
        activeRequest.method !== "HEAD" &&
        activeRequest.body
      ) {
        if (activeRequest.bodyType === "json") {
          try {
            parsedBody = JSON.parse(activeRequest.body);
          } catch {
            throw new Error("Invalid JSON body format");
          }
        } else {
          parsedBody = activeRequest.body;
        }
      }

      // Prepare auth headers
      const headers = { ...activeRequest.headers };
      if (activeRequest.authType === "bearer" && activeRequest.bearerToken) {
        headers["Authorization"] = `Bearer ${activeRequest.bearerToken}`;
      } else if (
        activeRequest.authType === "basic" &&
        activeRequest.basicUser
      ) {
        const credentials = btoa(
          `${activeRequest.basicUser}:${activeRequest.basicPass || ""}`
        );
        headers["Authorization"] = `Basic ${credentials}`;
      } else if (
        activeRequest.authType === "apiKey" &&
        activeRequest.apiKeyName &&
        activeRequest.apiKeyValue
      ) {
        if (activeRequest.apiKeyLocation === "header") {
          headers[activeRequest.apiKeyName] = activeRequest.apiKeyValue;
        }
      }

      setIsSending(true);

      return testerApi.run(projectId, {
        method: activeRequest.method,
        path: activeRequest.path,
        headers,
        body: parsedBody,
        requestId: activeRequest.id,
      });
    },
    onSuccess: (data) => {
      setActiveResponse(data);
      setIsSending(false);
      queryClient.invalidateQueries({ queryKey: ["test-history", projectId] });
      analytics.apiTestRun({
        method: activeRequest.method,
        path: activeRequest.path,
        status: data.status,
        duration: data.durationMs,
      });
    },
    onError: (err: any) => {
      setIsSending(false);
      toast.error(err.message || "Test execution failed");
    },
  });

  return {
    runTest: runTestMutation.mutateAsync,
    isSending: isSending || runTestMutation.isPending,
    activeRequest,
    activeResponse,
    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
  };
}
