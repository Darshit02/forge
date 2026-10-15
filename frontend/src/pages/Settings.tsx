import { useState } from "react";
import { TopBar } from "../components/layout/TopBar.js";
import { ProviderList } from "../components/providers/ProviderList.js";
import { useAuth } from "../hooks/useAuth.js";
import { useUIStore } from "../stores/ui.store.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.js";
import { KeyRound, User, Sliders, LogOut, Sun, Moon, Laptop } from "lucide-react";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useUIStore();

  return (
    <div className="min-h-screen bg-bone dark:bg-background text-ink dark:text-paper flex flex-col">
      <TopBar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-hairline">
          <span className="text-[10px] uppercase font-mono tracking-[0.018em] text-ash block mb-1">
            System & BYOK Preferences
          </span>
          <h1 className="text-3xl font-normal text-ink dark:text-paper tracking-tight">
            Settings
          </h1>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="bg-bone dark:bg-muted p-1 rounded-xl border border-hairline h-11 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
            <TabsTrigger
              value="providers"
              className="gap-2 rounded-lg data-[state=active]:bg-paper dark:data-[state=active]:bg-card data-[state=active]:shadow-none text-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              AI Keys (BYOK)
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="gap-2 rounded-lg data-[state=active]:bg-paper dark:data-[state=active]:bg-card data-[state=active]:shadow-none text-xs"
            >
              <User className="w-3.5 h-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="gap-2 rounded-lg data-[state=active]:bg-paper dark:data-[state=active]:bg-card data-[state=active]:shadow-none text-xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* AI Providers Tab */}
          <TabsContent value="providers" className="space-y-4 pt-2">
            <ProviderList />
          </TabsContent>

          {/* User Profile Tab */}
          <TabsContent value="profile" className="space-y-4 pt-2">
            <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-6 space-y-5">
              <div>
                <h3 className="text-base font-normal text-ink dark:text-paper">
                  Account Details
                </h3>
                <p className="text-xs text-ash mt-0.5">
                  Your identity and authentication profile.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-[0.018em] text-ash">
                    Full Name
                  </Label>
                  <Input
                    value={user?.name || ""}
                    disabled
                    className="rounded-lg border-hairline bg-bone/30 dark:bg-muted/30 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-[0.018em] text-ash">
                    Email Address
                  </Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="rounded-lg border-hairline bg-bone/30 dark:bg-muted/30 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-hairline">
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  className="rounded-md border-hairline text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs gap-1.5 h-8 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 pt-2">
            <div className="rounded-2xl border border-hairline bg-paper dark:bg-card p-6 space-y-5">
              <div>
                <h3 className="text-base font-normal text-ink dark:text-paper">
                  Workspace Theme
                </h3>
                <p className="text-xs text-ash mt-0.5">
                  Choose between the editorial Ramp light canvas, dark mode, or system sync.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-xs ${
                    theme === "light"
                      ? "border-ink bg-bone dark:border-paper dark:bg-muted font-medium text-ink dark:text-paper"
                      : "border-hairline bg-paper dark:bg-card text-ash hover:border-smoke"
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>Ramp Light (Default)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-xs ${
                    theme === "dark"
                      ? "border-ink bg-bone dark:border-paper dark:bg-muted font-medium text-ink dark:text-paper"
                      : "border-hairline bg-paper dark:bg-card text-ash hover:border-smoke"
                  }`}
                >
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <span>Obsidian Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-xs ${
                    theme === "system"
                      ? "border-ink bg-bone dark:border-paper dark:bg-muted font-medium text-ink dark:text-paper"
                      : "border-hairline bg-paper dark:bg-card text-ash hover:border-smoke"
                  }`}
                >
                  <Laptop className="w-5 h-5 text-ash" />
                  <span>Match System</span>
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
