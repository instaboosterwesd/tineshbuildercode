// Adapted from Hacker-Style loading by Carlos Richard Mattos (MIT).
// Full license: src/components/effects/hacker-loading.LICENSE.txt
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const WORD = "LOADING";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function HackerLoader({ compact = false, label = "Loading", className }: { compact?: boolean; label?: string; className?: string }) {
  const [letters, setLetters] = useState(WORD);
  const [locked, setLocked] = useState(0);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (interval) clearInterval(interval);
      setLetters(WORD);
      setLocked(WORD.length);
      if (motion.matches) return;
      let tick = 0;
      interval = setInterval(() => {
        tick = (tick + 1) % 65;
        const count = Math.min(WORD.length, Math.floor(tick / 5));
        setLocked(count);
        setLetters([...WORD].map((letter, index) => index < count ? letter : ALPHABET[Math.floor(Math.random() * ALPHABET.length)] ?? letter).join(""));
      }, 75);
    };
    start();
    motion.addEventListener("change", start);
    return () => { if (interval) clearInterval(interval); motion.removeEventListener("change", start); };
  }, []);
  return <span role="status" aria-label={label} className={cn("hacker-loader", compact ? "hacker-loader-compact" : "hacker-loader-large", className)}>
    <span aria-hidden="true">{[...letters].map((letter, index) => <span key={index} className={index < locked ? "hacker-letter-locked" : ""}>{letter}</span>)}</span>
  </span>;
}

export function LoadingPanel() {
  return <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10" aria-busy="true">
    <div className="flex justify-center py-6"><HackerLoader /></div>
    <div aria-hidden="true" className="space-y-3">
      <Skeleton className="h-6 w-2/5" />
      {[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-4 border-b border-border py-4"><Skeleton className="size-12 shrink-0" /><div className="flex-1 space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}
    </div>
  </div>;
}