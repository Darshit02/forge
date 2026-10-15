import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { providersApi } from "../../lib/api/providers.js";
import { useProjects } from "../../hooks/useProject.js";
import { LanguagePicker } from "./LanguagePicker.js";
import { FrameworkPicker } from "./FrameworkPicker.js";
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
import { Plus, ArrowLeft, ArrowRight, Loader2, PlusCircle } from "lucide-react";
import type { ProjectFramework, ProjectLanguage } from "../../types/api.js";

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
}

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

  const handleLanguageChange = (lang: ProjectLanguage) => {
    setLanguage(lang);
    if (lang === "python") setFramework("fastapi");
    else if (lang === "typescript") setFramework("hono");
    else if (lang === "node") setFramework("express");
    else if (lang === "go") setFramework("fiber");
    else if (lang === "rust") setFramework("axum");
  };

  const handleSubmit = async () => {
    await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
      language,
      framework,
      aiProviderId: aiProviderId || undefined,
      source: "scratch",
    });
    setOpen(false);
    // Reset form
    setStep(1);
    setName("");
    setDescription("");
  };

  const providers = providersQuery.data || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-full bg-primary text-ink hover:bg-primary/90 font-normal gap-1.5 text-xs">
            <PlusCircle className="w-4 h-4" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl  bg-paper max-w-lg p-6 shadow-none">
        <DialogHeader>
          <div className="flex items-center justify-between text-xs text-ash mb-1">
            <span>Step {step} of 4</span>
            <span className="uppercase tracking-[0.018em] ">
              {step === 1 && "Project Details"}
              {step === 2 && "Language"}
              {step === 3 && "Framework"}
              {step === 4 && "AI Provider"}
            </span>
          </div>
          <DialogTitle className="text-xl font-normal text-ink">
            {step === 1 && "Name your backend project"}
            {step === 2 && "Choose backend language"}
            {step === 3 && "Select web framework"}
            {step === 4 && "Assign AI Provider (BYOK)"}
          </DialogTitle>
          <DialogDescription className="text-xs text-ash font-normal">
            {step === 1 && "Enter a project name and optional summary description."}
            {step === 2 && "Forge will configure runtime environment and compilers."}
            {step === 3 && "Starter templates include OpenAPI routes and hot-reloading."}
            {step === 4 && "Select which AI model writes and refactors your code."}
          </DialogDescription>
        </DialogHeader>

        {/* Step Contents */}
        <div className="py-3">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-name" className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                  Project Name *
                </Label>
                <Input
                  id="proj-name"
                  placeholder="payments-service"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-[10px] border-hairline"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-desc" className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                  Description
                </Label>
                <Input
                  id="proj-desc"
                  placeholder="REST API microservice with auth & Stripe webhook endpoints"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-[10px] border-hairline"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <LanguagePicker value={language} onChange={handleLanguageChange} />
          )}

          {step === 3 && (
            <FrameworkPicker
              language={language}
              value={framework}
              onChange={setFramework}
            />
          )}

          {step === 4 && (
            <div className="space-y-3 font-sans">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                  Default AI Key
                </Label>
                <select
                  value={aiProviderId}
                  onChange={(e) => setAiProviderId(e.target.value)}
                  className="w-full h-10 rounded-[10px]  bg-transparent px-3 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <option value="">Default (First available or system)</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.provider} — {p.modelDefault})
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary Review Card */}
              <div className="p-4 rounded-xl  bg-bone space-y-1.5 text-xs font-normal">
                <div className="flex justify-between">
                  <span className="text-ash">Project:</span>
                  <span className="text-ink font-normal">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ash">Language / Framework:</span>
                  <span className="text-ink font-normal capitalize">
                    {language} ({framework})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ash">Port Range:</span>
                  <span className=" text-ash font-normal">127.0.0.1:8001-9000</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-3 border-t border-hairline">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
              className="rounded-[6px] border-hairline text-xs font-normal"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 text-ash" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              type="button"
              size="sm"
              disabled={step === 1 && !name.trim()}
              onClick={() => setStep(step + 1)}
              className="rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal text-xs"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={isCreating}
              onClick={handleSubmit}
              className="rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal text-xs"
            >
              {isCreating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Create & Scaffold
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
