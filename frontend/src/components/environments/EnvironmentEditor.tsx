import { useState, useEffect } from "react";
import { useEnvironments } from "../../hooks/useEnvironments.js";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog.js";
import { ConfirmDialog } from "../common/ConfirmDialog.js";
import { LoadingSpinner } from "../common/LoadingSpinner.js";
import {
  Plus,
  Trash2,
  Check,
  Code2,
  FileText,
  Key,
  Layers,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Environment } from "../../types/api.js";

interface EnvironmentEditorProps {
  projectId: string;
}

export function EnvironmentEditor({ projectId }: EnvironmentEditorProps) {
  const {
    environments,
    isLoading,
    createEnvironment,
    isCreating,
    updateEnvironment,
    isUpdating,
    deleteEnvironment,
    isDeleting,
  } = useEnvironments(projectId);

  const [selectedEnvId, setSelectedEnvId] = useState<string>("");
  const [newEnvDialogOpen, setNewEnvDialogOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Environment | null>(null);

  // Key-value pairs for the currently selected environment
  const [vars, setVars] = useState<Array<{ key: string; value: string }>>([]);
  const [rawTextMode, setRawTextMode] = useState(false);
  const [rawText, setRawText] = useState("");

  const activeEnv = environments.find((e) => e.id === selectedEnvId) || environments[0];

  useEffect(() => {
    if (activeEnv) {
      setSelectedEnvId(activeEnv.id);
      const entries = Object.entries(activeEnv.variables || {}).map(([key, value]) => ({
        key,
        value,
      }));
      setVars(entries);
      setRawText(entries.map((e) => `${e.key}=${e.value}`).join("\n"));
    }
  }, [activeEnv?.id]);

  const handleAddRow = () => {
    setVars([...vars, { key: "", value: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    setVars(vars.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (
    index: number,
    field: "key" | "value",
    val: string
  ) => {
    const next = [...vars];
    next[index][field] = val;
    setVars(next);
  };

  const handleRawTextChange = (text: string) => {
    setRawText(text);
    // Parse key-value lines
    const parsed: Array<{ key: string; value: string }> = [];
    text.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        parsed.push({
          key: trimmed.slice(0, eqIdx).trim(),
          value: trimmed.slice(eqIdx + 1).trim(),
        });
      }
    });
    setVars(parsed);
  };

  const handleSave = async () => {
    if (!activeEnv) return;

    // Convert array to Record
    const variablesObj: Record<string, string> = {};
    vars.forEach((item) => {
      if (item.key.trim()) {
        variablesObj[item.key.trim()] = item.value;
      }
    });

    await updateEnvironment({
      id: activeEnv.id,
      data: {
        variables: variablesObj,
      },
    });
  };

  const handleCreateNew = async () => {
    if (!newEnvName.trim()) return;
    const res = await createEnvironment({
      name: newEnvName.trim(),
      variables: {},
      isActive: environments.length === 0,
    });
    setNewEnvName("");
    setNewEnvDialogOpen(false);
    if (res.environment) {
      setSelectedEnvId(res.environment.id);
    }
  };

  const handleSetActive = async (env: Environment) => {
    await updateEnvironment({
      id: env.id,
      data: { isActive: true },
    });
  };

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner label="Loading environments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Env Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-normal text-ink dark:text-paper">
            Environment Variables
          </h3>
          <p className="text-xs text-ash mt-0.5">
            Variables are substituted into your HTTP request builder and runner as{" "}
            <code className="text-ink dark:text-paper bg-bone dark:bg-muted px-1 py-0.5 rounded font-mono">
              {"{{VAR_NAME}}"}
            </code>
          </p>
        </div>

        <Dialog open={newEnvDialogOpen} onOpenChange={setNewEnvDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-md border-hairline text-xs font-mono gap-1.5 h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              New Environment
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border border-hairline bg-paper dark:bg-card max-w-sm p-5 shadow-none">
            <DialogHeader>
              <DialogTitle className="text-base font-normal text-ink dark:text-paper">
                Create Environment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 pt-2">
              <Label className="text-xs uppercase tracking-[0.018em] text-ash">
                Environment Name
              </Label>
              <Input
                placeholder="e.g. Staging, Production, Local"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                className="rounded-lg border-hairline text-xs"
              />
            </div>
            <DialogFooter className="mt-4 pt-3 border-t border-hairline">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewEnvDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateNew}
                disabled={!newEnvName.trim() || isCreating}
                className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Environment Selector Tabs */}
      {environments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline p-8 text-center bg-paper dark:bg-card">
          <p className="text-xs text-ash">
            No environments created yet for this project.
          </p>
          <Button
            size="sm"
            onClick={() => setNewEnvDialogOpen(true)}
            className="mt-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
          >
            Create Default Environment
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {environments.map((env) => {
              const isSelected = env.id === selectedEnvId;
              return (
                <div
                  key={env.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                    isSelected
                      ? "border-ink bg-bone dark:border-paper dark:bg-muted text-ink dark:text-paper"
                      : "border-hairline bg-paper dark:bg-card text-ash hover:border-smoke"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedEnvId(env.id)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <span>{env.name}</span>
                    {env.isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>

                  {!env.isActive && isSelected && (
                    <button
                      type="button"
                      onClick={() => handleSetActive(env)}
                      title="Set as Active"
                      className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-paper dark:bg-card hover:bg-ink hover:text-paper border border-hairline ml-1"
                    >
                      Activate
                    </button>
                  )}

                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(env)}
                      className="text-ash hover:text-red-600 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Env Editor Card */}
          {activeEnv && (
            <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-ink dark:text-paper font-mono">
                    {activeEnv.name}
                  </span>
                  {activeEnv.isActive ? (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      Active Environment
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetActive(activeEnv)}
                      className="text-[11px] h-6 px-2 text-ash hover:text-ink"
                    >
                      Set as active
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRawTextMode(!rawTextMode)}
                    className="text-xs text-ash hover:text-ink h-7 gap-1"
                  >
                    {rawTextMode ? (
                      <>
                        <Layers className="w-3.5 h-3.5" /> Key-Value Mode
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" /> .env Mode
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 px-3 gap-1.5"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Save Variables
                  </Button>
                </div>
              </div>

              {rawTextMode ? (
                <div className="space-y-1">
                  <Label className="text-xs text-ash">
                    Paste raw .env key=value pairs (one per line):
                  </Label>
                  <textarea
                    value={rawText}
                    onChange={(e) => handleRawTextChange(e.target.value)}
                    rows={8}
                    placeholder="API_URL=http://localhost:3000&#10;TOKEN=ey..."
                    className="w-full rounded-xl border border-hairline bg-bone/30 dark:bg-muted/20 p-3 font-mono text-xs text-ink dark:text-paper focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] uppercase tracking-[0.018em] text-ash font-mono px-1">
                    <div className="col-span-5">Variable Key</div>
                    <div className="col-span-6">Value</div>
                    <div className="col-span-1 text-center"></div>
                  </div>

                  {vars.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="e.g. BASE_URL"
                          value={row.key}
                          onChange={(e) =>
                            handleUpdateRow(idx, "key", e.target.value)
                          }
                          className="h-8 text-xs font-mono rounded-lg border-hairline"
                        />
                      </div>
                      <div className="col-span-6">
                        <Input
                          placeholder="value"
                          value={row.value}
                          onChange={(e) =>
                            handleUpdateRow(idx, "value", e.target.value)
                          }
                          className="h-8 text-xs font-mono rounded-lg border-hairline"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(idx)}
                          className="h-7 w-7 text-ash hover:text-red-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddRow}
                    className="text-xs text-ash hover:text-ink gap-1.5 h-8 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Variable
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="Are you sure you want to delete this environment configuration? Any tests relying on its variables will fall back to empty values."
        confirmLabel="Delete Environment"
        destructive
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteEnvironment(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
