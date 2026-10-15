import { cn } from "../../lib/utils.js";
import type { ProjectFramework, ProjectLanguage } from "../../types/api.js";

interface FrameworkPickerProps {
  language: ProjectLanguage;
  value: ProjectFramework;
  onChange: (val: ProjectFramework) => void;
}

interface FrameworkOption {
  id: ProjectFramework;
  name: string;
  language: ProjectLanguage;
  description: string;
  openapiSupport: string;
}

const FRAMEWORKS: FrameworkOption[] = [
  // Python
  {
    id: "fastapi",
    name: "FastAPI",
    language: "python",
    description: "High-performance Python backend with automatic OpenAPI 3.1",
    openapiSupport: "/openapi.json",
  },
  {
    id: "flask",
    name: "Flask",
    language: "python",
    description: "Lightweight WSGI Python framework with Flasgger Swagger",
    openapiSupport: "/apispec.json",
  },
  {
    id: "django",
    name: "Django REST",
    language: "python",
    description: "Full-featured batteries-included framework with drf-spectacular",
    openapiSupport: "/api/schema/",
  },

  // TypeScript
  {
    id: "hono",
    name: "Hono",
    language: "typescript",
    description: "Ultrafast Bun framework equipped with @hono/zod-openapi",
    openapiSupport: "/openapi.json",
  },
  {
    id: "fastify",
    name: "Fastify",
    language: "typescript",
    description: "Low overhead Node.js/TS web framework with @fastify/swagger",
    openapiSupport: "/openapi.json",
  },

  // Node
  {
    id: "express",
    name: "Express.js",
    language: "node",
    description: "Classic minimalist web framework with swagger-jsdoc & AST fallback",
    openapiSupport: "/openapi.json",
  },
  {
    id: "nestjs",
    name: "NestJS",
    language: "node",
    description: "Progressive enterprise TypeScript framework with SwaggerModule",
    openapiSupport: "/api-json",
  },

  // Go
  {
    id: "fiber",
    name: "Fiber",
    language: "go",
    description: "Express-inspired web framework written in Go on Fasthttp",
    openapiSupport: "swaggo",
  },
  {
    id: "gin",
    name: "Gin",
    language: "go",
    description: "Martini-like API with performance up to 40 times faster",
    openapiSupport: "swaggo",
  },

  // Rust
  {
    id: "axum",
    name: "Axum",
    language: "rust",
    description: "Ergonomic and modular web framework built with Tokio and Tower",
    openapiSupport: "utoipa",
  },
];

export function FrameworkPicker({
  language,
  value,
  onChange,
}: FrameworkPickerProps) {
  const filtered = FRAMEWORKS.filter((f) => f.language === language);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {filtered.map((fw) => {
        const isSelected = value === fw.id;
        return (
          <div
            key={fw.id}
            onClick={() => onChange(fw.id)}
            className={cn(
              "flex flex-col p-3 rounded-xl border cursor-pointer transition-all text-left select-none font-sans",
              isSelected
                ? "border-primary bg-bone ring-1 ring-primary"
                : "border-hairline bg-paper hover:bg-bone"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-normal text-ink">
                {fw.name}
              </span>
              <span className="text-[10px] text-ash font-mono uppercase tracking-[0.018em]">
                {fw.openapiSupport}
              </span>
            </div>
            <span className="text-[11px] text-ash line-clamp-2 font-normal">
              {fw.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}
