import { useEffect, useMemo, useState } from 'react';
import { Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isDemo } from '../lib/supabase';
import { DB_KEY, USER_KEY } from '../lib/mockSupabase';
import { useTable } from '../hooks/useTable';
import { addDays, formatLong, greeting, todayStr } from '../lib/utils';
import { Toaster, cx } from './ui';
import Header from './Header';
import StatsRow from './StatsRow';
import MacroGoals from './MacroGoals';
import MicroGoals from './MicroGoals';
import TaskBacklog from './TaskBacklog';
import DailySync from './DailySync';
import LeadsTracker from './LeadsTracker';
import ProfileModal from './ProfileModal';
import CategoryManager from './CategoryManager';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [filterCat, setFilterCat] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [live, setLive] = useState(false);

  const categories = useTable('categories', { order: 'name' });
  const profiles = useTable('profiles', { order: 'full_name' });
  const macro = useTable('macro_goals', { order: 'deadline' });

  const since90 = useMemo(() => addDays(todayStr(), -90), []);
  const since30 = useMemo(() => addDays(todayStr(), -30), []);
  const since7 = useMemo(() => addDays(todayStr(), -7), []);

  const tasks = useTable('micro_tasks', {
    order: 'created_at',
    filter: (q) => q.gte('task_date', since90),
    keep: (r) => r.task_date >= since90,
  });
  const notes = useTable('sync_notes', {
    order: 'created_at',
    ascending: false,
    filter: (q) => q.gte('note_date', since7),
    keep: (r) => r.note_date >= since7,
  });
  const leads = useTable('leads', {
    order: 'created_at',
    ascending: false,
    filter: (q) => q.gte('lead_date', since30),
    keep: (r) => r.lead_date >= since30,
  });

  // ένδειξη ζωντανής σύνδεσης
  useEffect(() => {
    const ch = supabase
      .channel('hq-status')
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));
    return () => supabase.removeChannel(ch);
  }, []);

  const catMap = useMemo(() => Object.fromEntries(categories.rows.map((c) => [c.id, c])), [categories.rows]);
  const profMap = useMemo(() => Object.fromEntries(profiles.rows.map((p) => [p.id, p])), [profiles.rows]);
  const me = profMap[user.id] ?? profile ?? { id: user.id, full_name: user.email, role: 'member' };
  const isAdmin = me.role === 'admin';
  const firstName = (me.full_name || '').split(' ')[0];

  return (
    <div className="min-h-screen">
      {isDemo && (
        <div className="flex items-center justify-center gap-3 bg-sand-100 px-4 py-2 text-xs text-sand-500">
          <span>Demo mode · τα δεδομένα αποθηκεύονται μόνο στον browser σου (χωρίς Supabase).</span>
          <button
            onClick={() => {
              localStorage.removeItem(DB_KEY);
              localStorage.removeItem(USER_KEY);
              window.location.reload();
            }}
            className="font-semibold underline underline-offset-2 hover:text-navy-800"
          >
            Επαναφορά δεδομένων
          </button>
        </div>
      )}
      <Header me={me} live={live} onProfile={() => setShowProfile(true)} />

      <main className="mx-auto max-w-7xl space-y-8 px-4 pt-6 pb-24 sm:px-6 sm:py-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-fadeIn">
            <p className="text-sm capitalize text-navy-400">{formatLong(todayStr())}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-800 sm:text-3xl">
              {greeting()}, {firstName} 👋
            </h1>
          </div>

          {/* Mobile-friendly Swipeable Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:pb-0" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex shrink-0 gap-1.5">
              <Chip active={!filterCat} onClick={() => setFilterCat(null)}>
                Όλα
              </Chip>
              {categories.rows.map((c) => (
                <Chip key={c.id} active={filterCat === c.id} onClick={() => setFilterCat(filterCat === c.id ? null : c.id)}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="whitespace-nowrap">{c.name}</span>
                </Chip>
              ))}
            </div>
            <button
              onClick={() => setShowCats(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
            >
              <Tag className="h-3.5 w-3.5" /> Κατηγορίες
            </button>
          </div>
        </section>

        <StatsRow tasks={tasks.rows} leads={leads.rows} goals={macro.rows} />

        <MacroGoals macro={macro} categories={categories.rows} catMap={catMap} filterCat={filterCat} />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <MicroGoals tasks={tasks} categories={categories.rows} catMap={catMap} profMap={profMap} filterCat={filterCat} me={me} isAdmin={isAdmin} />
            <TaskBacklog tasks={tasks} catMap={catMap} me={me} isAdmin={isAdmin} />
            <DailySync notes={notes} profMap={profMap} me={me} isAdmin={isAdmin} />
          </div>
          <aside>
            <LeadsTracker leads={leads} profMap={profMap} me={me} isAdmin={isAdmin} />
          </aside>
        </div>
      </main>

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} me={me} profiles={profiles} isAdmin={isAdmin} />
      <CategoryManager open={showCats} onClose={() => setShowCats(false)} categories={categories} me={me} isAdmin={isAdmin} />
      <Toaster />
    </div>
  );
}

function Chip({ active, children, ...rest }) {
  return (
    <button
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
        active ? 'border-navy-800 bg-navy-800 text-white shadow-soft' : 'border-navy-100 bg-white text-navy-600 hover:border-navy-200 hover:bg-navy-50'
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
