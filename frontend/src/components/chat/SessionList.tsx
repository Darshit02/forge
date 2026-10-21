import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi } from "../../lib/api/ai.js";
import { useChatStore } from "../../stores/chat.store.js";
import { Plus, MessageSquare, X } from "lucide-react";
import { Button } from "../ui/button.js";
import { cn } from "../../lib/utils.js";
import { toast } from "sonner";

interface SessionListProps {
  projectId: string;
}

export function SessionList({ projectId }: SessionListProps) {
  const queryClient = useQueryClient();
  const { activeSessionId, setActiveSessionId, setMessages } = useChatStore();

  const sessionsQuery = useQuery({
    queryKey: ["chat-sessions", projectId],
    queryFn: async () => {
      const res = await aiApi.sessions(projectId);
      return res.sessions;
    },
    enabled: !!projectId,
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => aiApi.deleteSession(projectId, sessionId),
    onSuccess: (_, deletedSessionId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", projectId] });
      if (activeSessionId === deletedSessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      toast.success("Chat deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete chat session");
    },
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

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSessionMutation.mutate(sessionId);
  };

  const sessions = sessionsQuery.data || [];

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-hairline bg-bone overflow-x-auto no-scrollbar shrink-0 select-none">
      <Button
        size="xs"
        variant="ghost"
        onClick={handleNewSession}
        className="rounded-[6px] bg-paper text-ink shrink-0 gap-1 font-normal shadow-2xs hover:bg-paper/80"
      >
        <Plus className="w-3 h-3 text-ash" />
        <span>New</span>
      </Button>

      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        return (
          <div
            key={session.id}
            onClick={() => handleSelectSession(session.id)}
            className={cn(
              "group flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-[6px] text-[11px] transition-colors shrink-0 font-sans font-normal cursor-pointer select-none",
              isActive
                ? "bg-paper text-ink shadow-2xs"
                : "text-ash hover:text-ink hover:bg-paper/50"
            )}
          >
            <MessageSquare className="w-3 h-3 text-ash shrink-0" />
            <span className="truncate max-w-[110px]">{session.title}</span>
            <button
              type="button"
              onClick={(e) => handleDeleteSession(e, session.id)}
              disabled={deleteSessionMutation.isPending}
              title="Delete chat"
              className="p-0.5 rounded-[4px] text-ash/60 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
