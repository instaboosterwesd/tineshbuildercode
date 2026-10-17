import { useEffect, useState } from "react";
import desktopVideo from "@/assets/dashboard-light.mp4.asset.json";

// Desktop computers (Windows/Mac/Linux, wide screen) get the looping video on Home;
// phones keep the theme background image.
function useDesktopVideo(enabled: boolean) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!enabled) { setOn(false); return; }
    const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setOn(!mobileUa && mq.matches && !reduce.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [enabled]);
  return on;
}

export function UserBackground({ video = false }: { video?: boolean }) {
  const showVideo = useDesktopVideo(video);
  return (
    <div className="user-effects dashboard-background" aria-hidden="true">
      {showVideo && (
        <video
          className="h-full w-full object-cover"
          src={desktopVideo.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
    </div>
  );
}
