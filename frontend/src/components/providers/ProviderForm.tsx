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
  {
    label: string;
    defaultModel: string;
    suggestedModels: string[];
    baseUrlRequired: boolean;
    placeholderUrl?: string;
  }
> = {
  google: {
    label: "Google Gemini",
    defaultModel: "gemini-2.0-flash",
    suggestedModels: [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
    baseUrlRequired: false,
  },
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-4o",
    suggestedModels: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1"],
    baseUrlRequired: false,
    placeholderUrl: "https://api.openai.com/v1",
  },
  anthropic: {
    label: "Anthropic",
    defaultModel: "claude-3-7-sonnet-20250219",
    suggestedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
    ],
    baseUrlRequired: false,
  },
  custom: {
    label: "Custom / OpenAI-Compatible (Ollama, Groq, DeepSeek, vLLM)",
    defaultModel: "deepseek-chat",
    suggestedModels: [
      "deepseek-chat",
      "deepseek-coder",
      "qwen2.5-coder",
      "llama3.3",
    ],
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
          <Button className="rounded-[10px] bg-primary text-ink hover:bg-primary/90 font-normal text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add AI Provider (BYOK)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl  bg-paper max-w-md p-6 shadow-none">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-xs text-ash uppercase tracking-[0.018em] mb-1  font-normal">
            <KeyRound className="w-3.5 h-3.5 text-ink" />
            <span>Bring Your Own Key</span>
          </div>
          <DialogTitle className="text-xl font-normal text-ink">
            {isEditing ? "Edit AI Provider" : "Register AI Provider"}
          </DialogTitle>
          <DialogDescription className="text-xs text-ash font-normal">
            Keys are encrypted at rest using AES-256-GCM. We never share or log your API secret.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isEditing && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                Provider Type
              </Label>
              <select
                value={provider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as AIProviderType)
                }
                className="w-full h-10 px-3 rounded-[10px]  bg-paper text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary font-normal"
              >
                <option value="google">Google Gemini (Gemini 2.5 Pro & Flash)</option>
                <option value="openai">OpenAI (GPT-4o, o3-mini, o1)</option>
                <option value="anthropic">Anthropic (Claude 3.7 Sonnet, 3.5 Sonnet)</option>
                <option value="custom">
                  Custom OpenAI-Compatible (DeepSeek, Groq, Ollama, vLLM)
                </option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
              Friendly Label
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Anthropic Key"
              required
              className="rounded-[10px] border-hairline text-xs font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                API Key
              </Label>
              {isEditing && (
                <span className="text-[11px] text-ash font-normal">
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
                className="rounded-[10px] border-hairline text-xs pr-9  font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
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
              <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                Custom Base URL {provider === "custom" ? "*" : "(Optional)"}
              </Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={
                  PROVIDER_PRESETS[provider].placeholderUrl || "https://..."
                }
                required={provider === "custom"}
                className="rounded-[10px] border-hairline text-xs  font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                Default Model
              </Label>
              <span className="text-[10px] text-ash font-normal">
                Click a preset or enter custom model
              </span>
            </div>
            <Input
              value={modelDefault}
              onChange={(e) => setModelDefault(e.target.value)}
              placeholder="e.g. gemini-2.5-pro, gpt-4o, claude-3-7-sonnet-20250219"
              required
              className="rounded-[10px] border-hairline text-xs font-mono font-normal focus-visible:ring-primary focus-visible:ring-offset-0"
            />
            {PROVIDER_PRESETS[provider]?.suggestedModels && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PROVIDER_PRESETS[provider].suggestedModels.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModelDefault(m)}
                    className={`px-2 py-0.5 rounded-[5px] text-[10px] font-mono transition-colors border ${
                      modelDefault === m
                        ? "bg-primary/20 border-primary text-ink font-medium"
                        : "bg-bone/70 border-hairline text-ash hover:text-ink hover:bg-bone"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-5 pt-3 border-t border-hairline flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-xs text-ash hover:text-ink rounded-[10px] font-normal"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || (!isEditing && !apiKey.trim())}
              className="rounded-[10px] bg-primary text-ink hover:bg-primary/90 font-normal text-xs px-4"
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
