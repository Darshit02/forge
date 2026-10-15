import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../lib/api/projects.js";
import { analytics } from "../lib/analytics.js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useProjects() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await projectsApi.list();
      return res.projects;
    },
  });

  const templatesQuery = useQuery({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const res = await projectsApi.templates();
      return res.templates;
    },
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      analytics.projectCreated({
        language: data.project.language,
        framework: data.project.framework,
        source: "scratch",
      });
      toast.success(`Project "${data.project.name}" created`);
      navigate(`/projects/${data.project.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create project");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete project");
    },
  });

  return {
    projects: projectsQuery.data || [],
    isLoading: projectsQuery.isLoading,
    templates: templatesQuery.data || [],
    createProject: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteProject: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useProject(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Missing projectId");
      const res = await projectsApi.get(projectId);
      return res.project;
    },
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string | null }) => {
      if (!projectId) throw new Error("Missing projectId");
      return projectsApi.update(projectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
    },
  });

  return {
    project: projectQuery.data,
    isLoading: projectQuery.isLoading,
    updateProject: updateMutation.mutateAsync,
  };
}
