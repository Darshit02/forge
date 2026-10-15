import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filesApi } from "../../lib/api/files.js";
import { useEditorStore } from "../../stores/editor.store.js";
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileText,
  FileJson,
  FilePlus,
  FolderPlus,
  Upload,
  Trash2,
  MoreVertical,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.js";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";
import { toast } from "sonner";
import type { FileTreeNode } from "../../types/api.js";

interface FileTreeProps {
  projectId: string;
}

export function FileTree({ projectId }: FileTreeProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());

  // Dialog state for new file/folder
  const [createModal, setCreateModal] = useState<{
    open: boolean;
    type: "file" | "folder";
    parentPath: string;
  }>({ open: false, type: "file", parentPath: "" });
  const [newEntityName, setNewEntityName] = useState("");

  const { openFiles, openFile, activeFile } = useEditorStore();

  const filesQuery = useQuery({
    queryKey: ["files", projectId],
    queryFn: async () => {
      const res = await filesApi.tree(projectId);
      return res.tree;
    },
    enabled: !!projectId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => filesApi.upload(projectId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] });
      toast.success(`Uploaded & extracted ${data.extractedFiles} file(s)`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload file");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (path: string) => filesApi.delete(projectId, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] });
      toast.success("File deleted");
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ path, type }: { path: string; type: "file" | "folder" }) => {
      if (type === "file") {
        return filesApi.write(projectId, path, "");
      } else {
        // create empty file inside folder to establish directory
        return filesApi.write(projectId, `${path}/.keep`, "");
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] });
      setCreateModal({ open: false, type: "file", parentPath: "" });
      setNewEntityName("");
      toast.success(`${vars.type === "file" ? "File" : "Folder"} created`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create");
    },
  });

  const toggleCollapse = (path: string) => {
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleOpenFile = async (node: FileTreeNode) => {
    if (node.type === "directory") {
      toggleCollapse(node.path);
      return;
    }

    // Check if already open
    const openItem = openFiles.find((f) => f.path === node.path);
    if (openItem) {
      useEditorStore.getState().setActiveFile(node.path);
      return;
    }

    // Read content from backend
    try {
      const res = await filesApi.read(projectId, node.path);
      openFile(node.path, res.file.content);
    } catch (err: any) {
      toast.error(err.message || "Failed to open file");
    }
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = "";
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "py":
      case "ts":
      case "js":
      case "jsx":
      case "tsx":
      case "go":
      case "rs":
        return <FileCode2 className="w-3.5 h-3.5 text-ash shrink-0" />;
      case "json":
        return <FileJson className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-ash shrink-0" />;
    }
  };

  const renderTree = (nodes: FileTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isDir = node.type === "directory";
      const isCollapsed = collapsedPaths.has(node.path);
      const isActive = activeFile === node.path;

      return (
        <div key={node.path} className="text-xs font-sans">
          <div
            onClick={() => handleOpenFile(node)}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            className={cn(
              "group flex items-center justify-between h-7 pr-2 cursor-pointer rounded-[6px] transition-colors select-none font-normal",
              isActive
                ? "bg-bone text-ink"
                : "text-ash hover:bg-bone hover:text-ink"
            )}
          >
            <div className="flex items-center gap-1.5 truncate">
              {isDir ? (
                <>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 text-ash shrink-0" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-ash shrink-0" />
                  )}
                  {isCollapsed ? (
                    <Folder className="w-3.5 h-3.5 text-ash shrink-0" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5 text-ash shrink-0" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3" />
                  {getFileIcon(node.name)}
                </>
              )}
              <span className="truncate">{node.name}</span>
            </div>

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded-[4px] hover:bg-hairline text-ash">
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-32 rounded-xl  bg-paper text-xs font-sans"
              >
                {isDir && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        setCreateModal({
                          open: true,
                          type: "file",
                          parentPath: node.path,
                        })
                      }
                    >
                      <FilePlus className="w-3 h-3 mr-2" />
                      New File
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setCreateModal({
                          open: true,
                          type: "folder",
                          parentPath: node.path,
                        })
                      }
                    >
                      <FolderPlus className="w-3 h-3 mr-2" />
                      New Folder
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => deleteMutation.mutate(node.path)}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isDir && !isCollapsed && node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-paper border-r border-hairline select-none">
      {/* File Tree Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-hairline shrink-0">
        <span className="text-[10px] uppercase tracking-[0.018em] font-normal text-ash">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            title="New File"
            onClick={() =>
              setCreateModal({ open: true, type: "file", parentPath: "" })
            }
            className="text-ash hover:text-ink rounded-[4px]"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="icon-xs"
            variant="ghost"
            title="New Folder"
            onClick={() =>
              setCreateModal({ open: true, type: "folder", parentPath: "" })
            }
            className="text-ash hover:text-ink rounded-[4px]"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="icon-xs"
            variant="ghost"
            title="Upload Zip or File"
            onClick={() => fileInputRef.current?.click()}
            className="text-ash hover:text-ink rounded-[4px]"
          >
            <Upload className="w-3.5 h-3.5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUploadChange}
          />
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-1.5 no-scrollbar">
        {filesQuery.isLoading ? (
          <div className="p-3 text-xs text-ash font-normal">Loading files...</div>
        ) : filesQuery.data && filesQuery.data.length > 0 ? (
          renderTree(filesQuery.data)
        ) : (
          <div className="p-4 text-left text-xs text-ash font-normal">
            No files in workspace yet. Ask AI to create some!
          </div>
        )}
      </div>

      {/* Create File / Folder Dialog */}
      <Dialog
        open={createModal.open}
        onOpenChange={(open) =>
          setCreateModal((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="rounded-2xl  bg-paper max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-normal text-ink">
              Create New {createModal.type === "file" ? "File" : "Folder"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs text-ash font-normal">
              {createModal.parentPath
                ? `Inside: ${createModal.parentPath}/`
                : "Inside workspace root"}
            </Label>
            <Input
              autoFocus
              value={newEntityName}
              placeholder={
                createModal.type === "file" ? "server.py" : "services"
              }
              onChange={(e) => setNewEntityName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newEntityName.trim()) {
                  const fullPath = createModal.parentPath
                    ? `${createModal.parentPath}/${newEntityName.trim()}`
                    : newEntityName.trim();
                  createMutation.mutate({
                    path: fullPath,
                    type: createModal.type,
                  });
                }
              }}
              className="rounded-[10px] border-hairline"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCreateModal({ open: false, type: "file", parentPath: "" })
              }
              className="rounded-[6px] border-hairline font-normal"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newEntityName.trim() || createMutation.isPending}
              onClick={() => {
                const fullPath = createModal.parentPath
                  ? `${createModal.parentPath}/${newEntityName.trim()}`
                  : newEntityName.trim();
                createMutation.mutate({
                  path: fullPath,
                  type: createModal.type,
                });
              }}
              className="rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
