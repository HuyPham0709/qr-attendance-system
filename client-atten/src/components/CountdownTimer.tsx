import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

function calcTimeLeft(targetDate: Date): TimeLeft {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

interface Props {
  /** ISO string hoặc Date của event.startAt — trước đây hardcode "2026-10-15T18:00:00" */
  targetDate: string | Date;
  compact?: boolean;
}

export default function CountdownTimer({ targetDate, compact = false }: Props) {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target.getTime()]);

  const units: [keyof TimeLeft, string][] = [
    ["days", "Ngày"],
    ["hours", "Giờ"],
    ["mins", "Phút"],
    ["secs", "Giây"],
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1 font-mono text-sm font-semibold text-white">
        <span>{pad(time.days)}d</span>
        <span className="text-indigo-400">:</span>
        <span>{pad(time.hours)}h</span>
        <span className="text-indigo-400">:</span>
        <span>{pad(time.mins)}m</span>
        <span className="text-indigo-400">:</span>
        <span className="text-amber-400">{pad(time.secs)}s</span>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      {units.map(([key, label], i) => (
        <div key={key} className="flex items-end gap-2">
          <div className="flex flex-col items-center">
            <div
              className="rounded-xl border border-indigo-500/30 bg-slate-800/80 backdrop-blur-sm px-3 py-2 min-w-[56px] text-center"
              style={{
                boxShadow: "0 2px 12px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <span className="font-mono text-2xl font-bold text-white leading-none">
                {pad(time[key])}
              </span>
            </div>
            <span className="mt-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">
              {label}
            </span>
          </div>
          {i < 3 && (
            <span className="mb-5 font-mono text-2xl font-bold text-indigo-500/60 leading-none select-none">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
