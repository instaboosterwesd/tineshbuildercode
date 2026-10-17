import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

export function LottieIcon({ src, className = "size-6" }: { src: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let active = true;
    let animation: AnimationItem | undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController();
    Promise.all([import("lottie-web"), fetch(src, { signal: controller.signal }).then((res) => {
      if (!res.ok) throw new Error("Emoji unavailable");
      return res.json();
    })]).then(([module, animationData]) => {
      if (!active || !ref.current) return;
      animation = module.default.loadAnimation({ container: ref.current, renderer: "svg", animationData, loop: true, autoplay: !motion.matches });
    }).catch(() => {});
    const update = () => { if (motion.matches) animation?.pause(); else animation?.play(); };
    motion.addEventListener("change", update);
    return () => { active = false; controller.abort(); animation?.destroy(); motion.removeEventListener("change", update); };
  }, [src]);
  return <span ref={ref} aria-hidden="true" className={`inline-block shrink-0 ${className}`} />;
}