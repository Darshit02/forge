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
    <div className="min-h-screen bg-bone text-ink selection:bg-primary selection:text-ink font-sans">
      {/* Editorial Navigation */}
      <nav className="border-b border-hairline bg-paper/90 backdrop-blur sticky top-0 z-50 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[4px] bg-primary flex items-center justify-center font-normal text-ink text-xs leading-none">
              F
            </div>
            <span className="font-normal tracking-tight text-base text-ink">
              Forge
            </span>
          </Link>
          <span className="text-[10px] uppercase font-mono tracking-[0.018em] px-2 py-0.5 rounded-[4px] bg-bone text-ash border border-hairline ml-2 hidden sm:inline-block font-normal">
            AI-Native Backend IDE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            to="/login"
            className="text-xs text-ash hover:text-ink transition-colors font-normal"
          >
            Sign In
          </Link>
          <Button
            asChild
            className="rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal text-xs px-4 h-8 gap-1.5"
          >
            <Link to="/register">
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section - Left-Aligned within Centered Max-Width */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 text-left">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] border border-hairline bg-paper text-[10px] font-mono uppercase tracking-[0.018em] text-ash mb-8 font-normal">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>EDITORIAL BACKEND WORKSPACE // BYOK AI ENGINE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-[-0.03em] leading-[1.05] text-ink max-w-4xl text-left">
          Write, run, and test backend APIs without leaving the browser.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-ash max-w-2xl font-normal leading-relaxed text-left">
          Forge is an AI-native backend IDE. Scaffold frameworks in Python, Node,
          Go, and Rust, stream agentic code edits, execute containers in real-time,
          and test endpoints in an integrated API suite.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto rounded-[6px] bg-primary text-ink hover:bg-primary/90 font-normal text-sm h-11 px-6 gap-2"
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
            className="w-full sm:w-auto rounded-[6px] border-hairline hover:bg-bone text-sm h-11 px-6 font-normal text-ink"
          >
            <Link to="/login">Sign In with Existing Account</Link>
          </Button>
        </div>

        {/* Live Counters / Telemetry Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
          <div className="rounded-xl border border-hairline bg-paper p-4 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block font-normal">
              Container Startup
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono text-ink font-normal">
                &lt; 450
              </span>
              <span className="text-xs text-ink font-mono font-normal">ms</span>
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-paper p-4 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block font-normal">
              Supported Stacks
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono text-ink font-normal">
                10+
              </span>
              <span className="text-xs text-ash font-mono font-normal">frameworks</span>
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-paper p-4 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block font-normal">
              Key Encryption
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono text-ink font-normal">
                AES-256
              </span>
              <span className="text-xs text-ink font-mono font-normal">GCM</span>
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-paper p-4 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block font-normal">
              Spec Reflection
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-mono text-ink font-normal">
                Instant
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-[4px] bg-primary text-ink font-normal">
                live
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Grid */}
      <section className="max-w-[1200px] mx-auto px-6 py-16 text-left">
        <div className="text-left mb-10">
          <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block mb-1 font-normal">
            Core Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-normal text-ink">
            Everything your backend workflow needs. Single pane of glass.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1 */}
          <div className="rounded-2xl border border-hairline bg-paper p-6 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-[6px] bg-bone border border-hairline flex items-center justify-center text-ink mb-4">
                <Sparkles className="w-4 h-4 text-ink" />
              </div>
              <h3 className="text-lg font-normal text-ink">
                BYOK Multi-Provider AI
              </h3>
              <p className="text-xs text-ash mt-2 leading-relaxed font-normal">
                Connect your OpenAI, Anthropic, Google Gemini, or custom OpenAI-compatible
                endpoint (Ollama, vLLM, Groq). All keys are encrypted at rest with AES-256-GCM.
                Zero subscription markup.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-2 text-[11px] font-mono text-ash font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Direct streaming via Vercel AI SDK</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-hairline bg-paper p-6 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-[6px] bg-bone border border-hairline flex items-center justify-center text-ink mb-4">
                <Box className="w-4 h-4 text-ink" />
              </div>
              <h3 className="text-lg font-normal text-ink">
                Live Isolated Docker Sandboxes
              </h3>
              <p className="text-xs text-ash mt-2 leading-relaxed font-normal">
                Every project spins up a dedicated container bound to your filesystem.
                Hot reload on code change, dedicated host port allocation, and live stdout/stderr
                log streaming via WebSockets.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-2 text-[11px] font-mono text-ash font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Automatic resource bounds & lifecycle hooks</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-hairline bg-paper p-6 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-[6px] bg-bone border border-hairline flex items-center justify-center text-ink mb-4">
                <Send className="w-4 h-4 text-ink" />
              </div>
              <h3 className="text-lg font-normal text-ink">
                Built-in API Tester (No Postman)
              </h3>
              <p className="text-xs text-ash mt-2 leading-relaxed font-normal">
                Send HTTP requests straight to your running container. Support for headers,
                query params, raw JSON/form bodies, Bearer/Basic auth, and environment variable
                interpolation like <code className="text-ink font-mono bg-bone px-1 py-0.5 rounded-[4px]">{"{{API_KEY}}"}</code>.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-2 text-[11px] font-mono text-ash font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Sub-millisecond internal proxy execution</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-hairline bg-paper p-6 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-[6px] bg-bone border border-hairline flex items-center justify-center text-ink mb-4">
                <Layers className="w-4 h-4 text-ink" />
              </div>
              <h3 className="text-lg font-normal text-ink">
                Auto OpenAPI Reflection
              </h3>
              <p className="text-xs text-ash mt-2 leading-relaxed font-normal">
                Forge inspects your application as it boots. FastAPI swagger docs, Express routes,
                and Hono endpoint schemas are parsed and synced automatically to your API collections.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-2 text-[11px] font-mono text-ash font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Instant sync over native WebSockets</span>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Colophon / Footer */}
      <footer className="border-t border-hairline bg-paper py-10 px-6 mt-16 text-xs text-ash">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-[4px] bg-primary flex items-center justify-center font-normal text-ink text-[10px]">
              F
            </div>
            <span className="text-ink font-normal">Forge</span>
            <span className="font-normal">— The AI-Native Backend IDE.</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px] font-normal">
            <span>Runtime: Bun</span>
            <span>Framework: Hono</span>
            <span>Database: PostgreSQL + Drizzle</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
