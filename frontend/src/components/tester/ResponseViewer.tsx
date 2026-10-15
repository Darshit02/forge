import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.js";
import { ResponseBody } from "./ResponseBody.js";
import { cn, formatDuration } from "../../lib/utils.js";
import { Send, Clock } from "lucide-react";
import type { TestResponsePayload } from "../../types/api.js";

interface ResponseViewerProps {
  response: TestResponsePayload | null;
  isSending: boolean;
}

export function ResponseViewer({ response, isSending }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState("body");

  if (isSending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-ash bg-paper dark:bg-card">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-sans">Executing request against sandbox container...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-ash bg-paper dark:bg-card select-none">
        <div className="w-10 h-10 rounded-2xl border border-hairline bg-wash dark:bg-muted/40 flex items-center justify-center mb-3">
          <Send className="w-5 h-5 text-ash" />
        </div>
        <h4 className="text-sm font-normal text-ink dark:text-paper">
          Ready to Test
        </h4>
        <p className="mt-1 text-xs text-ash max-w-xs">
          Hit Send or press ⌘+Enter to execute this endpoint against the container.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900";
    }
    if (status >= 400 && status < 500) {
      return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900";
    }
    return "text-destructive bg-destructive/10 border-destructive/20";
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-paper dark:bg-card border-t border-hairline">
      {/* Response Header Status Strip */}
      <div className="h-9 px-3 border-b border-hairline bg-wash dark:bg-muted/30 flex items-center justify-between text-xs font-sans select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.018em] text-ash font-medium">
            Response
          </span>

          <span
            className={cn(
              "px-2 py-0.5 rounded-full border font-mono text-[11px] font-bold",
              getStatusColor(response.status)
            )}
          >
            {response.status}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-ash font-mono">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(response.durationMs)}</span>
        </div>
      </div>

      {/* Response Tabs (Body, Headers) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="h-8 justify-start border-b border-hairline bg-paper dark:bg-card px-2 gap-1 rounded-none">
          <TabsTrigger value="body" className="text-xs h-6 px-2 rounded font-sans">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-xs h-6 px-2 rounded font-sans">
            Headers ({Object.keys(response.headers || {}).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="flex-1 m-0 overflow-hidden">
          <ResponseBody body={response.body} />
        </TabsContent>

        <TabsContent value="headers" className="flex-1 m-0 overflow-y-auto p-3 no-scrollbar">
          <div className="space-y-1 font-mono text-xs text-ink dark:text-paper">
            {Object.entries(response.headers || {}).map(([key, value]) => (
              <div key={key} className="flex gap-2 py-0.5 border-b border-hairline/40">
                <span className="text-ash font-medium w-40 truncate">{key}:</span>
                <span className="flex-1 break-all">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
