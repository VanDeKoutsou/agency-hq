import { useMemo } from 'react';
import { CalendarClock, Flame, Gauge } from 'lucide-react';
import { addDays, computeStreak, diffDays, formatShort, startOfWeek, todayStr } from '../lib/utils';
import { AnimatedNumber, Card, cx } from './ui';

const DAY_LABELS = ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'];

export default function StatsRow({ tasks, leads, goals }) {
  const today = todayStr();
  const streak = useMemo(() => computeStreak(tasks, today), [tasks, today]);

  const week = useMemo(() => {
    const start = startOfWeek(today);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const perDay = days.map((d) => {
      const ts = tasks.filter((t) => t.task_date === d);
      const total = ts.reduce((s, t) => s + t.target_count, 0);
      const done = ts.reduce((s, t) => s + Math.min(t.current_count, t.target_count), 0);
      return { d, total, done, pct: total ? done / total : null, future: d > today };
    });
    const past = perDay.filter((x) => !x.future);
    const total = past.reduce((s, x) => s + x.total, 0);
    const done = past.reduce((s, x) => s + x.done, 0);
    const weekTasks = tasks.filter((t) => t.task_date >= start && t.task_date <= today);
    return {
      perDay,
      rate: total ? Math.round((done / total) * 100) : 0,
      hasData: total > 0,
      tasksDone: weekTasks.filter((t) => t.current_count >= t.target_count).length,
      tasksTotal: weekTasks.length,
      leads: leads.filter((l) => l.lead_date >= start).length,
    };
  }, [tasks, leads, today]);

  const next = useMemo(() => {
    const open = goals.filter((g) => Number(g.current_value) < Number(g.target_value));
    return open.sort((a, b) => (a.deadline > b.deadline ? 1 : -1))[0];
  }, [goals]);

  const todayInfo = streak.map[today];
  const todayDone = streak.isOk(today);
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {/* Streak */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-navy-400">Daily Accountability Streak</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight text-navy-800">
                <AnimatedNumber value={streak.current} />
              </span>
              <span className="text-sm text-navy-400">{streak.current === 1 ? 'μέρα' : 'μέρες'} στη σειρά</span>
            </p>
          </div>
          <span className={cx('grid h-10 w-10 place-items-center rounded-xl', streak.current > 0 ? 'bg-sand-100 text-sand-500' : 'bg-navy-50 text-navy-300')}>
            <Flame className={cx('h-5 w-5', streak.current > 0 && 'animate-flame')} />
          </span>
        </div>
        <div className="mt-4 flex gap-1.5">
          {last7.map((d) => {
            const ok = streak.isOk(d);
            return (
              <span
                key={d}
                title={d}
                className={cx(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  ok ? 'bg-sage-500' : d === today ? 'bg-navy-200' : 'bg-navy-50'
                )}
              />
            );
          })}
        </div>
        <p className="mt-3 text-xs text-navy-400">
          {todayDone
            ? 'Οι σημερινοί στόχοι πιάστηκαν. Το streak είναι ασφαλές.'
            : todayInfo
            ? `Σήμερα: ${todayInfo.done}/${todayInfo.n} tasks. Ολοκληρώστε τα για να συνεχίσει το streak.`
            : 'Προσθέστε tasks για σήμερα για να ξεκινήσει η μέρα.'}
          {streak.best > 0 && <span className="ml-1 text-navy-300">· Ρεκόρ: {streak.best}</span>}
        </p>
      </Card>

      {/* Agency Pulse */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-navy-400">Agency Pulse · αυτή την εβδομάδα</p>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-navy-800">
                {week.hasData ? <AnimatedNumber value={week.rate} /> : '–'}
              </span>
              {week.hasData && <span className="text-lg text-navy-400">%</span>}
              <span className="ml-1 text-sm text-navy-400">completion</span>
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-50 text-navy-600">
            <Gauge className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-4 flex h-12 items-end gap-1.5">
          {week.perDay.map((x, i) => (
            <div key={x.d} className="flex flex-1 flex-col items-center gap-1" title={x.pct == null ? 'Χωρίς tasks' : `${Math.round(x.pct * 100)}%`}>
              <div className="flex h-9 w-full items-end overflow-hidden rounded-md bg-navy-50">
                <div
                  className={cx('w-full rounded-md transition-all duration-700', x.pct === 1 ? 'bg-sage-500' : 'bg-navy-300')}
                  style={{ height: `${x.pct == null || x.future ? 0 : Math.max(8, x.pct * 100)}%` }}
                />
              </div>
              <span className={cx('text-[10px]', x.d === today ? 'font-semibold text-navy-700' : 'text-navy-300')}>{DAY_LABELS[i]}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-navy-400">
          {week.tasksDone}/{week.tasksTotal} tasks ολοκληρωμένα · {week.leads} leads
        </p>
      </Card>

      {/* Next deadline */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-navy-400">Επόμενο deadline</p>
            {next ? (
              <>
                <p className="mt-2 truncate text-lg font-semibold text-navy-800">{next.title}</p>
                <DeadlineLine deadline={next.deadline} />
              </>
            ) : (
              <p className="mt-2 text-sm text-navy-400">Δεν υπάρχουν ανοιχτοί macro στόχοι.</p>
            )}
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-600">
            <CalendarClock className="h-5 w-5" />
          </span>
        </div>
        {next && (
          <p className="mt-4 text-xs text-navy-400">
            Λήξη {formatShort(next.deadline)} · πρόοδος {Math.round((Number(next.current_value) / Number(next.target_value)) * 100)}%
          </p>
        )}
      </Card>
    </div>
  );
}

function DeadlineLine({ deadline }) {
  const left = diffDays(todayStr(), deadline);
  const overdue = left < 0;
  return (
    <p className="mt-1 flex items-baseline gap-1.5">
      <span className={cx('text-4xl font-semibold tracking-tight', overdue ? 'text-rose-500' : left <= 7 ? 'text-sand-500' : 'text-navy-800')}>
        {Math.abs(left)}
      </span>
      <span className="text-sm text-navy-400">{overdue ? 'μέρες καθυστέρηση' : left === 1 ? 'μέρα ακόμα' : 'μέρες ακόμα'}</span>
    </p>
  );
}
