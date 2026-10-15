import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providersApi } from "../../lib/api/providers.js";
import { ProviderForm } from "./ProviderForm.js";
import { ProviderTestButton } from "./ProviderTestButton.js";
import { ConfirmDialog } from "../common/ConfirmDialog.js";
import { LoadingSpinner } from "../common/LoadingSpinner.js";
import { EmptyState } from "../common/EmptyState.js";
import { Button } from "../ui/button.js";
import {
  KeyRound,
  Trash2,
  Edit2,
  Check,
  Star,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { AIProvider } from "../../types/api.js";

export function ProviderList() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<AIProvider | null>(null);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await providersApi.list();
      return res.providers;
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => providersApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Default AI provider updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to set default provider");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => providersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("AI Provider deleted");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete provider");
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner label="Loading AI providers..." />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <EmptyState
        icon={<KeyRound className="w-8 h-8" />}
        title="No AI Provider keys configured"
        description="Forge is BYOK (Bring Your Own Key). Add your OpenAI, Anthropic, Google, or custom endpoint key to enable AI-powered code writing and debugging."
        action={<ProviderForm />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-normal text-ink">
            Registered AI Providers
          </h3>
          <p className="text-xs text-ash mt-0.5 font-normal">
            Keys are encrypted at rest with AES-256-GCM. Used for agentic code generation in your workspaces.
          </p>
        </div>
        <ProviderForm />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {providers.map((p) => {
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 bg-paper transition-colors ${
                p.isDefault
                  ? "border-ink ring-1 ring-ink/20"
                  : "border-hairline hover:border-smoke"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Provider Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-[6px] bg-bone font-normal text-ink border border-hairline tracking-[0.018em]">
                      {p.provider}
                    </span>
                    <span className="text-sm font-normal text-ink">
                      {p.label}
                    </span>
                    {p.isDefault && (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-[0.018em] px-1.5 py-0.5 rounded-[4px] bg-primary text-ink font-normal">
                        <Star className="w-3 h-3 fill-current" />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-ash font-normal">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-ink" />
                      <span>{p.maskedKey}</span>
                    </div>

                    <div>
                      <span>Model: </span>
                      <span className="text-ink font-normal">
                        {p.modelDefault}
                      </span>
                    </div>

                    {p.baseUrl && (
                      <div className="text-[11px] text-ash truncate max-w-xs font-normal">
                        Endpoint: {p.baseUrl}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start md:self-center">
                  <ProviderTestButton providerId={p.id} />

                  {!p.isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(p.id)}
                      disabled={setDefaultMutation.isPending}
                      className="text-xs h-8 text-ash hover:text-ink rounded-[6px] font-normal"
                    >
                      Make Default
                    </Button>
                  )}

                  <ProviderForm
                    initialProvider={p}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-ash hover:text-ink rounded-[6px]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(p)}
                    className="h-8 w-8 text-ash hover:text-red-600 rounded-[6px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.label}"?`}
        description="Are you sure you want to remove this AI provider? Projects configured to use this provider will fall back to your default provider or require re-configuration."
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </div>
  );
}
