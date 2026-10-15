import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { providersApi } from "../../lib/api/providers.js";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog.js";
import { Plus, Eye, EyeOff, Loader2, KeyRound, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AIProvider, AIProviderType } from "../../types/api.js";

interface ProviderFormProps {
  initialProvider?: AIProvider;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const PROVIDER_PRESETS: Record<
  AIProviderType,
  { label: string; defaultModel: string; baseUrlRequired: boolean; placeholderUrl?: string }
> = {
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-4o",
    baseUrlRequired: false,
    placeholderUrl: "https://api.openai.com/v1",
  },
  anthropic: {
    label: "Anthropic",
    defaultModel: "claude-3-5-sonnet-20241022",
    baseUrlRequired: false,
  },
  google: {
    label: "Google Gemini",
    defaultModel: "gemini-1.5-pro-latest",
    baseUrlRequired: false,
  },
  custom: {
    label: "Custom / OpenAI-Compatible (Ollama, Groq, DeepSeek, vLLM)",
    defaultModel: "deepseek-coder",
    baseUrlRequired: true,
    placeholderUrl: "http://localhost:11434/v1 or https://api.groq.com/openai/v1",
  },
};

export function ProviderForm({
  initialProvider,
  trigger,
  onSuccess,
}: ProviderFormProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const isEditing = Boolean(initialProvider);

  const [provider, setProvider] = useState<AIProviderType>(
    initialProvider?.provider || "openai"
  );
  const [label, setLabel] = useState(initialProvider?.label || "OpenAI GPT-4o");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState(initialProvider?.baseUrl || "");
  const [modelDefault, setModelDefault] = useState(
    initialProvider?.modelDefault || PROVIDER_PRESETS.openai.defaultModel
  );

  const handleProviderChange = (newType: AIProviderType) => {
    setProvider(newType);
    const preset = PROVIDER_PRESETS[newType];
    setModelDefault(preset.defaultModel);
    if (!initialProvider) {
      setLabel(`${preset.label} Key`);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: {
      provider: string;
      label: string;
      apiKey: string;
      baseUrl?: string | null;
      modelDefault?: string;
    }) => providersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("AI Provider registered securely (AES-256-GCM encrypted)");
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create AI provider");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      label?: string;
      apiKey?: string;
      baseUrl?: string | null;
      modelDefault?: string;
    }) => {
      if (!initialProvider) throw new Error("No provider to update");
      return providersApi.update(initialProvider.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("AI Provider updated");
      setOpen(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update AI provider");
    },
  });

  const resetForm = () => {
    setProvider("openai");
    setLabel("OpenAI GPT-4o");
    setApiKey("");
    setBaseUrl("");
    setModelDefault(PROVIDER_PRESETS.openai.defaultModel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      await updateMutation.mutateAsync({
        label: label.trim(),
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || null,
        modelDefault: modelDefault.trim(),
      });
    } else {
      await createMutation.mutateAsync({
        provider,
        label: label.trim(),
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim() || null,
        modelDefault: modelDefault.trim(),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add AI Provider (BYOK)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl border border-hairline bg-paper dark:bg-card max-w-md p-6 shadow-none">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-xs text-ash uppercase tracking-[0.018em] mb-1">
            <KeyRound className="w-3.5 h-3.5 text-ink dark:text-paper" />
            <span>Bring Your Own Key</span>
          </div>
          <DialogTitle className="text-xl font-normal text-ink dark:text-paper">
            {isEditing ? "Edit AI Provider" : "Register AI Provider"}
          </DialogTitle>
          <DialogDescription className="text-xs text-ash font-normal">
            Keys are encrypted at rest using AES-256-GCM. We never share or log your API secret.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isEditing && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.018em] text-ash">
                Provider Type
              </Label>
              <select
                value={provider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as AIProviderType)
                }
                className="w-full h-10 px-3 rounded-lg border border-hairline bg-paper dark:bg-card text-xs text-ink dark:text-paper focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="openai">OpenAI (GPT-4o, o1, etc.)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="google">Google Gemini (Gemini 1.5 Pro)</option>
                <option value="custom">
                  Custom OpenAI-Compatible (Ollama, Groq, DeepSeek, vLLM)
                </option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.018em] text-ash">
              Friendly Label
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Anthropic Key"
              required
              className="rounded-lg border-hairline text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-[0.018em] text-ash">
                API Key
              </Label>
              {isEditing && (
                <span className="text-[11px] text-ash">
                  Leave blank to keep existing key
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={isEditing ? initialProvider?.maskedKey || "••••••••" : "sk-..."}
                required={!isEditing}
                className="rounded-lg border-hairline text-xs pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ash hover:text-ink"
              >
                {showKey ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {(provider === "custom" || baseUrl) && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.018em] text-ash">
                Custom Base URL {provider === "custom" ? "*" : "(Optional)"}
              </Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={
                  PROVIDER_PRESETS[provider].placeholderUrl || "https://..."
                }
                required={provider === "custom"}
                className="rounded-lg border-hairline text-xs font-mono"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.018em] text-ash">
              Default Model
            </Label>
            <Input
              value={modelDefault}
              onChange={(e) => setModelDefault(e.target.value)}
              placeholder="e.g. gpt-4o, claude-3-5-sonnet-20241022"
              required
              className="rounded-lg border-hairline text-xs font-mono"
            />
          </div>

          <DialogFooter className="mt-5 pt-3 border-t border-hairline flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-xs text-ash hover:text-ink"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || (!isEditing && !apiKey.trim())}
              className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs px-4"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {isEditing ? "Update Provider" : "Save Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
