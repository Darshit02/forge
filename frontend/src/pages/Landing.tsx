import { Link } from "react-router-dom";
import { Button } from "../components/ui/button.js";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Box,
  Send,
  Layers,
  ShieldCheck,
  GitBranch,
  Gauge,
  Check,
  Play,
  Terminal,
  Route,
  Hexagon,
  Flame,
  FlaskConical,
  Leaf,
  Rabbit,
  Cog,
  Zap,
} from "lucide-react";

const STACKS = [
  { name: "FastAPI", icon: Zap },
  { name: "Express", icon: Route },
  { name: "NestJS", icon: Hexagon },
  { name: "Hono", icon: Flame },
  { name: "Flask", icon: FlaskConical },
  { name: "Django", icon: Leaf },
  { name: "Go", icon: Rabbit },
  { name: "Rust", icon: Cog },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "BYOK Multi-Provider AI",
    body: "Connect OpenAI, Anthropic, Gemini, or any OpenAI-compatible endpoint. Keys are sealed with AES-256-GCM. Zero subscription markup.",
    tag: "Vercel AI SDK streaming",
  },
  {
    icon: Box,
    title: "Live Docker Sandboxes",
    body: "Every project boots a dedicated container bound to your filesystem. Hot reload, host port allocation, and live stdout/stderr over WebSockets.",
    tag: "Automatic resource bounds",
  },
  {
    icon: Send,
    title: "Built-in API Tester",
    body: "Fire requests straight at your running container with headers, query params, bodies, auth, and {{ENV}} interpolation. No second tool.",
    tag: "Sub-ms internal proxy",
  },
  {
    icon: Layers,
    title: "OpenAPI Reflection",
    body: "Forge inspects your app as it boots. FastAPI swagger, Express routes, and Hono schemas sync into your collections automatically.",
    tag: "Instant WebSocket sync",
  },
  {
    icon: GitBranch,
    title: "Git & ZIP Import",
    body: "Clone a repo or drop an archive. Forge detects the framework, writes a Dockerfile, and gets you to a running server in one step.",
    tag: "Framework autodetect",
  },
  {
    icon: ShieldCheck,
    title: "SSRF-Hardened Proxy",
    body: "The tester resolves and blocks private ranges, reroutes to the container network, and keeps a full request/response history.",
    tag: "Safe by default",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Scaffold",
    body: "Pick a framework or import an existing repository. Forge lays down the files and a matching Dockerfile.",
  },
  {
    n: "02",
    title: "Run",
    body: "A sandboxed container starts in milliseconds with a dedicated host port and streamed build logs.",
  },
  {
    n: "03",
    title: "Test",
    body: "Probe endpoints in the integrated tester while the agent edits code against your live spec.",
  },
];

