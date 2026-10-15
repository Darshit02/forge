import { useState } from "react";
import { providersApi } from "../../lib/api/providers.js";
import { Button } from "../ui/button.js";
import { Loader2, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ProviderTestButtonProps {
  providerId: string;
}

export function ProviderTestButton({ providerId }: ProviderTestButtonProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  const handleTest = async () => {
    try {
      setTesting(true);
      setResult(null);
      const res = await providersApi.test(providerId);
      setResult({
        ok: res.ok,
        latencyMs: res.latencyMs,
        error: res.error,
      });

      if (res.ok) {
        toast.success(`Provider connected successfully (${res.latencyMs}ms)`);
      } else {
        toast.error(res.error || "Provider connection failed");
      }
    } catch (err: any) {
      setResult({ ok: false, error: err.message || "Network test failed" });
      toast.error(err.message || "Failed to test provider");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={testing}
        className="rounded-[6px] border-hairline text-xs font-mono h-8 px-2.5 text-ash hover:text-ink hover:bg-bone font-normal"
      >
        {testing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
        ) : (
          <Activity className="w-3.5 h-3.5 mr-1.5" />
        )}
        Test Key
      </Button>

      {result && (
        <div
          className={`flex items-center gap-1 text-[10px] uppercase font-mono tracking-[0.018em] px-2 py-0.5 rounded-[6px] border font-normal ${
            result.ok
              ? "bg-primary text-ink border-primary"
              : "bg-bone text-destructive border-hairline"
          }`}
        >
          {result.ok ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-ink" />
              <span>{result.latencyMs}ms</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-destructive" />
              <span className="truncate max-w-[120px]">Failed</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
