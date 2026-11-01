import confetti from 'canvas-confetti';

/* ----------------------------- Dates ----------------------------- */
const pad = (n) => String(n).padStart(2, '0');
export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const todayStr = () => toDateStr(new Date());
export const addDays = (s, n) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};
export const diffDays = (a, b) => {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
};
export const startOfWeek = (s) => {
  const wd = (parseDate(s).getDay() + 6) % 7; // Monday = 0
  return addDays(s, -wd);
};
export const isWeekend = (s) => {
  const wd = parseDate(s).getDay();
  return wd === 0 || wd === 6;
};
export const formatLong = (s) =>
  parseDate(s).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' });
export const formatShort = (s) =>
  parseDate(s).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Καλημέρα';
  if (h < 18) return 'Καλό απόγευμα';
  return 'Καλησπέρα';
}

/* ----------------------------- Math ------------------------------ */
export const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
export const pct = (cur, target) => (target > 0 ? clamp(Math.round((Number(cur) / Number(target)) * 100)) : 0);
export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

/* ----------------------------- Streak ---------------------------- */
export function computeStreak(tasks, today) {
  const map = {};
  tasks.forEach((t) => {
    const m = (map[t.task_date] ||= { n: 0, done: 0 });
    m.n += 1;
    if (t.current_count >= t.target_count) m.done += 1;
  });
  const isOk = (d) => map[d] && map[d].n > 0 && map[d].done === map[d].n;
  // Σαββατοκύριακο χωρίς tasks δεν σπάει το streak
  const isNeutral = (d) => !map[d] && isWeekend(d);

  let current = 0;
  let d = isOk(today) ? today : addDays(today, -1);
  for (let i = 0; i < 120; i++) {
    if (isOk(d)) current += 1;
    else if (!isNeutral(d)) break;
    d = addDays(d, -1);
  }

  const dates = Object.keys(map).sort();
  let best = 0;
  if (dates.length) {
    let run = 0;
    for (let x = dates[0]; x <= today; x = addDays(x, 1)) {
      if (isOk(x)) {
        run += 1;
        best = Math.max(best, run);
      } else if (isNeutral(x) || x === today) {
        continue;
      } else run = 0;
    }
  }
  return { current, best: Math.max(best, current), map, isOk };
}

/* ---------------------------- Confetti --------------------------- */
const COLORS = ['#5fa777', '#98c9aa', '#4b6a99', '#9fb2cf', '#d9b878', '#ebdfc8'];

export function fireConfetti(kind = 'big') {
  if (kind === 'small') {
    confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 }, colors: COLORS, scalar: 0.9 });
    return;
  }
  const end = Date.now() + 1400;
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: COLORS });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  confetti({ particleCount: 140, spread: 100, startVelocity: 45, origin: { y: 0.6 }, colors: COLORS });
  frame();
}

/* ----------------------------- Toasts ---------------------------- */
export const notify = (message, tone = 'error') =>
  window.dispatchEvent(new CustomEvent('hq:toast', { detail: { message, tone } }));
