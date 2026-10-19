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
    <div className="min-h-screen bg-bone text-ink flex flex-col">
      <TopBar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-hairline">
          <span className="text-[10px] uppercase  tracking-[0.018em] text-ash block mb-1 font-normal">
            System & BYOK Preferences
          </span>
          <h1 className="text-3xl font-normal text-ink tracking-tight">
            Settings
          </h1>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="bg-bone p-1 rounded-xl  h-11 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
            <TabsTrigger
              value="providers"
              className="gap-2 rounded-[10px] data-[state=active]:bg-paper data-[state=active]:shadow-none text-xs font-normal"
            >
              <KeyRound className="w-3.5 h-3.5" />
              AI Keys (BYOK)
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="gap-2 rounded-[10px] data-[state=active]:bg-paper data-[state=active]:shadow-none text-xs font-normal"
            >
              <User className="w-3.5 h-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="gap-2 rounded-[10px] data-[state=active]:bg-paper data-[state=active]:shadow-none text-xs font-normal"
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
            <div className="rounded-2xl  bg-paper p-6 space-y-5">
              <div>
                <h3 className="text-base font-normal text-ink">
                  Account Details
                </h3>
                <p className="text-xs text-ash mt-0.5 font-normal">
                  Your identity and authentication profile.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                    Full Name
                  </Label>
                  <Input
                    value={user?.name || ""}
                    disabled
                    className="rounded-[10px] border-hairline bg-bone/30 text-xs font-normal"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-[0.018em] text-ash font-normal">
                    Email Address
                  </Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="rounded-[10px] border-hairline bg-bone/30 text-xs font-normal"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-hairline">
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  className="rounded-[10px] border-hairline text-red-600 hover:text-red-700 hover:bg-bone text-xs gap-1.5 h-8 font-normal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 pt-2">
            <div className="rounded-2xl  bg-paper p-6 space-y-5">
              <div>
                <h3 className="text-base font-normal text-ink">
                  Workspace Theme
                </h3>
                <p className="text-xs text-ash mt-0.5 font-normal">
                  Forge is built exclusively on the Ramp editorial light design system.
                </p>
              </div>

              <div className="max-w-md">
                <div className="flex items-center gap-3 p-4 rounded-xl  bg-bone text-xs">
                  <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center text-ink">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className=" text-xs text-ink block font-normal">Ramp Light (Editorial)</span>
                    <span className="text-[10px] text-ash uppercase tracking-[0.018em] font-normal">System Default & Active Mode</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
