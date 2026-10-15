import { Link } from "react-router-dom";
import { Button } from "../components/ui/button.js";
import { ThemeToggle } from "../components/layout/ThemeToggle.js";
import {
  ArrowRight,
  Terminal,
  Cpu,
  Layers,
  Zap,
  Shield,
  Code2,
  Box,
  Send,
  Sparkles,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bone dark:bg-background text-ink dark:text-paper selection:bg-primary selection:text-primary-foreground">
      {/* Editorial Navigation */}
      <nav className="border-b border-hairline bg-paper/80 dark:bg-card/80 backdrop-blur sticky top-0 z-50 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center font-bold text-ink text-xs leading-none">
              F
            </div>
            <span className="font-normal tracking-tight text-base text-ink dark:text-paper">
              Forge
            </span>
          </Link>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-bone dark:bg-muted text-ash border border-hairline ml-2 hidden sm:inline-block">
            AI-Native Backend IDE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            to="/login"
            className="text-xs text-ash hover:text-ink dark:hover:text-paper transition-colors font-medium"
          >
            Sign In
          </Link>
          <Button
            asChild
            className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs px-3.5 h-8 gap-1.5"
          >
            <Link to="/register">
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline bg-paper dark:bg-card text-[11px] font-mono uppercase tracking-[0.018em] text-ash mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>EDITORIAL BACKEND WORKSPACE // BYOK AI ENGINE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-[-0.03em] leading-[1.05] text-ink dark:text-paper max-w-4xl mx-auto">
          Write, run, and test backend APIs without leaving the browser.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-ash max-w-2xl mx-auto font-normal leading-relaxed">
          Forge is an AI-native backend IDE. Scaffold frameworks in Python, Node,
          Go, and Rust, stream agentic code edits, execute containers in real-time,
          and test endpoints in an integrated API suite.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm h-11 px-6 gap-2"
          >
            <Link to="/register">
              Start Building Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto rounded-md border-hairline hover:bg-paper dark:hover:bg-muted text-sm h-11 px-6 font-medium"
          >
            <Link to="/login">Sign In with Existing Account</Link>
          </Button>
        </div>

        {/* Live Counters / Telemetry Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="rounded-xl border border-hairline bg-paper dark:bg-card p-4 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block">
              Container Startup
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono text-ink dark:text-paper font-normal">
                &lt; 450
              </span>
              <span className="text-xs text-primary font-mono font-medium">ms</span>
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-paper dark:bg-card p-4 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block">
              Supported Stacks
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono text-ink dark:text-paper font-normal">
                10+
              </span>
              <span className="text-xs text-ash font-mono">frameworks</span>
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-paper dark:bg-card p-4 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block">
              Key Encryption
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono text-ink dark:text-paper font-normal">
                AES-256
              </span>
              <span className="text-xs text-emerald-600 font-mono font-medium">GCM</span>
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-paper dark:bg-card p-4 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block">
              Spec Reflection
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono text-ink dark:text-paper font-normal">
                Instant
              </span>
              <span className="text-xs text-primary font-mono font-medium">auto</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Grid */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-left mb-10">
          <span className="text-[11px] uppercase font-mono tracking-[0.018em] text-ash block mb-1">
            Core Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-normal text-ink dark:text-paper">
            Everything your backend workflow needs. Single pane of glass.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1 */}
          <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-bone dark:bg-muted border border-hairline flex items-center justify-center text-ink dark:text-paper mb-4">
                <Sparkles className="w-4 h-4 text-ink dark:text-paper" />
              </div>
              <h3 className="text-lg font-normal text-ink dark:text-paper">
                BYOK Multi-Provider AI
              </h3>
              <p className="text-xs text-ash mt-2 leading-relaxed">
                Connect your OpenAI, Anthropic, Google Gemini, or custom OpenAI-compatible
                endpoint (Ollama, vLLM, Groq). All keys are encrypted at rest with AES-256-GCM.
                Zero subscription markup.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-2 text-[11px] font-mono text-ash">
              <span className="text-primary font-bold">●</span>
              <span>Direct streaming via Vercel AI SDK</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-bone dark:bg-muted border border-hairline flex items-center justify-center text-ink dark:text-paper mb-4">
                <Box className="w-4 h-4 text-ink dark:text-paper" />
              </div>
              <h3 className="text-lg font-normal text-ink dark:text-paper">
                Live Isolated Docker Sandboxes
              </h3>
              <p className="text-xs text-ash mt-2 leading-relaxed">
                Every project spins up a dedicated container bound to your filesystem.
                Hot reload on code change, dedicated host port allocation, and live stdout/stderr
                log streaming via WebSockets.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-2 text-[11px] font-mono text-ash">
              <span className="text-primary font-bold">●</span>
              <span>Automatic resource bounds & lifecycle hooks</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-bone dark:bg-muted border border-hairline flex items-center justify-center text-ink dark:text-paper mb-4">
                <Send className="w-4 h-4 text-ink dark:text-paper" />
              </div>
              <h3 className="text-lg font-normal text-ink dark:text-paper">
                Built-in API Tester (No Postman)
              </h3>
              <p className="text-xs text-ash mt-2 leading-relaxed">
                Send HTTP requests straight to your running container. Support for headers,
                query params, raw JSON/form bodies, Bearer/Basic auth, and environment variable
                interpolation like <code className="text-ink dark:text-paper font-mono">{"{{API_KEY}}"}</code>.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-2 text-[11px] font-mono text-ash">
              <span className="text-primary font-bold">●</span>
              <span>Sub-millisecond internal proxy execution</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-bone dark:bg-muted border border-hairline flex items-center justify-center text-ink dark:text-paper mb-4">
                <Layers className="w-4 h-4 text-ink dark:text-paper" />
              </div>
              <h3 className="text-lg font-normal text-ink dark:text-paper">
                Auto OpenAPI Reflection
              </h3>
              <p className="text-xs text-ash mt-2 leading-relaxed">
                Forge inspects your application as it boots. FastAPI swagger docs, Express routes,
                and Hono endpoint schemas are parsed and synced automatically to your API collections.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-2 text-[11px] font-mono text-ash">
              <span className="text-primary font-bold">●</span>
              <span>Instant sync over native WebSockets</span>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Colophon / Footer */}
      <footer className="border-t border-hairline bg-paper dark:bg-card py-10 px-6 mt-16 text-xs text-ash">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-primary flex items-center justify-center font-bold text-ink text-[10px]">
              F
            </div>
            <span className="text-ink dark:text-paper font-medium">Forge</span>
            <span>— The AI-Native Backend IDE.</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>Runtime: Bun</span>
            <span>Framework: Hono</span>
            <span>Database: PostgreSQL + Drizzle</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
