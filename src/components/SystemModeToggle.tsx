import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SystemModeToggle() {
  const [theme, setThemeState] = React.useState<
    "theme-light" | "dark" | "system"
  >("theme-light");

  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setThemeState(isDarkMode ? "dark" : "theme-light");
  }, []);

  React.useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList[isDark ? "add" : "remove"]("dark");
  }, [theme]);

  const cycleTheme = () => {
    switch (theme) {
      case "theme-light":
        setThemeState("dark");
        break;
      case "dark":
        setThemeState("system");
        break;
      case "system":
        setThemeState("theme-light");
        break;
      default:
        setThemeState("theme-light");
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className={cn(
        "rounded-full",
        "border-sidebar-border",
        "bg-transparent",
        "h-10",
        "w-10",
      )}
    >
      <Sun
        className={cn(
          "h-[1.2rem]",
          "w-[1.2rem]",
          "rotate-0",
          "scale-100",
          "transition-all",
          "duration-200",
          {
            "scale-0 -rotate-90": theme === "dark" || theme === "system",
          },
        )}
      />
      <Moon
        className={cn(
          "absolute",
          "h-[1.2rem]",
          "w-[1.2rem]",
          "rotate-90",
          "scale-0",
          "transition-all",
          "duration-200",
          {
            "scale-100 rotate-0": theme === "dark",
            "scale-0 rotate-90": theme === "theme-light" || theme === "system",
          },
        )}
      />
      <Monitor
        className={cn(
          "absolute",
          "h-[1.2rem]",
          "w-[1.2rem]",
          "rotate-0",
          "scale-0",
          "transition-all",
          "duration-200",
          {
            "scale-100": theme === "system",
            "scale-0": theme === "theme-light" || theme === "dark",
          },
        )}
      />
      <span className="sr-only">Toggle theme (Light → Dark → System)</span>
    </Button>
  );
}
