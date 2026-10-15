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
    <div className="min-h-screen bg-bone text-ink flex flex-col">
      <TopBar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8 space-y-8">
        {/* Editorial Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-hairline">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block mb-1 font-normal">
              Workspaces & Sandboxes
            </span>
            <h1 className="text-3xl font-normal text-ink tracking-tight">
              Backend Projects
            </h1>
            <p className="text-xs text-ash mt-1 max-w-lg font-normal">
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
          <div className="rounded-2xl border border-hairline bg-paper p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash font-normal">
                Total Projects
              </span>
              <div className="text-2xl font-mono text-ink mt-0.5 font-normal">
                {projects.length}
              </div>
            </div>
            <div className="w-8 h-8 rounded-[6px] bg-bone border border-hairline flex items-center justify-center text-ash">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-paper p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash font-normal">
                Live Containers
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-mono text-ink font-normal">
                  {runningCount}
                </span>
                {runningCount > 0 && (
                  <span className="text-[10px] font-mono uppercase tracking-[0.018em] px-1.5 py-0.5 rounded-[4px] bg-primary text-ink font-normal">
                    active
                  </span>
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-[6px] bg-bone border border-hairline flex items-center justify-center text-ash">
              <Cpu className="w-4 h-4" />
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-paper p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash font-normal">
                BYOK AI Providers
              </span>
              <div className="text-2xl font-mono text-ink mt-0.5 font-normal">
                {providers.length}
              </div>
            </div>
            <div className="w-8 h-8 rounded-[6px] bg-bone border border-hairline flex items-center justify-center text-ash">
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
