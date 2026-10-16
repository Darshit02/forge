import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionsApi } from "../../lib/api/collections.js";
import { useTesterStore } from "../../stores/tester.store.js";
import {
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  MoreVertical,
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
import type { APIRequest, Collection } from "../../types/api.js";

interface CollectionSidebarProps {
  projectId: string;
}

export function CollectionSidebar({ projectId }: CollectionSidebarProps) {
  const queryClient = useQueryClient();
  const { loadSavedRequest, activeRequest } = useTesterStore();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newRequestModal, setNewRequestModal] = useState<{
    open: boolean;
    collectionId?: string;
  }>({ open: false });
  const [newReqName, setNewReqName] = useState("");
  const [newReqMethod, setNewReqMethod] = useState("GET");
  const [newReqPath, setNewReqPath] = useState("/");

  const collectionsQuery = useQuery({
    queryKey: ["collections", projectId],
    queryFn: async () => {
      const res = await collectionsApi.list(projectId);
      return res.collections;
    },
    enabled: !!projectId,
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: {
      collectionId: string;
      name: string;
      method: string;
      path: string;
    }) => collectionsApi.createRequest(data.collectionId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["collections", projectId] });
      loadSavedRequest(data.request);
      setNewRequestModal({ open: false });
      toast.success("Request created");
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (id: string) => collectionsApi.deleteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", projectId] });
      toast.success("Request deleted");
    },
  });

  const getMethodBadgeClass = (_method: string) => {
    return "text-ink  font-normal";
  };

  const collections = collectionsQuery.data || [];

  return (
    <div className="flex flex-col h-full border-r border-hairline bg-paper w-60 shrink-0 select-none">
      <div className="flex items-center justify-between px-3 h-9 border-b border-hairline shrink-0">
        <span className="text-[10px] uppercase tracking-[0.018em] font-normal text-ash">
          Collections
        </span>
        <Button
          size="icon-xs"
          variant="ghost"
          title="New Request"
          onClick={() => {
            const firstColl = collections[0];
            setNewRequestModal({
              open: true,
              collectionId: firstColl?.id,
            });
          }}
          className="text-ash hover:text-ink rounded-[4px]"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 no-scrollbar">
        {collections.map((coll) => {
          const isCollapsed = collapsed.has(coll.id);
          const requests = coll.requests || [];

          return (
            <div key={coll.id} className="text-xs font-sans">
              <div
                onClick={() => {
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    next.has(coll.id) ? next.delete(coll.id) : next.add(coll.id);
                    return next;
                  });
                }}
                className="flex items-center justify-between px-2 py-1.5 rounded-[6px] hover:bg-bone text-ash hover:text-ink cursor-pointer font-normal"
              >
                <div className="flex items-center gap-1.5 truncate">
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
                  <span className="truncate font-normal">{coll.name}</span>
                </div>
                <span className="text-[10px] text-ash  font-normal">
                  {requests.length}
                </span>
              </div>

              {!isCollapsed && (
                <div className="pl-4 space-y-0.5 mt-0.5">
                  {requests.map((req) => {
                    const isSelected = activeRequest.id === req.id;
                    return (
                      <div
                        key={req.id}
                        onClick={() => loadSavedRequest(req)}
                        className={cn(
                          "group flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-xs truncate font-normal",
                          isSelected
                            ? "bg-bone text-ink "
                            : "text-ash hover:bg-bone hover:text-ink"
                        )}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={cn(
                              " text-[10px] font-normal shrink-0 w-8",
                              getMethodBadgeClass(req.method)
                            )}
                          >
                            {req.method}
                          </span>
                          <span className="truncate font-normal">{req.name || req.path}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {req.autoGenerated && (
                            <span className="text-[9px] uppercase  px-1 py-0.2 rounded-[4px]  bg-bone text-ash tracking-[0.018em] font-normal">
                              auto
                            </span>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded-[4px] hover:bg-hairline text-ash">
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-28 rounded-xl  bg-paper text-xs font-sans"
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  createRequestMutation.mutate({
                                    collectionId: coll.id,
                                    name: `${req.name} (Copy)`,
                                    method: req.method,
                                    path: req.path,
                                  });
                                }}
                                className="font-normal"
                              >
                                <Copy className="w-3 h-3 mr-1.5" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive font-normal"
                                onClick={() =>
                                  deleteRequestMutation.mutate(req.id)
                                }
                              >
                                <Trash2 className="w-3 h-3 mr-1.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Request Dialog */}
      <Dialog
        open={newRequestModal.open}
        onOpenChange={(open) =>
          setNewRequestModal((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="rounded-2xl  bg-paper max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-normal text-ink">
              New API Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-ash font-normal">Request Name</Label>
              <Input
                placeholder="Get User Details"
                value={newReqName}
                onChange={(e) => setNewReqName(e.target.value)}
                className="rounded-[10px] border-hairline focus-visible:ring-primary focus-visible:ring-offset-0"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-ash font-normal">Method</Label>
                <select
                  value={newReqMethod}
                  onChange={(e) => setNewReqMethod(e.target.value)}
                  className="w-full h-9 rounded-[10px]  bg-transparent px-2 text-xs text-ink  font-normal outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-ash font-normal">Path</Label>
                <Input
                  placeholder="/users"
                  value={newReqPath}
                  onChange={(e) => setNewReqPath(e.target.value)}
                  className="rounded-[10px] border-hairline  text-xs focus-visible:ring-primary focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              disabled={
                !newReqName.trim() ||
                !newReqPath.trim() ||
                !newRequestModal.collectionId
              }
              onClick={() => {
                createRequestMutation.mutate({
                  collectionId: newRequestModal.collectionId!,
                  name: newReqName.trim(),
                  method: newReqMethod,
                  path: newReqPath.trim(),
                });
              }}
              className="rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal"
            >
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
