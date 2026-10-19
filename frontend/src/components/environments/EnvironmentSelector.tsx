import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionsApi } from "../../lib/api/collections.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.js";
import { Layers } from "lucide-react";
import { toast } from "sonner";

interface EnvironmentSelectorProps {
  projectId: string;
}

export function EnvironmentSelector({ projectId }: EnvironmentSelectorProps) {
  const queryClient = useQueryClient();

  const envsQuery = useQuery({
    queryKey: ["environments", projectId],
    queryFn: async () => {
      const res = await collectionsApi.listEnvironments(projectId);
      return res.environments;
    },
    enabled: !!projectId,
  });

  const activateMutation = useMutation({
    mutationFn: (envId: string) =>
      collectionsApi.updateEnvironment(envId, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["environments", projectId] });
      toast.success("Environment switched");
    },
  });

  const environments = envsQuery.data || [];
  const activeEnv = environments.find((e) => e.isActive);

  if (environments.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-ash px-2 py-1 rounded-[10px]  font-normal">
        <Layers className="w-3.5 h-3.5 text-ash" />
        <span>No Env</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={activeEnv?.id || "none"}
        onValueChange={(val) => {
          if (val !== "none") activateMutation.mutate(val);
        }}
      >
        <SelectTrigger className="h-7 text-xs border-hairline rounded-[10px] bg-paper px-2 gap-1.5 text-ink font-sans font-normal">
          <Layers className="w-3.5 h-3.5 text-ash" />
          <SelectValue placeholder="Select Env" />
        </SelectTrigger>
        <SelectContent className="rounded-xl  bg-paper">
          {environments.map((env) => (
            <SelectItem key={env.id} value={env.id} className="text-xs font-sans">
              {env.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
