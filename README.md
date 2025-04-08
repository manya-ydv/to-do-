# Daily Planner App 📋

A productivity web app I built to solve my own problem — I kept forgetting which tasks were half-done, and my habit tracking was scattered across sticky notes and phone reminders. So I decided to just build something that works exactly the way my brain does.

**Live Demo** → *(deploy to Vercel in 1 click — instructions below)*

---

## What it does

The app has five core features I personally needed:

**1. Two kinds of tasks**
Not everything is a yes/no checkbox. Some tasks are like "study for 5 hours" — you can't just tick that off at 2 hours. So I built two modes:
- **Checklist tasks** — plain checkbox, done or not done
- **Progress tasks** — you set a target + unit (e.g. `5 hours`), log what you actually did, and the app shows you a live percentage and progress bar

**2. Date-specific planning via calendar**
Click any date on the sidebar calendar to load or pre-plan that day. I can plan tomorrow's tasks tonight without touching today's list.

**3. Daily habits that auto-populate**
I got tired of adding "Morning walk" and "Read 20 pages" every single day. Added a **Core Habits** section — anything I add there appears automatically on every day's list. Each day tracks its own completion state independently.

**4. End-of-day accountability modal**
At 9 PM the app pops up a modal listing everything I didn't finish. For each task I can:
- Mark it done
- Push it to tomorrow
- Delete it

There's also an "EOD TEST" button to trigger this manually anytime.

**5. Monthly Insights dashboard**
At the end of the month (or anytime really), I can switch to the Insights tab and see:
- A donut chart: completed vs partially done vs ignored tasks
- A bar chart: average completion % on progress-based tasks over the last 14 days
- Consecutive-day streak counter for habits
- Overall completion rate

---

## Tech Stack

| | |
|---|---|
| **Framework** | React 18 |
| **Build tool** | Vite 5 |
| **Charts** | Recharts 2 |
| **Storage** | localStorage — no backend, no database, works offline |
| **Font** | IBM Plex Mono |
| **Hosting** | Vercel (free) |

Zero external UI libraries. All styling is plain CSS-in-JS with a consistent dark-mode design system I wrote manually.

---

## How the habit system works (the interesting bit)

I didn't want to copy habit data into each day — that would mean a nightmare if I ever renamed or deleted a habit. Instead I used a **merge pattern**:

```
Storage:
  pp_habits  →  [{ id, title, type, target, unit }]   ← master list
  pp_hlog    →  { "2025-04-09": { habitId: { completed, progress } } }

On render:
  getDayTasks(date) = habits.map(h => { ...h, ...habitLog[date][h.id] })
                    + tasks[date]
```

Habits are definitions. The log just stores what you actually did per day. This means:
- Add a habit → instantly shows on every past and future date
- Delete a habit → gone everywhere at once
- Change a habit → updates everywhere

---

## Run it locally

```bash
git clone https://github.com/manya-ydv/to-do-.git
cd to-do-
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy to Vercel (free, 30 seconds)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"** → import `manya-ydv/to-do-`
3. Vercel auto-detects Vite → click **Deploy**
4. Done. You get a live URL.

---

## Folder structure

```
to-do-/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx        # entry point
│   └── App.jsx         # full app — components + state + logic
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

The whole app is in one file (`App.jsx`) intentionally — it's a personal tool and I wanted to be able to read the entire thing without jumping between files.

---

## Things I'd add next

- [ ] Export monthly report as PDF
- [ ] Task priority levels (P1 / P2 / P3)
- [ ] Dark/light mode toggle
- [ ] Weekly view in addition to daily
- [ ] Data sync across devices (would need a backend)

---

## License

MIT — use it, fork it, build on it.
