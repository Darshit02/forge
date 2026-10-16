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
        action={""
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
            className="pl-9 pr-4 rounded-[10px] bg-paper text-xs text-ink focus-visible:ring-1 focus-visible:ring-primary font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
          />
        </div>

        {/* Language Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterLang("all")}
            className={`px-3 py-1 rounded-[6px] text-xs border transition-colors font-normal ${
              filterLang === "all"
                ? "bg-ink text-paper border-ink"
                : "bg-paper text-ash border-hairline hover:text-ink hover:border-smoke"
            }`}
          >
            All ({projects.length})
          </button>
          {uniqueLanguages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setFilterLang(lang)}
              className={`px-3 py-1 rounded-[6px] text-xs border uppercase tracking-[0.018em] transition-colors font-normal ${
                filterLang === lang
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ash border-hairline hover:text-ink hover:border-smoke"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-paper p-12 text-left">
          <p className="text-sm text-ash font-normal">No projects match your search query "{search}".</p>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setFilterLang("all");
            }}
            className="mt-3 text-xs text-ink rounded-[6px]"
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
