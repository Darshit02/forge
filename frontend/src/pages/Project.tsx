import { useParams, Link } from "react-router-dom";
import { useProject } from "../hooks/useProject.js";
import { AppShell } from "../components/layout/AppShell.js";
import { LoadingSpinner } from "../components/common/LoadingSpinner.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { Button } from "../components/ui/button.js";
import { AlertCircle, ArrowLeft } from "lucide-react";

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { project, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-bone dark:bg-background flex items-center justify-center">
        <LoadingSpinner label="Loading workspace..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen w-screen bg-bone dark:bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-hairline bg-paper dark:bg-card p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-normal text-ink dark:text-paper">
              Workspace Not Found
            </h2>
            <p className="text-xs text-ash mt-1">
              The project you requested does not exist or you do not have permission to access it.
            </p>
          </div>
          <Button
            asChild
            className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
          >
            <Link to="/dashboard" className="gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <AppShell project={project} />;
}
