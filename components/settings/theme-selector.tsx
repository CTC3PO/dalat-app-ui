"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Laptop, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", labelKey: "themeLight", icon: Sun },
  { value: "dark", labelKey: "themeDark", icon: Moon },
  { value: "system", labelKey: "themeSystem", icon: Laptop },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("userMenu");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {themes.map((themeItem) => (
          <div
            key={themeItem.value}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-muted/30 animate-pulse"
          >
            <div className="w-5 h-5 rounded bg-muted" />
            <div className="w-12 h-3 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map((themeItem) => {
        const Icon = themeItem.icon;
        const isSelected = theme === themeItem.value;
        return (
          <button
            key={themeItem.value}
            onClick={() => setTheme(themeItem.value)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="relative">
              <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
              {isSelected && (
                <Check className="w-3 h-3 text-primary absolute -bottom-1 -right-1" />
              )}
            </div>
            <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>
              {t(themeItem.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
