import { useState } from "react";

// color tokens
const ACCENT = "#39ff6e";
const BLUE   = "#00c9ff";
const BG0    = "#080808";
const BG1    = "#101010";
const BORDER = "#252525";
const T1     = "#f0f0f0";
const T2     = "#888";
const T3     = "#444";

const fmtKey   = d => d.toISOString().split("T")[0];
const todayKey = () => fmtKey(new Date());
const genId    = () => Math.random().toString(36).slice(2, 10);

const stor = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export default function App() {
  const [tasks,  setTasks]  = useState(() => stor.get("pp_tasks",  {}));
  const [selDate, setSelDate] = useState(todayKey);

  return (
    <div style={{ fontFamily: "monospace", background: BG0, minHeight: "100vh", color: T1, padding: 24 }}>
      <h1 style={{ color: ACCENT }}>Daily Planner</h1>
      <p style={{ color: T2 }}>Selected: {selDate}</p>
    </div>
  );
}
