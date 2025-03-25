import { useState, useEffect, useCallback, useRef } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const ACCENT = "#39ff6e";
const BLUE   = "#00c9ff";
const AMBER  = "#fbbf24";
const RED    = "#f87171";
const BG0    = "#080808";
const BG1    = "#101010";
const BG2    = "#161616";
const BG3    = "#1e1e1e";
const BORDER = "#222222";
const T1     = "#f0f0f0";
const T2     = "#888888";
const T3     = "#444444";

const fmtKey   = d => d.toISOString().split("T")[0];
const todayKey = () => fmtKey(new Date());
const genId    = () => Math.random().toString(36).slice(2, 10);

const stor = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const getCompPct = task => {
  if (task.type === "binary") return task.completed ? 100 : 0;
  if (!task.target || task.target === 0) return 0;
  return Math.min(100, Math.round(((task.progress || 0) / task.target) * 100));
};

/* ── tooltip components at module scope ── */
function BarTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: BG2, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 12px", fontSize: 11, color: T1 }}>
      <div style={{ color: T2, marginBottom: 2 }}>{payload[0].payload.date}</div>
      <div style={{ color: BLUE }}>{payload[0].value}% avg</div>
    </div>
  );
}

function PieTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: BG2, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 12px", fontSize: 11 }}>
      <span style={{ color: d.payload.c }}>{d.name}</span>
      <span style={{ color: T1, marginLeft: 8 }}>{d.value}</span>
    </div>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div style={{ background: BG1, border: "1px solid " + BORDER, borderRadius: 10, padding: "18px 16px" }}>
      <div style={{ fontSize: 9, color: T3, letterSpacing: "0.14em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: color || T1, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T3, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Insights({ insights, habits }) {
  const { pie, bar, streak, rate, done, total } = insights;
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.18em", color: T3, marginBottom: 6 }}>ANALYTICS DASHBOARD</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: T1, letterSpacing: "-0.02em" }}>Monthly Insights</div>
        <div style={{ fontSize: 11, color: T3, marginTop: 4 }}>Last 30 days · auto-aggregated</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginBottom: 28 }}>
        <Stat label="HABIT STREAK"      value={streak}       sub="consecutive days"          color={streak > 0 ? ACCENT : T2} />
        <Stat label="TASKS COMPLETED"   value={done}         sub={"out of " + total + " total"} color={T1} />
        <Stat label="COMPLETION RATE"   value={rate + "%"}   sub="of all tasks fully done"   color={rate >= 70 ? ACCENT : rate >= 40 ? AMBER : RED} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.5fr)", gap: 16 }}>
        <div style={{ background: BG1, border: "1px solid " + BORDER, borderRadius: 10, padding: "20px 20px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: T3, marginBottom: 16 }}>TASK COMPLETION RATIO</div>
          {total === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: T3, fontSize: 11 }}>No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pie} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="v" paddingAngle={3}>
                    {pie.map((e, i) => <Cell key={i} fill={e.c} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {pie.map(d => (
                  <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.c, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: T2 }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 10, color: T1, fontWeight: 600 }}>
                      {d.v} <span style={{ color: T3, fontWeight: 400 }}>({total ? Math.round((d.v / total) * 100) : 0}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ background: BG1, border: "1px solid " + BORDER, borderRadius: 10, padding: "20px 20px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: T3, marginBottom: 16 }}>AVG COMPLETION — PROGRESS TASKS (14d)</div>
          {bar.length === 0 ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: T3, fontSize: 11 }}>No quantifiable task data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bar} barSize={10} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={BG3} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: T3, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T3, fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => v + "%"} />
                <Tooltip content={<BarTip />} cursor={{ fill: BLUE + "08" }} />
                <Bar dataKey="avg" fill={BLUE} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      {habits.length > 0 && (
        <div style={{ marginTop: 16, background: BG1, border: "1px solid " + BORDER, borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: T3, marginBottom: 12 }}>ACTIVE CORE HABITS ({habits.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {habits.map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: ACCENT + "10", border: "1px solid " + ACCENT + "25", borderRadius: 20 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: T2 }}>{h.title}</span>
                {h.type === "quantifiable" && <span style={{ fontSize: 10, color: T3 }}>({h.target} {h.unit})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, selDate, onToggle, onProgress, onDelete }) {
  const pct  = getCompPct(task);
  const done = pct >= 100;
  return (
    <div style={{ background: BG1, border: "1px solid " + (done ? ACCENT + "30" : BORDER), borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {task.type === "binary" ? (
          <button onClick={() => onToggle(selDate, task.id, task.isHabit)} style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1, border: "2px solid " + (done ? ACCENT : BORDER), background: done ? ACCENT : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 11, fontWeight: 700 }}>
            {done ? "✓" : ""}
          </button>
        ) : (
          <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1, border: "2px solid " + (done ? ACCENT : BLUE), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? ACCENT : BLUE, opacity: pct > 0 ? 1 : 0.25 }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontSize: 13, lineHeight: 1.4, wordBreak: "break-word", color: done ? T3 : T1, textDecoration: done && task.type === "binary" ? "line-through" : "none" }}>
              {task.isHabit && (
                <span style={{ fontSize: 8, color: ACCENT, background: ACCENT + "15", border: "1px solid " + ACCENT + "33", borderRadius: 3, padding: "1px 5px", marginRight: 7, letterSpacing: "0.1em", verticalAlign: "middle" }}>HABIT</span>
              )}
              {task.title}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: done ? ACCENT : T3, fontWeight: done ? 700 : 400 }}>{pct}%</span>
              <button onClick={() => onDelete(selDate, task.id, task.isHabit)} style={{ background: "none", border: "none", color: T3, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 2px" }}>×</button>
            </div>
          </div>
          {task.type === "quantifiable" && (
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 3, background: BG3, borderRadius: 2, marginBottom: 8 }}>
                <div style={{ height: "100%", width: pct + "%", background: done ? ACCENT : BLUE, borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" min="0" step="0.5" value={task.progress || 0} onChange={e => onProgress(selDate, task.id, task.isHabit, e.target.value)}
                  style={{ width: 70, background: BG0, border: "1px solid " + BORDER, borderRadius: 5, color: T1, padding: "5px 8px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                <span style={{ fontSize: 11, color: T3 }}>/ {task.target} {task.unit}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: done ? ACCENT : BLUE, fontWeight: 700 }}>{pct}% COMPLETE</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddModal({ mode, selDate, onAdd, onClose }) {
  const [title, setTitle] = useState("");
  const [type,  setType]  = useState("binary");
  const [tgt,   setTgt]   = useState("");
  const [unit,  setUnit]  = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title, type, target: tgt, unit }, mode);
    onClose();
  };

  const selObj  = new Date(selDate + "T12:00:00");
  const heading = mode === "habit"
    ? "NEW CORE HABIT — REPEATS EVERY DAY"
    : "NEW TASK — " + selObj.toLocaleDateString("en-US", { month: "long", day: "numeric" }).toUpperCase();
  const iStyle  = { background: BG0, border: "1px solid " + BORDER, borderRadius: 6, color: T1, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: BG1, border: "1px solid " + BORDER, borderRadius: 14, padding: 28, width: 460, maxWidth: "92vw" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T2, marginBottom: 20 }}>{heading}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input autoFocus placeholder="Task title..." value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} style={iStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            {["binary","quantifiable"].map(t => (
              <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", border: "1px solid " + (type === t ? ACCENT : BORDER), background: type === t ? ACCENT + "15" : "transparent", color: type === t ? ACCENT : T3, fontSize: 10, letterSpacing: "0.1em", fontWeight: 600 }}>
                {t === "binary" ? "✓  CHECKLIST" : "◎  PROGRESS"}
              </button>
            ))}
          </div>
          {type === "quantifiable" && (
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="Target" value={tgt} onChange={e => setTgt(e.target.value)} style={{ ...iStyle, flex: 1, width: "auto" }} />
              <input placeholder="Unit (hrs, pages…)" value={unit} onChange={e => setUnit(e.target.value)} style={{ ...iStyle, flex: 2, width: "auto" }} />
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: "transparent", border: "1px solid " + BORDER, borderRadius: 6, color: T2, cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>CANCEL</button>
            <button onClick={submit} style={{ flex: 2, padding: "10px 0", background: ACCENT, border: "none", borderRadius: 6, color: "#000", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 11, letterSpacing: "0.08em" }}>
              ADD {mode === "habit" ? "HABIT" : "TASK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EodModal({ tasks, onMarkDone, onMigrate, onDelete, onDismiss }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: BG1, border: "1px solid " + BORDER, borderRadius: 14, padding: 28, width: 480, maxWidth: "92vw", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T2, marginBottom: 16 }}>END OF DAY — ACCOUNTABILITY CHECK</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 18, padding: "10px 14px", background: AMBER + "12", border: "1px solid " + AMBER + "33", borderRadius: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: AMBER, flexShrink: 0, marginTop: 4 }} />
          <span style={{ fontSize: 12, color: AMBER, lineHeight: 1.6 }}>
            The day is ending! You have <strong>{tasks.length}</strong> incomplete task{tasks.length !== 1 ? "s" : ""}. Resolve each below.
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map(task => {
            const pct = task.type === "binary" ? 0 : task.target > 0 ? Math.round(((task.progress || 0) / task.target) * 100) : 0;
            return (
              <div key={task.id} style={{ background: BG0, border: "1px solid " + BORDER, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    {task.isHabit && <span style={{ fontSize: 8, color: ACCENT, background: ACCENT + "15", border: "1px solid " + ACCENT + "33", borderRadius: 3, padding: "1px 5px", marginRight: 7, letterSpacing: "0.1em" }}>HABIT</span>}
                    <span style={{ fontSize: 13, color: T1 }}>{task.title}</span>
                  </div>
                  <span style={{ fontSize: 10, color: T3 }}>{pct}%</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onMarkDone(task.id)} style={{ flex: 1, padding: "6px 0", background: ACCENT + "15", border: "1px solid " + ACCENT + "44", borderRadius: 5, color: ACCENT, cursor: "pointer", fontSize: 9, fontFamily: "inherit", letterSpacing: "0.1em", fontWeight: 700 }}>MARK DONE</button>
                  {!task.isHabit && <button onClick={() => onMigrate(task.id)} style={{ flex: 1, padding: "6px 0", background: BLUE + "15", border: "1px solid " + BLUE + "44", borderRadius: 5, color: BLUE, cursor: "pointer", fontSize: 9, fontFamily: "inherit", letterSpacing: "0.1em", fontWeight: 700 }}>→ TOMORROW</button>}
                  <button onClick={() => onDelete(task.id, task.isHabit)} style={{ flex: 1, padding: "6px 0", background: RED + "10", border: "1px solid " + RED + "33", borderRadius: 5, color: RED, cursor: "pointer", fontSize: 9, fontFamily: "inherit", letterSpacing: "0.1em", fontWeight: 700 }}>DELETE</button>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onDismiss} style={{ marginTop: 14, width: "100%", padding: "10px 0", background: "transparent", border: "1px solid " + BORDER, borderRadius: 6, color: T2, cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>DISMISS</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks,    setTasks]    = useState(() => stor.get("pp_tasks",  {}));
  const [habits,   setHabits]   = useState(() => stor.get("pp_habits", []));
  const [habitLog, setHabitLog] = useState(() => stor.get("pp_hlog",   {}));
  const [selDate,  setSelDate]  = useState(todayKey);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [view,     setView]     = useState("planner");
  const [modal,    setModal]    = useState(null);
  const [eodList,  setEodList]  = useState([]);
  const eodFired = useRef(false);

  useEffect(() => stor.set("pp_tasks",  tasks),    [tasks]);
  useEffect(() => stor.set("pp_habits", habits),   [habits]);
  useEffect(() => stor.set("pp_hlog",   habitLog), [habitLog]);

  const getDayTasks = useCallback(dk => {
    const reg  = tasks[dk] || [];
    const habs = habits.map(h => {
      const log = (habitLog[dk] || {})[h.id] || {};
      return { ...h, isHabit: true, completed: log.completed || false, progress: log.progress || 0 };
    });
    return [...habs, ...reg];
  }, [tasks, habits, habitLog]);

  const openEOD = useCallback(() => {
    const inc = getDayTasks(todayKey()).filter(t => getCompPct(t) < 100);
    if (inc.length) { setEodList(inc); setModal("eod"); }
  }, [getDayTasks]);

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      if (n.getHours() === 21 && n.getMinutes() === 0 && !eodFired.current) {
        eodFired.current = true; openEOD();
      }
    }, 30000);
    return () => clearInterval(id);
  }, [openEOD]);

  const addItem = (form, mode) => {
    const item = { id: genId(), title: form.title.trim(), type: form.type, completed: false, target: Number(form.target) || 0, unit: form.unit, progress: 0 };
    if (mode === "habit") setHabits(h => [...h, { id: item.id, title: item.title, type: item.type, target: item.target, unit: item.unit }]);
    else setTasks(t => ({ ...t, [selDate]: [...(t[selDate] || []), item] }));
  };

  const toggleTask = (dk, id, isHabit) => {
    if (isHabit) setHabitLog(l => { const day = { ...(l[dk] || {}) }; const cur = day[id] || {}; day[id] = { ...cur, completed: !cur.completed }; return { ...l, [dk]: day }; });
    else setTasks(t => ({ ...t, [dk]: (t[dk] || []).map(x => x.id === id ? { ...x, completed: !x.completed } : x) }));
  };

  const updateProg = (dk, id, isHabit, val) => {
    const n = parseFloat(val) || 0;
    if (isHabit) setHabitLog(l => ({ ...l, [dk]: { ...(l[dk] || {}), [id]: { ...((l[dk] || {})[id] || {}), progress: n } } }));
    else setTasks(t => ({ ...t, [dk]: (t[dk] || []).map(x => x.id === id ? { ...x, progress: n } : x) }));
  };

  const deleteItem = useCallback((dk, id, isHabit) => {
    if (isHabit) {
      setHabits(h => h.filter(x => x.id !== id));
      setHabitLog(l => { const next = { ...l }; Object.keys(next).forEach(k => { if (next[k] && next[k][id]) { next[k] = { ...next[k] }; delete next[k][id]; } }); return next; });
    } else if (dk) {
      setTasks(t => ({ ...t, [dk]: (t[dk] || []).filter(x => x.id !== id) }));
    }
    setEodList(e => e.filter(x => x.id !== id));
  }, []);

  const eodMarkDone = id => {
    const dk = todayKey(); const task = eodList.find(x => x.id === id); if (!task) return;
    if (task.isHabit) setHabitLog(l => ({ ...l, [dk]: { ...(l[dk] || {}), [id]: { completed: true, progress: task.target } } }));
    else setTasks(t => ({ ...t, [dk]: (t[dk] || []).map(x => x.id === id ? { ...x, completed: true, progress: x.target } : x) }));
    setEodList(e => e.filter(x => x.id !== id));
  };

  const eodMigrate = id => {
    const task = eodList.find(x => x.id === id);
    if (!task || task.isHabit) return;
    const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
    const tk = fmtKey(tmr);
    setTasks(t => ({ ...t, [tk]: [...(t[tk] || []), { ...task, id: genId(), completed: false, progress: 0 }] }));
    setEodList(e => e.filter(x => x.id !== id));
  };

  const buildCal = () => {
    const { y, m } = calMonth;
    const first = new Date(y, m, 1).getDay();
    const days  = new Date(y, m + 1, 0).getDate();
    const mn    = new Date(y, m).toLocaleString("default", { month: "long" });
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= days; d++) {
      const dk = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const dt = getDayTasks(dk);
      cells.push({ d, dk, has: dt.length > 0, done: dt.length > 0 && dt.every(x => getCompPct(x) >= 100) });
    }
    return { mn, y, cells };
  };

  const buildInsights = () => {
    const now  = new Date();
    const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - (29 - i)); return fmtKey(d); });
    let done = 0, part = 0, none = 0, cur = 0;
    const bar = [];
    days.forEach(dk => {
      const all = getDayTasks(dk);
      if (!all.length) { cur = 0; return; }
      all.forEach(t => { const p = getCompPct(t); if (p >= 100) done++; else if (p > 0) part++; else none++; });
      const q = all.filter(t => t.type === "quantifiable");
      if (q.length) bar.push({ date: dk.slice(5).replace("-", "/"), avg: Math.round(q.map(getCompPct).reduce((a, b) => a + b, 0) / q.length) });
      const habs = all.filter(t => t.isHabit);
      if (habs.length && habs.every(t => getCompPct(t) >= 100)) cur++; else cur = 0;
    });
    const total = done + part + none;
    return { pie: [{ name: "Completed", v: done, c: ACCENT }, { name: "Partial", v: part, c: AMBER }, { name: "Ignored", v: none, c: BG3 }], bar: bar.slice(-14), streak: cur, rate: total ? Math.round((done / total) * 100) : 0, done, total };
  };

  const cal      = buildCal();
  const dayTasks = getDayTasks(selDate);
  const overallP = dayTasks.length ? Math.round(dayTasks.map(getCompPct).reduce((a, b) => a + b, 0) / dayTasks.length) : 0;
  const selObj   = new Date(selDate + "T12:00:00");
  const isToday  = selDate === todayKey();

  return (
    <div style={{ fontFamily: "'IBM Plex Mono','Courier New',monospace", background: BG0, color: T1, display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#080808}::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}input::placeholder{color:#444}button:focus{outline:none}`}</style>

      <header style={{ borderBottom: "1px solid " + BORDER, padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" fill={ACCENT} /><circle cx="8" cy="8" r="7" stroke={ACCENT} strokeWidth="0.8" strokeDasharray="2.5 1.5" /></svg>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", color: T1 }}>APEX PLANNER</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["planner","insights"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", border: "1px solid " + (view === v ? ACCENT : BORDER), background: view === v ? ACCENT + "18" : "transparent", color: view === v ? ACCENT : T3, fontSize: 10, letterSpacing: "0.14em", fontWeight: 600 }}>{v.toUpperCase()}</button>
          ))}
          <button onClick={openEOD} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", border: "1px solid " + BORDER, background: "transparent", color: T3, fontSize: 10, letterSpacing: "0.1em" }}>EOD TEST ↗</button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <aside style={{ width: 260, borderRight: "1px solid " + BORDER, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button onClick={() => setCalMonth(({ y, m }) => { const d = new Date(y, m - 1); return { y: d.getFullYear(), m: d.getMonth() }; })} style={{ background: "none", border: "none", color: T3, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>&#x2039;</button>
              <span style={{ fontSize: 10, letterSpacing: "0.16em", color: T2 }}>{cal.mn.toUpperCase()} {cal.y}</span>
              <button onClick={() => setCalMonth(({ y, m }) => { const d = new Date(y, m + 1); return { y: d.getFullYear(), m: d.getMonth() }; })} style={{ background: "none", border: "none", color: T3, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>&#x203A;</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
              {["S","M","T","W","T","F","S"].map((x, i) => <div key={i} style={{ textAlign: "center", fontSize: 9, color: T3, padding: "2px 0" }}>{x}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 18 }}>
              {cal.cells.map((c, i) => {
                if (!c) return <div key={"e" + i} />;
                const isSel = c.dk === selDate;
                const isTod = c.dk === todayKey();
                return <button key={c.dk} onClick={() => setSelDate(c.dk)} style={{ padding: "6px 0", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", background: isSel ? ACCENT : isTod ? ACCENT + "15" : "transparent", color: isSel ? "#000" : c.done ? ACCENT : c.has ? T2 : T3, fontSize: 11, fontWeight: isSel || isTod ? 700 : 400, outline: isTod && !isSel ? "1px solid " + ACCENT + "44" : "none" }}>{c.d}</button>;
              })}
            </div>
            <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: T3, letterSpacing: "0.12em", marginBottom: 3 }}>{isToday ? "TODAY" : selObj.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T1 }}>{selObj.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</div>
              <div style={{ fontSize: 10, color: T3, marginTop: 4 }}>{dayTasks.filter(t => getCompPct(t) >= 100).length}/{dayTasks.length} tasks done</div>
            </div>
          </div>

          <div style={{ padding: "0 16px 20px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT }} />
                <span style={{ fontSize: 9, letterSpacing: "0.18em", color: ACCENT, fontWeight: 700 }}>CORE HABITS</span>
              </div>
              <button onClick={() => setModal("habit")} style={{ background: "none", border: "1px solid " + BORDER, borderRadius: 4, color: T3, cursor: "pointer", width: 24, height: 24, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {habits.length === 0 && <p style={{ fontSize: 10, color: T3, fontStyle: "italic", lineHeight: 1.7 }}>No habits yet. Add one to auto-populate every day.</p>}
              {habits.map(h => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: BG1, borderRadius: 7, border: "1px solid " + BORDER }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, color: T2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</span>
                  {h.type === "quantifiable" && <span style={{ fontSize: 9, color: T3, flexShrink: 0 }}>{h.target}{h.unit}</span>}
                  <button onClick={() => deleteItem(null, h.id, true)} style={{ background: "none", border: "none", color: T3, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>&#xD7;</button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {view === "planner" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: "0.18em", color: T3, marginBottom: 6 }}>{isToday ? "TODAY — " : ""}{selObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: T1, letterSpacing: "-0.02em" }}>{selObj.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</div>
                </div>
                <button onClick={() => setModal("task")} style={{ padding: "10px 20px", background: ACCENT, border: "none", borderRadius: 8, color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", fontFamily: "inherit" }}>+ ADD TASK</button>
              </div>
              {dayTasks.length > 0 && (
                <div style={{ marginBottom: 26 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 9, letterSpacing: "0.12em", color: T3 }}>
                    <span>DAY PROGRESS</span>
                    <span style={{ color: overallP >= 100 ? ACCENT : T2 }}>{overallP}%</span>
                  </div>
                  <div style={{ height: 3, background: BG3, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: overallP + "%", background: overallP >= 100 ? ACCENT : BLUE, borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayTasks.length === 0 && (
                  <div style={{ textAlign: "center", padding: "80px 20px", color: T3 }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>&#x25C8;</div>
                    <div style={{ fontSize: 12 }}>No tasks for this day.</div>
                    <div style={{ fontSize: 10, marginTop: 6 }}>Click "Add Task" or create a Core Habit.</div>
                  </div>
                )}
                {dayTasks.map(task => (
                  <TaskCard key={task.id} task={task} selDate={selDate} onToggle={toggleTask} onProgress={updateProg} onDelete={deleteItem} />
                ))}
              </div>
            </>
          ) : (
            <Insights insights={buildInsights()} habits={habits} />
          )}
        </main>
      </div>

      {(modal === "task" || modal === "habit") && <AddModal mode={modal} selDate={selDate} onAdd={addItem} onClose={() => setModal(null)} />}
      {modal === "eod" && eodList.length > 0 && <EodModal tasks={eodList} onMarkDone={eodMarkDone} onMigrate={eodMigrate} onDelete={(id, isHabit) => deleteItem(todayKey(), id, isHabit)} onDismiss={() => setModal(null)} />}
    </div>
  );
}
