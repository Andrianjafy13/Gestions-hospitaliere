import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Activer le mode clair" : "Activer le mode sombre";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-full
        border border-slate-200 bg-white text-slate-700 shadow-sm transition
        hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500
        focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900
        dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-950
        ${className}`}
      aria-label={label}
      title={label}
    >
      <Icon size={18} />
    </button>
  );
}
