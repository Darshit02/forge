import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../containers/StatusBadge.js";
import { ConfirmDialog } from "../common/ConfirmDialog.js";
import { Button } from "../ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.js";
import {
  MoreVertical,
  Trash2,
  ExternalLink,
  Code2,
  Calendar,
  Layers,
} from "lucide-react";
import type { Project } from "../../types/api.js";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(project.id);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const formattedDate = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div className="group relative flex flex-col justify-between rounded-2xl border border-hairline bg-paper dark:bg-card p-6 transition-all hover:border-ink/20 dark:hover:border-paper/30 hover:shadow-none">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-md bg-bone dark:bg-muted text-ink dark:text-paper font-medium tracking-[0.018em] border border-hairline">
                {project.framework}
              </span>
              <span className="text-[11px] text-ash font-mono uppercase">
                {project.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-ash hover:text-ink hover:bg-bone rounded-md"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl border border-hairline bg-paper dark:bg-card">
                  <DropdownMenuItem asChild>
                    <Link
                      to={`/project/${project.id}`}
                      className="cursor-pointer gap-2 text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Workspace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-hairline" />
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="cursor-pointer gap-2 text-xs text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Project Title & Description */}
          <div className="mt-4">
            <Link
              to={`/project/${project.id}`}
              className="text-lg font-normal text-ink dark:text-paper hover:underline decoration-1 underline-offset-4 line-clamp-1"
            >
              {project.name}
            </Link>
            <p className="text-xs text-ash mt-1.5 line-clamp-2 leading-relaxed">
              {project.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[11px] text-ash font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Updated {formattedDate}</span>
          </div>

          {project.hostPort ? (
            <div className="flex items-center gap-1 text-ink dark:text-paper">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>:{project.hostPort}</span>
            </div>
          ) : (
            <span className="text-ash/60">Container stopped</span>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${project.name}"?`}
        description="This will permanently delete the project, all workspace files, test collections, and container configurations. This action cannot be undone."
        confirmLabel="Delete Project"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
