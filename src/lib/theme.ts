import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "builder-theme";

// Runs in <head> before paint so there's no flash of the wrong theme.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${KEY}');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`;

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem(KEY, next);
    setTheme(next);
  }
  return { theme, toggle };
}
