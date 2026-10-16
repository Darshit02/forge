import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../../lib/api/projects.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.js";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import { ScrollArea } from "../ui/scroll-area.js";
import {
  Folder,
  FolderOpen,
  ArrowUp,
  RotateCw,
  Home,
  Monitor,
  FileText,
  Boxes,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface FolderBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPath?: string;
  onSelect: (selectedPath: string) => void;
}

export function FolderBrowserDialog({
  open,
  onOpenChange,
  initialPath,
  onSelect,
}: FolderBrowserDialogProps) {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [pathInput, setPathInput] = useState<string>("");

  useEffect(() => {
    if (open) {
      setCurrentPath(initialPath || "");
      setPathInput(initialPath || "");
    }
  }, [open, initialPath]);

  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ["fs-directories", currentPath],
    queryFn: async () => {
      const res = await projectsApi.browseDirectories(currentPath || undefined);
      return res;
    },
    enabled: open,
  });

  // Keep input in sync when currentPath changes
  useEffect(() => {
    if (data?.currentPath) {
      setPathInput(data.currentPath);
    }
  }, [data?.currentPath]);

  const handleNavigate = (targetPath: string) => {
    setCurrentPath(targetPath);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pathInput.trim()) {
      setCurrentPath(pathInput.trim());
    }
  };

  const handleConfirm = () => {
    const finalPath = data?.currentPath || currentPath || pathInput.trim();
    if (finalPath) {
      onSelect(finalPath);
      onOpenChange(false);
    }
  };

  const homePath = data?.homePath || "";
  const forgeRoot = data?.forgeRoot || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border border-hairline bg-paper max-w-lg p-6 shadow-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-ink flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-ink" />
            Select Destination Folder
          </DialogTitle>
          <DialogDescription className="text-xs text-ash font-normal">
            Choose any folder on your machine where Forge will create your project files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-[0.018em] text-ash mr-1 font-medium">
              Quick:
            </span>
            {homePath && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(homePath)}
                className="h-6 px-2 text-[11px] rounded-[6px] border-hairline gap-1 font-normal text-ash hover:text-ink"
              >
                <Home className="w-3 h-3" />
                Home
              </Button>
            )}
            {homePath && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(`${homePath}/Desktop`)}
                className="h-6 px-2 text-[11px] rounded-[6px] border-hairline gap-1 font-normal text-ash hover:text-ink"
              >
                <Monitor className="w-3 h-3" />
                Desktop
              </Button>
            )}
            {homePath && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(`${homePath}/Documents`)}
                className="h-6 px-2 text-[11px] rounded-[6px] border-hairline gap-1 font-normal text-ash hover:text-ink"
              >
                <FileText className="w-3 h-3" />
                Documents
              </Button>
            )}
            {forgeRoot && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(forgeRoot)}
                className="h-6 px-2 text-[11px] rounded-[6px] border-hairline gap-1 font-normal text-ash hover:text-ink"
              >
                <Boxes className="w-3 h-3" />
                Forge Root
              </Button>
            )}
          </div>

          {/* Current Path Bar */}
          <form onSubmit={handleInputSubmit} className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!data?.parentPath}
              onClick={() => data?.parentPath && handleNavigate(data.parentPath)}
              title="Go to parent directory"
              className="h-8 w-8 p-0 shrink-0 rounded-[6px] border-hairline text-ash hover:text-ink"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>

            <Input
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="/Users/.../your-folder"
              className="h-8 text-xs font-mono rounded-[8px] border-hairline bg-bone/30 text-ink focus-visible:ring-primary focus-visible:ring-offset-0"
            />

            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs rounded-[6px] border-hairline text-ash hover:text-ink shrink-0 font-normal"
            >
              Go
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 w-8 p-0 rounded-[6px] border-hairline text-ash hover:text-ink shrink-0"
            >
              <RotateCw className="w-3 h-3" />
            </Button>
          </form>

          {/* Directory Listing */}
          <div className="rounded-xl border border-hairline bg-paper overflow-hidden">
            <ScrollArea className="h-56 p-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 text-ash gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-ink" />
                  <span className="text-xs">Loading directories...</span>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-48 text-destructive gap-2 p-4 text-center">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-xs">Permission denied or directory cannot be read.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigate(data?.forgeRoot || "")}
                    className="h-7 text-xs rounded-[6px] border-hairline text-ink mt-1"
                  >
                    Go to Forge Root
                  </Button>
                </div>
              ) : data?.directories && data.directories.length > 0 ? (
                <div className="space-y-0.5">
                  {data.directories.map((dir) => (
                    <button
                      key={dir.path}
                      type="button"
                      onClick={() => handleNavigate(dir.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] hover:bg-bone transition-colors text-left text-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className="w-4 h-4 text-ash group-hover:text-ink shrink-0" />
                        <span className="truncate text-ink font-normal">{dir.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-ash/40 group-hover:text-ash shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-ash text-center p-4">
                  <Folder className="w-6 h-6 text-ash/40 mb-1" />
                  <p className="text-xs font-normal">No subdirectories in this folder.</p>
                  <p className="text-[11px] text-ash/60 mt-0.5">
                    You can select this directory directly below.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Active selection banner */}
          <div className="rounded-[8px] bg-bone/70 px-3 py-2 text-xs flex items-center justify-between border border-hairline/60">
            <div className="min-w-0 flex-1 mr-2">
              <span className="text-[10px] uppercase tracking-[0.018em] text-ash block">
                Target Folder:
              </span>
              <span className="font-mono text-[11px] text-ink truncate block">
                {data?.currentPath || currentPath || "Select a folder"}
              </span>
            </div>
            {data?.canWrite === false && (
              <span className="text-[10px] text-destructive shrink-0">
                Read-only folder
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-3 border-t border-hairline">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-[6px] border-hairline text-xs font-normal"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={!data?.currentPath || data?.canWrite === false}
            className="rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal text-xs gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Select This Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
