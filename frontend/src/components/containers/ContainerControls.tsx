import { Play, Square, RotateCw, Loader2 } from "lucide-react";
import { Button } from "../ui/button.js";
import { StatusBadge } from "./StatusBadge.js";
import { useContainer } from "../../hooks/useContainer.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip.js";

interface ContainerControlsProps {
  projectId: string;
}

export function ContainerControls({ projectId }: ContainerControlsProps) {
  const {
    status,
    hostPort,
    start,
    stop,
    restart,
    isStarting,
    isStopping,
    isRestarting,
  } = useContainer(projectId);

  const isRunning = status === "running";
  const isBusy = isStarting || isStopping || isRestarting;

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} port={hostPort} />

      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1  rounded-[6px] p-0.5 bg-paper">
          {!isRunning ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  disabled={isBusy}
                  onClick={() => start()}
                  className="bg-primary text-ink hover:bg-primary/90 rounded-[4px]"
                >
                  {isStarting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-obsidian text-paper rounded-xl font-normal">
                Start Container
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled={isBusy}
                  onClick={() => stop()}
                  className="hover:bg-bone hover:text-destructive rounded-[4px]"
                >
                  {isStopping ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Square className="w-3 h-3 fill-current" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-obsidian text-paper rounded-xl font-normal">
                Stop Container
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                disabled={isBusy || !isRunning}
                onClick={() => restart()}
                className="hover:bg-bone text-ash hover:text-ink rounded-[4px]"
              >
                {isRestarting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCw className="w-3 h-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs bg-obsidian text-paper rounded-xl font-normal">
              Restart Container
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
