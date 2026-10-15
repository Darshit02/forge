import { useProjects } from "../hooks/useProject.js";
import { useQuery } from "@tanstack/react-query";
import { providersApi } from "../lib/api/providers.js";
import { TopBar } from "../components/layout/TopBar.js";
import { ProjectList } from "../components/projects/ProjectList.js";
import { CreateProjectDialog } from "../components/projects/CreateProjectDialog.js";
import { ImportProjectDialog } from "../components/projects/ImportProjectDialog.js";
import { LoadingSpinner } from "../components/common/LoadingSpinner.js";
import { FolderGit2, Cpu, KeyRound } from "lucide-react";

export function DashboardPage() {
  const { projects, isLoading, deleteProject } = useProjects();

  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await providersApi.list();
      return res.providers;
    },
  });

  const providers = providersQuery.data || [];
  const runningCount = projects.filter((p) => p.status === "running").length;

  return (
    <div className="min-h-screen bg-bone dark:bg-background text-ink dark:text-paper flex flex-col">
      <TopBar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Editorial Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-hairline">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block mb-1">
              Workspaces & Sandboxes
            </span>
            <h1 className="text-3xl font-normal text-ink dark:text-paper tracking-tight">
              Backend Projects
            </h1>
            <p className="text-xs text-ash mt-1 max-w-lg">
              Manage live container workspaces, inspect real-time logs, and test
              REST endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <ImportProjectDialog />
            <CreateProjectDialog />
          </div>
        </div>

        {/* Telemetry Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash">
                Total Projects
              </span>
              <div className="text-2xl font-mono text-ink dark:text-paper mt-0.5">
                {projects.length}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-bone dark:bg-muted border border-hairline flex items-center justify-center text-ash">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash">
                Live Containers
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-mono text-ink dark:text-paper">
                  {runningCount}
                </span>
                {runningCount > 0 && (
                  <span className="text-xs font-mono text-emerald-600 font-medium">
                    running
                  </span>
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-bone dark:bg-muted border border-hairline flex items-center justify-center text-ash">
              <Cpu className="w-4 h-4" />
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash">
                BYOK AI Providers
              </span>
              <div className="text-2xl font-mono text-ink dark:text-paper mt-0.5">
                {providers.length}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-bone dark:bg-muted border border-hairline flex items-center justify-center text-ash">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Project List / Grid */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner label="Loading projects..." />
          </div>
        ) : (
          <ProjectList
            projects={projects}
            isLoading={isLoading}
            onDeleteProject={async (id) => {
              await deleteProject(id);
            }}
          />
        )}
      </main>
    </div>
  );
}
