import { useTesterStore } from "../../stores/tester.store.js";
import { formatDuration } from "../../lib/utils.js";
import { formatDistanceToNow } from "date-fns";
import type { TestHistoryItem } from "../../types/api.js";

interface HistoryListProps {
  history: TestHistoryItem[];
  onSelect?: (item: TestHistoryItem) => void;
}

export function HistoryList({ history }: HistoryListProps) {
  const { setActiveRequest, setActiveResponse } = useTesterStore();

  const handleSelect = (item: TestHistoryItem) => {
    setActiveRequest({
      method: item.method,
      path: item.path,
    });

    if (item.responseSnippet) {
      setActiveResponse({
        status: item.statusCode,
        headers: {},
        body: item.responseSnippet,
        durationMs: item.durationMs,
      });
    }
  };

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-ash select-none">
        No past test runs recorded.
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-600 dark:text-emerald-400";
    if (status >= 400 && status < 500) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  };

  return (
    <div className="overflow-y-auto max-h-56 p-1.5 space-y-1 no-scrollbar select-none">
      {history.map((item) => (
        <div
          key={item.id}
          onClick={() => handleSelect(item)}
          className="flex items-center justify-between p-2 rounded-md hover:bg-wash dark:hover:bg-muted/40 cursor-pointer text-xs font-sans border border-hairline/60"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono font-bold text-[10px] w-8">
              {item.method}
            </span>
            <span className="font-mono truncate">{item.path}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
            <span className={getStatusColor(item.statusCode)}>
              {item.statusCode}
            </span>
            <span className="text-ash">{formatDuration(item.durationMs)}</span>
            <span className="text-ash font-sans">
              {formatDistanceToNow(new Date(item.ranAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
