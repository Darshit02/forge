import { cn } from "../../lib/utils.js";
import type { ProjectLanguage } from "../../types/api.js";

interface LanguagePickerProps {
  value: ProjectLanguage;
  onChange: (val: ProjectLanguage) => void;
}

interface LanguageOption {
  id: ProjectLanguage;
  name: string;
  tag: string;
  description: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    id: "python",
    name: "Python",
    tag: "3.11",
    description: "FastAPI, Flask, Django REST",
  },
  {
    id: "typescript",
    name: "TypeScript",
    tag: "Bun / Node",
    description: "Hono, Fastify",
  },
  {
    id: "node",
    name: "JavaScript / Node",
    tag: "20 LTS",
    description: "Express, NestJS",
  },
  {
    id: "go",
    name: "Go (v2)",
    tag: "1.22",
    description: "Fiber, Gin",
  },
  {
    id: "rust",
    name: "Rust (v2)",
    tag: "1.78",
    description: "Axum",
  },
];

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {LANGUAGES.map((lang) => {
        const isSelected = value === lang.id;
        return (
          <div
            key={lang.id}
            onClick={() => onChange(lang.id)}
            className={cn(
              "flex flex-col p-3 rounded-xl border cursor-pointer transition-colors text-left select-none",
              isSelected
                ? "border-ink bg-bone text-ink"
                : "border-hairline bg-paper hover:border-smoke text-ink"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-normal text-ink">
                {lang.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[4px]  bg-bone text-ash  font-normal">
                {lang.tag}
              </span>
            </div>
            <span className="text-[11px] text-ash line-clamp-1 font-normal">
              {lang.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}
