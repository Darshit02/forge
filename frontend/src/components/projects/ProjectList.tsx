import { useState, useMemo } from "react";
import { ProjectCard } from "./ProjectCard.js";
import { CreateProjectDialog } from "./CreateProjectDialog.js";
import { ImportProjectDialog } from "./ImportProjectDialog.js";
import { EmptyState } from "../common/EmptyState.js";
import { Input } from "../ui/input.js";
import { Button } from "../ui/button.js";
import { Search, FolderGit2, Plus, Filter } from "lucide-react";
import type { Project } from "../../types/api.js";

interface ProjectListProps {
  projects: Project[];
  isLoading?: boolean;
  onDeleteProject: (id: string) => Promise<any>;
}

export function ProjectList({
  projects,
  isLoading,
  onDeleteProject,
}: ProjectListProps) {
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState<string>("all");

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.framework.toLowerCase().includes(search.toLowerCase()) ||
        p.language.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

      const matchesLang =
        filterLang === "all" || p.language.toLowerCase() === filterLang.toLowerCase();

      return matchesSearch && matchesLang;
    });
  }, [projects, search, filterLang]);

  const uniqueLanguages = useMemo(() => {
    const langs = new Set<string>();
    projects.forEach((p) => langs.add(p.language));
    return Array.from(langs);
  }, [projects]);

  if (!isLoading && projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderGit2 className="w-8 h-8" />}
        title="No backend projects yet"
        description="Create your first AI-native backend project or import an existing codebase to begin testing and generating endpoints."
        action={
          <div className="flex items-center gap-2">
            <CreateProjectDialog />
            <ImportProjectDialog />
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
          <Input
            placeholder="Search projects by name, language, or framework..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-hairline bg-paper dark:bg-card text-xs focus-visible:ring-1 focus-visible:ring-ink"
          />
        </div>

        {/* Language Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterLang("all")}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
              filterLang === "all"
                ? "bg-ink text-paper dark:bg-paper dark:text-ink font-medium"
                : "bg-paper dark:bg-card text-ash border border-hairline hover:text-ink hover:border-smoke"
            }`}
          >
            All ({projects.length})
          </button>
          {uniqueLanguages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setFilterLang(lang)}
              className={`px-3 py-1 rounded-md text-xs font-mono uppercase transition-colors ${
                filterLang === lang
                  ? "bg-ink text-paper dark:bg-paper dark:text-ink font-medium"
                  : "bg-paper dark:bg-card text-ash border border-hairline hover:text-ink hover:border-smoke"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-12 text-center">
          <p className="text-sm text-ash">No projects match your search query "{search}".</p>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setFilterLang("all");
            }}
            className="mt-3 text-xs text-ink dark:text-paper"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={onDeleteProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
