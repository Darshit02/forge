import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { providersApi } from "../../lib/api/providers.js";
import { projectsApi } from "../../lib/api/projects.js";
import { useProjects } from "../../hooks/useProject.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog.js";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.js";
import { GitBranch, Box, Loader2, DownloadCloud } from "lucide-react";
import type { ProjectFramework, ProjectLanguage } from "../../types/api.js";

interface ImportProjectDialogProps {
  trigger?: React.ReactNode;
}

export function ImportProjectDialog({ trigger }: ImportProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [importMode, setImportMode] = useState<"git" | "template">("git");

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gitUrl, setGitUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectFramework>("fastapi");
  const [language, setLanguage] = useState<ProjectLanguage>("python");
  const [framework, setFramework] = useState<ProjectFramework>("fastapi");
  const [aiProviderId, setAiProviderId] = useState<string>("");

  const { createProject, isCreating } = useProjects();

  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await providersApi.list();
      return res.providers;
    },
    enabled: open,
  });

  const templatesQuery = useQuery({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const res = await projectsApi.templates();
      return res.templates;
    },
    enabled: open,
  });

  const handleTemplateSelect = (tmpl: any) => {
    setSelectedTemplate(tmpl.id);
    setFramework(tmpl.id);
    setLanguage(tmpl.language);
    if (!name) {
      setName(`my-${tmpl.id}-api`);
    }
  };

  const handleGitUrlChange = (url: string) => {
    setGitUrl(url);
    if (!name && url) {
      // Derive name from git URL
      const parts = url.split("/");
      const last = parts[parts.length - 1]?.replace(/\.git$/, "") || "";
      if (last) setName(last);
    }
  };

  const handleSubmit = async () => {
    if (importMode === "git") {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        language,
        framework,
        aiProviderId: aiProviderId || undefined,
        source: "import",
        importSource: {
          type: "git",
          url: gitUrl.trim(),
        },
      });
    } else {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        language,
        framework: selectedTemplate,
        aiProviderId: aiProviderId || undefined,
        source: "import",
        importSource: {
          type: "template",
          templateId: selectedTemplate,
        },
      });
    }

    setOpen(false);
    setName("");
    setDescription("");
    setGitUrl("");
  };

  const templates = templatesQuery.data || [];
  const providers = providersQuery.data || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="rounded-[6px] border-hairline hover:bg-bone font-normal gap-1.5 text-xs"
          >
            <DownloadCloud className="w-4 h-4 text-ash" />
            Import Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl border border-hairline bg-paper max-w-lg p-6 shadow-none">
        <DialogHeader>
          <div className="flex items-center justify-between text-xs text-ash mb-1">
            <span className="uppercase tracking-[0.018em] font-mono">Import Workspace</span>
          </div>
          <DialogTitle className="text-xl font-normal text-ink">
            Import Backend Project
          </DialogTitle>
          <DialogDescription className="text-xs text-ash font-normal">
            Clone an existing git repository or jumpstart from a pre-configured architecture.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={importMode}
          onValueChange={(val) => setImportMode(val as "git" | "template")}
          className="mt-2"
        >
          <TabsList className="grid grid-cols-2 bg-bone rounded-[6px] p-1 border border-hairline">
            <TabsTrigger
              value="git"
              className="gap-2 rounded-[6px] data-[state=active]:bg-paper data-[state=active]:text-ink data-[state=active]:border-b-2 data-[state=active]:border-primary shadow-none text-xs font-normal"
            >
              <GitBranch className="w-3.5 h-3.5 text-ash" />
              Git Repository
            </TabsTrigger>
            <TabsTrigger
              value="template"
              className="gap-2 rounded-[6px] data-[state=active]:bg-paper data-[state=active]:text-ink data-[state=active]:border-b-2 data-[state=active]:border-primary shadow-none text-xs font-normal"
            >
              <Box className="w-3.5 h-3.5 text-ash" />
              Starter Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="git" className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                Git Repository URL
              </Label>
              <Input
                placeholder="https://github.com/owner/repository.git"
                value={gitUrl}
                onChange={(e) => handleGitUrlChange(e.target.value)}
                className="rounded-[10px] border-hairline"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                  Language
                </Label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as ProjectLanguage)}
                  className="w-full h-10 px-3 rounded-[10px] border border-hairline bg-transparent text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <option value="python">Python</option>
                  <option value="node">Node.js (JS)</option>
                  <option value="typescript">TypeScript</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                  Framework
                </Label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value as ProjectFramework)}
                  className="w-full h-10 px-3 rounded-[10px] border border-hairline bg-transparent text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <option value="fastapi">FastAPI</option>
                  <option value="flask">Flask</option>
                  <option value="django">Django</option>
                  <option value="express">Express</option>
                  <option value="hono">Hono</option>
                  <option value="nestjs">NestJS</option>
                  <option value="fastify">Fastify</option>
                  <option value="fiber">Fiber</option>
                  <option value="gin">Gin</option>
                  <option value="axum">Axum</option>
                </select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="template" className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                Choose Starter Architecture
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {templates.map((tmpl) => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleTemplateSelect(tmpl)}
                      className={`text-left p-3 rounded-xl border transition-colors ${
                        isSelected
                          ? "border-ink bg-bone text-ink"
                          : "border-hairline bg-paper hover:border-smoke text-ink"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-ink capitalize">
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded-[4px] bg-bone text-ash border border-hairline">
                          {tmpl.language}
                        </span>
                      </div>
                      <p className="text-[11px] text-ash mt-1 line-clamp-2 font-normal leading-relaxed">
                        {tmpl.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Common Project Metadata */}
        <div className="space-y-3 pt-2 border-t border-hairline">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
              Project Name
            </Label>
            <Input
              placeholder="e.g. billing-service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-[10px] border-hairline"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
              AI Provider (Optional)
            </Label>
            <select
              value={aiProviderId}
              onChange={(e) => setAiProviderId(e.target.value)}
              className="w-full h-10 px-3 rounded-[10px] border border-hairline bg-transparent text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <option value="">Default AI Provider</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.provider}) {p.isDefault ? "★ default" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t border-hairline flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="rounded-[6px] text-xs text-ash hover:text-ink font-normal"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || (importMode === "git" && !gitUrl.trim()) || isCreating}
            className="rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal text-xs px-4"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : null}
            Import Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
