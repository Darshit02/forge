import { useQuery } from "@tanstack/react-query";
import { aiApi } from "../../lib/api/ai.js";
import { useChatStore } from "../../stores/chat.store.js";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "../ui/button.js";
import { cn } from "../../lib/utils.js";

interface SessionListProps {
  projectId: string;
}

export function SessionList({ projectId }: SessionListProps) {
  const { activeSessionId, setActiveSessionId, setMessages } = useChatStore();

  const sessionsQuery = useQuery({
    queryKey: ["chat-sessions", projectId],
    queryFn: async () => {
      const res = await aiApi.sessions(projectId);
      return res.sessions;
    },
    enabled: !!projectId,
  });

  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const res = await aiApi.messages(projectId, sessionId);
      setMessages(res.messages);
    } catch {
      // ignore
    }
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const sessions = sessionsQuery.data || [];

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-hairline bg-bone overflow-x-auto no-scrollbar shrink-0 select-none">
      <Button
        size="xs"
        variant="ghost"
        onClick={handleNewSession}
        className="rounded-[10px]  bg-paper text-ink shrink-0 gap-1 font-normal"
      >
        <Plus className="w-3 h-3 text-ash" />
        <span>New</span>
      </Button>

      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        return (
          <button
            key={session.id}
            onClick={() => handleSelectSession(session.id)}
            className={cn(
              "flex items-center gap-1.5 h-6 px-2.5 rounded-[10px] text-[11px] truncate max-w-[130px] transition-colors shrink-0 font-sans font-normal",
              isActive
                ? "bg-paper text-ink "
                : "text-ash hover:text-ink hover:bg-paper/50"
            )}
          >
            <MessageSquare className="w-3 h-3 text-ash shrink-0" />
            <span className="truncate">{session.title}</span>
          </button>
        );
      })}
    </div>
  );
}
