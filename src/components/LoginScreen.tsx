import { useEffect, useRef } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HackerLoader } from "@/components/effects/HackerLoader";
import { LottieIcon } from "@/components/effects/LottieIcon";
import video from "@/assets/splash.webm.asset.json";
import star from "@/assets/emoji-star.json.asset.json";
import arrow from "@/assets/emoji-arrow.json.asset.json";
import verified from "@/assets/emoji-verified.json.asset.json";

type Props = {
  mode: "login" | "signup";
  loading: boolean;
  busyAction?: "email" | "google" | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogle: () => void;
  onModeChange: () => void;
};

export function LoginScreen({ mode, loading, busyAction, onSubmit, onGoogle, onModeChange }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { if (media.matches) videoRef.current?.pause(); else videoRef.current?.play().catch(() => {}); };
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return <main className="login-screen grid min-h-dvh place-items-center px-4 py-10">
    <video ref={videoRef} className="login-video" src={video.url} autoPlay muted loop playsInline aria-hidden="true" />
    <div className="login-video-overlay" aria-hidden="true" />
    <form ref={cardRef} onSubmit={onSubmit} className="login-card w-full max-w-[420px] space-y-5 p-7 sm:p-9" onPointerMove={(event) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
    }}>
      <div className="pb-1">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold sm:text-3xl">{mode === "login" ? "Welcome back" : "Create account"}<LottieIcon src={star.url} className="size-7" /></h1>
        <p className="login-muted mt-2 text-sm">{mode === "login" ? "Sign in to your account" : "Start building your next app"}</p>
      </div>
      {mode === "signup" && <div className="space-y-2"><label htmlFor="auth-name" className="flex items-center gap-2 text-sm font-medium"><UserRound className="size-4" />Your name</label><Input id="auth-name" name="name" autoComplete="name" placeholder="Your name" required disabled={loading} /></div>}
      <div className="space-y-2"><label htmlFor="auth-email" className="flex items-center gap-2 text-sm font-medium"><Mail className="size-4" />Email</label><Input id="auth-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required disabled={loading} /></div>
      <div className="space-y-2"><label htmlFor="auth-password" className="flex items-center gap-2 text-sm font-medium"><LockKeyhole className="size-4" />Password<LottieIcon src={verified.url} className="size-5" /></label><div className="relative"><Input id="auth-password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Your password" required minLength={6} disabled={loading} className="pr-12" /><Button type="button" size="icon" variant="ghost" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-1 top-1 size-9" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></div></div>
      <Button type="submit" variant="hero" className="h-12 w-full" disabled={loading}>{loading && busyAction !== "google" ? <HackerLoader compact label="Signing in" /> : <>{mode === "login" ? "Login" : "Sign up"}<LottieIcon src={arrow.url} className="size-5" /></>}</Button>
      <div className="flex items-center gap-3 text-xs login-muted"><span className="h-px flex-1 bg-current opacity-20" />or<span className="h-px flex-1 bg-current opacity-20" /></div>
      <Button type="button" variant="outline" className="login-alternate h-12 w-full" onClick={onGoogle} disabled={loading}>{busyAction === "google" ? <HackerLoader compact label="Connecting to Google" /> : <><svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current"><path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.61-2.42l-3.24-2.51c-.9.6-2.05.96-3.37.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22ZM6.41 13.91A6 6 0 0 1 6.1 12c0-.66.11-1.3.31-1.91V7.5H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.5l3.35-2.59ZM12 5.97c1.47 0 2.79.5 3.83 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.5l3.35 2.59A5.99 5.99 0 0 1 12 5.97Z" /></svg>Continue with Google</>}</Button>
      <Button type="button" variant="link" disabled={loading} className="login-muted h-auto w-full whitespace-normal px-0 text-sm" onClick={onModeChange}>{mode === "login" ? "New here? Create an account" : "Already have an account? Login"}<ArrowRight className="size-4 shrink-0" /></Button>
    </form>
  </main>;
}