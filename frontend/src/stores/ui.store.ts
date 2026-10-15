import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProjectStatus } from "../types/api.js";

type ThemeMode = "light" | "dark" | "system";
type RightPanelTab = "chat" | "tester" | "console";

interface UIState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  rightPanelTab: RightPanelTab;
  panelSizes: [number, number, number]; // [sidebar, editor, rightPanel]
  containerStatus: ProjectStatus;
  consoleLogs: string[];
  reconnecting: boolean;
  commandPaletteOpen: boolean;

  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setPanelSizes: (sizes: [number, number, number]) => void;
  setContainerStatus: (status: ProjectStatus) => void;
  appendConsoleLog: (line: string) => void;
  clearConsoleLogs: () => void;
  setReconnecting: (reconnecting: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

const MAX_CONSOLE_LINES = 5000;

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: "light",
      sidebarOpen: true,
      rightPanelTab: "chat",
      panelSizes: [18, 50, 32],
      containerStatus: "stopped",
      consoleLogs: [],
      reconnecting: false,
      commandPaletteOpen: false,

      setTheme: (theme) => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
          const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          root.classList.add(systemDark ? "dark" : "light");
        } else {
          root.classList.add(theme);
        }
        set({ theme });
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
      setPanelSizes: (panelSizes) => set({ panelSizes }),
      setContainerStatus: (containerStatus) => set({ containerStatus }),

      appendConsoleLog: (line) => {
        const { consoleLogs } = get();
        const updated = [...consoleLogs, line];
        if (updated.length > MAX_CONSOLE_LINES) {
          updated.splice(0, updated.length - MAX_CONSOLE_LINES);
        }
        set({ consoleLogs: updated });
      },

      clearConsoleLogs: () => set({ consoleLogs: [] }),
      setReconnecting: (reconnecting) => set({ reconnecting }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
    }),
    {
      name: "forge_ui_settings",
      partialize: (state) => ({
        theme: state.theme,
        panelSizes: state.panelSizes,
        rightPanelTab: state.rightPanelTab,
      }),
    }
  )
);