const STATS = [
  { value: "< 450", unit: "ms", label: "Container startup" },
  { value: "10+", unit: "stacks", label: "Frameworks supported" },
  { value: "AES-256", unit: "GCM", label: "Key encryption" },
  { value: "Instant", unit: "live", label: "Spec reflection" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bone text-ink font-sans selection:bg-primary selection:text-ink">
      {/* ───────────────────────── Navigation ───────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-hairline bg-bone/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-ink">Forge</span>
            </Link>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
            {["Product", "Features", "Workflow"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-black transition-colors hover:text-ink"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className="hidden text-sm text-black transition-colors hover:text-ink sm:inline"
            >
              Log in
            </Link>
            <Button
              asChild
              size="sm"
              className="h-10 rounded-full bg-primary px-6 text-sm text-ink hover:bg-primary/90"
            >
              <Link to="/register">
                Start for free
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative border-b border-hairline bg-paper py-20 lg:py-32">
        {/* Abstract Background Shapes */}
        <div className="relative mx-auto max-w-[1300px] px-6 text-center">
          <div className="forge-rise flex flex-col items-center">
            <h1 className="text-5xl font-extraBold leading-[1.1] tracking-[-0.04em] text-ink sm:text-6xl lg:text-[80px]">
              Run your backend
              <br />
              in <span className="underline  underline-primary">one place</span>
            </h1>

            <p className="mt-8 max-w-5xl text-lg leading-relaxed text-ash">
              Create beautiful APIs, scaffold services and manage your projects in isolated sandboxes.
              Stream agentic code edits and test endpoints in an integrated suite.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 rounded-full bg-primary px-8 text-base text-ink hover:bg-primary/85 shadow-lg"
              >
                <Link to="/register">
                  Start for free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-full border-hairline px-8 text-base text-ink hover:bg-bone"
              >
                <a href="#features">See features</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Mockup centered below */}
        <div className="forge-rise relative mx-auto mt-20 max-w-[1100px] px-6 lg:mt-24" style={{ animationDelay: "150ms" }}>
          <IDEMockup />
        </div>
      </section>

      {/* ───────────────────────── Stack marquee ───────────────────────── */}
      <section id="product" className="border-b border-hairline bg-paper">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <p className="mb-5 text-center text-[10px] uppercase tracking-[0.018em] text-ash">
            Ships starter templates for
          </p>
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="forge-marquee-track flex w-max items-center gap-3">
              {[...STACKS, ...STACKS].map((stack, i) => (
                <span
                  key={`${stack.name}-${i}`}
                  className="flex items-center gap-2.5 rounded-full bg-bone py-1.5 pl-1.5 pr-4  text-xs text-ink"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-ink">
                    <stack.icon className="h-3.5 w-3.5" />
                  </span>
                  {stack.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Features ───────────────────────── */}
      <section id="features" className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="mb-12 max-w-5xl">
            <span className="mb-2 block text-body uppercase tracking-[0.018em] text-ash">
              Core architecture
            </span>
            <h2 className="text-3xl tracking-[-0.02em] text-ink sm:text-5xl">
              Everything your <span className="underline  underline-primary">backend workflow needs </span>, in a single pane of glass.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group flex flex-col rounded-2xl  bg-paper p-6 transition-colors duration-300 hover:border-ink/25"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-[10px] bg-bone text-ink transition-colors group-hover:bg-primary">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="text-lg text-ink">{feature.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-ash">
                  {feature.body}
                </p>
                <div className="mt-5 flex items-center gap-2 border-t border-hairline pt-4 text-[11px] text-ash">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {feature.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Agent split ───────────────────────── */}
      <section className="border-b border-hairline bg-paper">
        <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-6 py-20 lg:grid-cols-2">
          <div>
            <span className="mb-2 block text-[16px] uppercase tracking-[0.018em] text-ash">
              Agentic editing
            </span>
            <h2 className="text-3xl tracking-[-0.02em] text-ink sm:text-5xl">
              An agent that edits your real codebase.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ash">
              Describe the change in plain language. Forge streams tool calls —
              file reads, patches, and shell commands — directly against the
              project on disk, showing every diff before it lands.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Streaming responses with inline diffs",
                "Multi-provider model routing",
                "Context drawn from your live API spec",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink">
                  <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary mb-1.5">
                    <Check className="h-3 w-3 text-ink font-bold" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <AgentChatMockup />
        </div>
      </section>

      {/* ───────────────────────── Tester split ───────────────────────── */}
      <section className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-6 py-20 lg:grid-cols-2">
          <TesterMockup />

          <div className="lg:order-first">
            <span className="mb-2 block text-[16px] uppercase tracking-[0.018em] text-ash">
              Integrated API suite
            </span>
            <h2 className="text-3xl tracking-[-0.02em] text-ink sm:text-5xl">
              Stop context-switching to test an endpoint.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ash">
              Request builder, environments, collections, and response inspection
              live beside your editor. Every call targets the running container
              over a hardened internal proxy.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-hairline pt-6">
              {[
                { icon: Gauge, label: "Fast proxy" },
                { icon: ShieldCheck, label: "SSRF guarded" },
                { icon: Terminal, label: "Full history" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-2">
                  <item.icon className="h-4 w-4 text-ink" />
                  <span className="text-[11px] text-ash">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Workflow ───────────────────────── */}
      <section id="workflow" className="border-b border-hairline bg-paper">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="mb-2 block text-[16px] uppercase tracking-[0.018em] text-ash">
                The loop
              </span>
              <h2 className="text-3xl tracking-[-0.02em] text-ink sm:text-5xl">
                Scaffold. Run. Test. Repeat.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ash">
              Three steps stand between an idea and a response body no terminal
              gymnastics, no local Docker setup.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl  bg-hairline md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="bg-bone p-7">
                <span className=" text-xs text-ash">{step.n}</span>
                <h3 className="mt-4 text-2xl text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Stats band ───────────────────────── */}
      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-px px-6 py-14 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-2 py-2">
              <div className="flex items-baseline gap-1.5">
                <span className=" text-4xl tracking-tight">
                  {stat.value}
                </span>
                <span className="text-sm text-paper/60">{stat.unit}</span>
              </div>
              <p className="mt-2 text-[16px] uppercase tracking-[0.018em] text-paper/50">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <section className="border-b border-hairline bg-primary">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="max-w-2xl text-4xl tracking-[-0.02em] text-ink sm:text-5xl">
              Spin up your first sandbox in under a minute.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-ink/70">
              Bring your own model key and keep full control of the runtime.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-11 shrink-0 gap-2 rounded-full bg-ink px-6 text-sm text-paper hover:bg-ink/85"
          >
            <Link to="/register">
              Create free workspace
            </Link>
          </Button>
        </div>
      </section>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="bg-bone">
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2">

                <span className="text-ink">Forge</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ash">
                The AI-native backend IDE. Scaffold, run, and test services
                without ever leaving the browser.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              {[
                { title: "Product", links: ["Features", "Workflow", "Templates"] },
                { title: "Developers", links: ["Docs", "API", "Status"] },
                { title: "Company", links: ["About", "Security", "Contact"] },
              ].map((col) => (
                <div key={col.title}>
                  <p className="mb-3 text-[10px] uppercase tracking-[0.018em] text-ash">
                    {col.title}
                  </p>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-xs text-ink transition-colors hover:text-ash"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 text-[11px] text-ash sm:flex-row sm:items-center">
            <span>© 2026 Forge. All rights reserved.</span>
            <div className="flex items-center gap-5 ">
              <span>Bun</span>
              <span>Hono</span>
              <span>Postgres + Drizzle</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────── Mockups ───────────────────────── */

function IDEMockup() {
  return (
    <div className="overflow-hidden rounded-2xl  bg-paper shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12),0_16px_32px_-8px_rgba(0,0,0,0.08)]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-hairline bg-bone/40 px-5 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-hairline/60" />
          <span className="h-3 w-3 rounded-full bg-hairline/60" />
          <span className="h-3 w-3 rounded-full bg-hairline/60" />
        </div>
        <span className="ml-4  text-[12px] text-ash/80 tracking-tight">
          forge — orders-api
        </span>

      </div>

      <div className="grid grid-cols-[180px_1fr]">
        {/* File tree */}
        <div className="hidden border-r border-hairline bg-bone/20 p-4 sm:block">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.1em] text-ash/60">
            Explorer
          </p>
          <ul className="space-y-1  text-[12px]">
            <li className="px-2 py-1 text-ash/80">app/</li>
            <li className="px-2 py-1 text-ash/80">  main.py</li>
            <li className="rounded-[4px] bg-primary/30 px-2 py-1 text-ink font-medium">
              routes.py
            </li>
            <li className="px-2 py-1 text-ash/80">requirements.txt</li>
            <li className="px-2 py-1 text-ash/80">Dockerfile</li>
          </ul>
        </div>

        {/* Editor */}
        <div className="flex flex-col">
          <div className="flex items-center border-b border-hairline bg-bone/20">
            <div className="border-r border-hairline bg-paper px-6 py-2.5  text-[12px] text-ink border-t-2 border-t-primary">
              routes.py
            </div>
            <div className="px-6 py-2.5  text-[12px] text-ash/60">
              main.py
            </div>
          </div>

          <div className="relative flex-1 bg-paper p-6">
            <pre className=" text-[13px] leading-[1.8] text-ink/90">
              <code>
                <div className="flex gap-6">
                  <span className="w-4 text-right text-ash/30 select-none">1</span>
                  <span><span className="text-ash/60">from</span> fastapi <span className="text-ash/60">import</span> FastAPI</span>
                </div>
                <div className="flex gap-6">
                  <span className="w-4 text-right text-ash/30 select-none">2</span>
                  <span><span className="text-ash/60">from</span> pydantic <span className="text-ash/60">import</span> BaseModel</span>
                </div>
                <div className="flex gap-6">
                  <span className="w-4 text-right text-ash/30 select-none">3</span>
                  <span />
                </div>
                <div className="flex gap-6">
                  <span className="w-4 text-right text-ash/30 select-none">4</span>
                  <span>app = FastAPI()</span>
                </div>
                <div className="flex gap-6">
                  <span className="w-4 text-right text-ash/30 select-none">5</span>
                  <span />
                </div>
                <div className="flex gap-6">
                  <span className="w-4 text-right text-ash/30 select-none">6</span>
                  <span><span className="rounded-[2px] bg-primary/40 px-0.5">@app.get</span>(<span className="text-ash/60">"/orders/{"{id}"}"</span>)</span>
                </div>
                <div className="flex gap-6">
                  <span className="w-4 text-right text-ash/30 select-none">7</span>
                  <span><span className="text-ash/60">async def</span> get_order(id: <span className="text-ash/60">int</span>):</span>
                </div>
                <div className="flex gap-6">
                  <span className="w-4 text-right text-ash/30 select-none">8</span>
                  <span>    <span className="text-ash/60">return</span> {"{"}<span className="text-ash/60">"id"</span>: id, <span className="text-ash/60">"status"</span>: <span className="text-ash/60">"paid"</span>{"}"}</span>
                </div>
              </code>
            </pre>
          </div>

          {/* Terminal */}
          <div className="bg-[#0c0a08] p-6  text-[12px] leading-relaxed text-paper/90">
            <div className="mb-3 flex items-center gap-2 text-paper/40">
              <Terminal className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Terminal</span>
            </div>
            <div className="space-y-1">
              <p className="flex gap-2">
                <span className="text-primary font-bold">➜</span>
                <span>uvicorn app.main:app --reload</span>
              </p>
              <p className="text-paper/40">INFO: Uvicorn running on http://0.0.0.0:8000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentChatMockup() {
  return (
    <div className="rounded-2xl border border-hairline bg-bone p-5">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[10px] rounded-br-[4px] bg-ink px-3.5 py-2.5 text-xs leading-relaxed text-paper">
          Add pagination to the orders list endpoint.
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="flex-1 space-y-3">
          <p className="text-xs leading-relaxed text-ink">
            I'll update the route to accept{" "}
            <code className="rounded-[4px] bg-paper px-1 py-0.5  text-[11px]">
              limit
            </code>{" "}
            and{" "}
            <code className="rounded-[4px] bg-paper px-1 py-0.5  text-[11px]">
              offset
            </code>{" "}
            query params.
          </p>

          <div className="rounded-[10px] border border-hairline bg-paper">
            <div className="flex items-center gap-2 border-b border-hairline px-3 py-2  text-[10.5px] text-ash">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              patch · app/routes.py
            </div>
            <div className="space-y-1 px-3 py-2.5  text-[10.5px]">
              <p className="text-ash">- def list_orders():</p>
              <p className="text-ink">
                + def list_orders(limit: int = 20, offset: int = 0):
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TesterMockup() {
  return (
    <div className="rounded-2xl border border-hairline bg-paper p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-[10px] bg-primary px-2.5 py-1.5  text-[11px] text-ink">
          GET
        </span>
        <div className="flex-1 truncate rounded-[10px] border border-hairline bg-bone px-3 py-2  text-[11px] text-ink">
          http://localhost:8000/orders/42
        </div>
        <span className="rounded-[10px] bg-ink px-4 py-2 text-[11px] text-paper">
          Send
        </span>
      </div>

      <div className="mt-3 flex gap-4 border-b border-hairline pb-2 text-[10px] uppercase tracking-[0.018em] text-ash">
        <span className="border-b-2 border-primary pb-2 text-ink">Body</span>
        <span>Headers</span>
        <span>Auth</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] text-ash">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
            <Check className="h-2.5 w-2.5 text-ink" />
          </span>
          200 OK
        </span>
        <span className=" text-[10.5px] text-ash">18 ms · 64 B</span>
      </div>

      <pre className="mt-3 overflow-x-auto rounded-[10px] border border-hairline bg-bone px-3 py-3  text-[11px] leading-relaxed text-ink">
        <code>
          {"{"}
          {"\n"}  <span className="text-ash">"id"</span>: 42,
          {"\n"}  <span className="text-ash">"status"</span>:{" "}
          <span className="bg-primary/40">"paid"</span>,
          {"\n"}  <span className="text-ash">"total"</span>: 128.5
          {"\n"}
          {"}"}
        </code>
      </pre>
    </div>
  );
}
