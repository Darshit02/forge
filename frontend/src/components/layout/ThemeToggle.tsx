import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button.js";
import { useUIStore } from "../../stores/ui.store.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.js";

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-md border border-hairline text-ink dark:text-paper hover:bg-wash"
        >
          {theme === "dark" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border border-hairline bg-paper dark:bg-card">
        <DropdownMenuItem
          className="text-xs cursor-pointer text-ink dark:text-paper"
          onClick={() => setTheme("light")}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs cursor-pointer text-ink dark:text-paper"
          onClick={() => setTheme("dark")}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs cursor-pointer text-ink dark:text-paper"
          onClick={() => setTheme("system")}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
