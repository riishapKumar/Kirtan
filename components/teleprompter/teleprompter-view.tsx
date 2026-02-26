"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface TeleprompterViewProps {
  title: string;
  lines: { id: string; extractedContent: string; romanizedContent: string | null }[];
}

type ViewMode = "hindi" | "romanized" | "both";

interface Settings {
  speed: number;
  fontSize: number;
  spacing: number;
  loopMode: "none" | "line" | "all";
  mirror: boolean;
  viewMode: ViewMode;
}

const defaultSettings: Settings = {
  speed: 0.4,
  fontSize: 30,
  spacing: 1.6,
  loopMode: "none",
  mirror: false,
  viewMode: "both",
};

export function TeleprompterView({ title, lines }: TeleprompterViewProps) {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    const raw = window.localStorage.getItem("teleprompter-settings");
    return raw ? { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) } : defaultSettings;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileDual, setMobileDual] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

    useEffect(() => {
    window.localStorage.setItem("teleprompter-settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === " ") {
        event.preventDefault();
        setIsPlaying((current) => !current);
      }
      if (event.key === "ArrowDown") setActiveIndex((current) => Math.min(current + 1, lines.length - 1));
      if (event.key === "ArrowUp") setActiveIndex((current) => Math.max(current - 1, 0));
      if (event.key.toLowerCase() === "f") document.documentElement.requestFullscreen().catch(() => undefined);
      if (event.key.toLowerCase() === "m") setSettings((current) => ({ ...current, mirror: !current.mirror }));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lines.length]);

  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    let lastTs = performance.now();

    const step = (timestamp: number) => {
      const elapsed = timestamp - lastTs;
      if (elapsed > 1000 / Math.max(settings.speed, 0.1)) {
        setActiveIndex((current) => {
          if (current >= lines.length - 1) {
            if (settings.loopMode === "all") return 0;
            if (settings.loopMode === "line") return current;
            setIsPlaying(false);
            return current;
          }
          return current + 1;
        });
        lastTs = timestamp;
      }
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, lines.length, settings.loopMode, settings.speed]);

  useEffect(() => {
    const activeElement = listRef.current?.querySelector(`[data-line='${activeIndex}']`);
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  const renderRomanized = useMemo(() => lines.map((line) => line.romanizedContent ?? line.extractedContent), [lines]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="grid gap-3 rounded-lg border p-4 text-sm md:grid-cols-6">
        <label className="grid gap-1">Speed
          <input type="range" min={0.2} max={2.5} step={0.1} value={settings.speed} onChange={(event) => setSettings((current) => ({ ...current, speed: Number(event.target.value) }))} />
        </label>
        <label className="grid gap-1">Font
          <input type="range" min={18} max={56} step={1} value={settings.fontSize} onChange={(event) => setSettings((current) => ({ ...current, fontSize: Number(event.target.value) }))} />
        </label>
        <label className="grid gap-1">Spacing
          <input type="range" min={1} max={2.5} step={0.1} value={settings.spacing} onChange={(event) => setSettings((current) => ({ ...current, spacing: Number(event.target.value) }))} />
        </label>
        <label className="grid gap-1">Loop
          <select value={settings.loopMode} onChange={(event) => setSettings((current) => ({ ...current, loopMode: event.target.value as Settings["loopMode"] }))} className="rounded-md border px-2 py-1">
            <option value="none">No loop</option>
            <option value="line">Current line</option>
            <option value="all">All lines</option>
          </select>
        </label>
        <label className="grid gap-1">Mode
          <select value={settings.viewMode} onChange={(event) => setSettings((current) => ({ ...current, viewMode: event.target.value as ViewMode }))} className="rounded-md border px-2 py-1">
            <option value="hindi">Hindi</option>
            <option value="romanized">Romanized</option>
            <option value="both">Both</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className="rounded-md border px-3 py-1" onClick={() => setIsPlaying((current) => !current)}>{isPlaying ? "Pause" : "Play"}</button>
          <button className="rounded-md border px-3 py-1" onClick={() => setSettings((current) => ({ ...current, mirror: !current.mirror }))}>Mirror</button>
          <button className="rounded-md border px-3 py-1 md:hidden" onClick={() => setMobileDual((current) => !current)}>{mobileDual ? "Single" : "Dual"}</button>
        </div>
      </div>

      <div ref={listRef} className={`rounded-lg border p-4 ${settings.mirror ? "scale-x-[-1]" : ""}`} style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.spacing }}>
        <div className={`grid gap-4 ${settings.viewMode === "both" && mobileDual ? "grid-cols-2" : "md:grid-cols-2"}`}>
          {settings.viewMode !== "romanized" && (
            <ol className="space-y-3">
              {lines.map((line, index) => (
                <li key={line.id} data-line={index} className={index === activeIndex ? "rounded-md bg-accent px-2 py-1" : "px-2 py-1"}>{line.extractedContent}</li>
              ))}
            </ol>
          )}
          {settings.viewMode !== "hindi" && (
            <ol className="space-y-3 text-muted-foreground">
              {renderRomanized.map((line, index) => (
                <li key={`${lines[index].id}-romanized`} data-line={index} className={index === activeIndex ? "rounded-md bg-accent px-2 py-1 text-foreground" : "px-2 py-1"}>{line}</li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Desktop shortcuts: Space play/pause · ↑/↓ line jump · F fullscreen · M mirror.</p>
    </section>
  );
}
