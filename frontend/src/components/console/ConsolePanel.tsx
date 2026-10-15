import { useState, useRef, useEffect } from "react";
import { useUIStore } from "../../stores/ui.store.js";
import { LogLine } from "./LogLine.js";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import {
  Download,
  Trash2,
  ArrowDownCircle,
  Search,
  Terminal,
} from "lucide-react";
import { env } from "../../lib/env.js";

interface ConsolePanelProps {
  projectId: string;
}

export function ConsolePanel({ projectId }: ConsolePanelProps) {
  const { consoleLogs, appendConsoleLog, clearConsoleLogs } = useUIStore();
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Connect SSE logs stream for the container
  useEffect(() => {
    if (!projectId) return;

    const token = localStorage.getItem("forge_access_token") || "";
    const sseUrl = `${env.VITE_API_URL}/api/projects/${projectId}/logs?tail=200&token=${encodeURIComponent(
      token
    )}`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.addEventListener("log", (event) => {
        appendConsoleLog(event.data);
      });

      eventSource.onerror = () => {
        // SSE auto-reconnects
      };
    } catch {
      // ignore
    }

    return () => {
      eventSource?.close();
    };
  }, [projectId, appendConsoleLog]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [consoleLogs, autoScroll]);

  const filteredLogs = filter
    ? consoleLogs.filter((l) => l.toLowerCase().includes(filter.toLowerCase()))
    : consoleLogs;

  const handleDownloadLogs = () => {
    const blob = new Blob([consoleLogs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forge-container-${projectId}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-paper">
      {/* Console Toolbar */}
      <div className="h-9 px-3 border-b border-hairline flex items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3 h-3 text-ash absolute left-2 top-2" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter logs..."
              className="h-6 pl-7 text-[11px] rounded-[10px] border-hairline  font-normal"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-ash">
          <Button
            size="xs"
            variant="ghost"
            title="Auto-scroll"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`h-6 px-1.5 rounded-[6px] gap-1 font-normal ${
              autoScroll ? "text-ink bg-primary" : "text-ash hover:text-ink"
            }`}
          >
            <ArrowDownCircle className="w-3 h-3" />
            <span className="text-[10px]">Auto-scroll</span>
          </Button>

          <Button
            size="icon-xs"
            variant="ghost"
            title="Download Logs"
            onClick={handleDownloadLogs}
            disabled={consoleLogs.length === 0}
            className="text-ash hover:text-ink rounded-[4px]"
          >
            <Download className="w-3 h-3" />
          </Button>

          <Button
            size="icon-xs"
            variant="ghost"
            title="Clear Logs"
            onClick={clearConsoleLogs}
            className="text-ash hover:text-destructive rounded-[4px]"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Log Output Stream */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-2 bg-bone/30 no-scrollbar"
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map((line, idx) => <LogLine key={idx} line={line} />)
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-ash select-none">
            <Terminal className="w-6 h-6 mb-2 text-ash" />
            <p className="text-xs font-normal">No logs output from container yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
