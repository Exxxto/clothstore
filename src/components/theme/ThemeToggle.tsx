import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full border border-transparent text-nav-foreground hover:border-border/70 hover:bg-background/70 hover:text-nav-hover",
            className,
          )}
          aria-label={isDark ? "Включить светлую тему" : "Включить темную тему"}
          onClick={() => setTheme(nextTheme)}
        >
          {isDark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Светлая тема" : "Темная тема"}</TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
