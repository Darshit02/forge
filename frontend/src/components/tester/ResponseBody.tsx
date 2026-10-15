import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "../ui/button.js";

interface ResponseBodyProps {
  body: unknown;
}

export function ResponseBody({ body }: ResponseBodyProps) {
  const [copied, setCopied] = useState(false);
  const [isRaw, setIsRaw] = useState(false);

  const formattedText =
    typeof body === "object"
      ? JSON.stringify(body, null, 2)
      : String(body ?? "");

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-paper dark:bg-card">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-hairline text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRaw(false)}
            className={`px-2 py-0.5 rounded text-[11px] font-sans ${
              !isRaw
                ? "bg-bone dark:bg-muted font-medium text-ink dark:text-paper"
                : "text-ash"
            }`}
          >
            Formatted
          </button>
          <button
            onClick={() => setIsRaw(true)}
            className={`px-2 py-0.5 rounded text-[11px] font-sans ${
              isRaw
                ? "bg-bone dark:bg-muted font-medium text-ink dark:text-paper"
                : "text-ash"
            }`}
          >
            Raw
          </button>
        </div>

        <Button
          size="xs"
          variant="ghost"
          onClick={handleCopy}
          className="text-xs text-ash hover:text-ink dark:hover:text-paper h-6 px-2 gap-1"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>

      <pre className="flex-1 p-3 m-0 overflow-auto font-mono text-xs text-ink dark:text-paper select-text">
        {formattedText}
      </pre>
    </div>
  );
}
