import { useEffect, useMemo, useState } from 'react';
import { Tag, LayoutDashboard, Briefcase, TrendingUp, CreditCard, Wallet, Plus, X, Trash2, PieChart, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isDemo } from '../lib/supabase';
import { DB_KEY, USER_KEY } from '../lib/mockSupabase';
import { useTable } from '../hooks/useTable';
import { addDays, formatLong, greeting, todayStr, notify } from '../lib/utils';
import { Toaster, cx, Button } from './ui';
import Header from './Header';
import StatsRow from './StatsRow';
import MacroGoals from './MacroGoals';
import MicroGoals from './MicroGoals';
import TaskBacklog from './TaskBacklog';
import DailySync from './DailySync';
import LeadsTracker from './LeadsTracker';
import ProfileModal from './ProfileModal';
import CategoryManager from './CategoryManager';
import ClientHub from './ClientHub';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterCat, setFilterCat] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [live, setLive] = useState(false);

  const categories = useTable('categories', { order: 'name' });
  const profiles = useTable('profiles', { order: 'full_name' });
  const macro = useTable('macro_goals', { order: 'deadline' });
  const expenses = useTable('agency_expenses', { order: 'created_at' });

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
  });

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

  const recentLeads = useMemo(() => leads.rows.filter(l => l.lead_date >= since30), [leads.rows, since30]);

  // --- ΟΙΚΟΝΟΜΙΚΟΙ ΥΠΟΛΟΓΙΣΜΟΙ (MRR & NET) ---
  const wonClients = useMemo(() => leads.rows.filter(l => l.status === 'won'), [leads.rows]);
  const totalMRR = wonClients.reduce((sum, c) => sum + (Number(c.monthly_fee) || 0), 0);
  const totalClientCosts = wonClients.reduce((sum, c) => sum + (Number(c.monthly_cost) || 0), 0);
  const totalAgencyCosts = expenses.rows.filter(e => e.is_recurring).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpenses = totalClientCosts + totalAgencyCosts;
  const netProfit = totalMRR - totalExpenses;

  // --- ΝΕΟ: ΕΦΑΠΑΞ & CONVERSION ΥΠΟΛΟΓΙΣΜΟΙ ---
  const now = new Date();
  
  // Υπολογισμός Εφάπαξ Εσόδων του Τρέχοντα Μήνα
  const currentMonthOneOff = wonClients.filter(c => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, c) => sum + (Number(c.setup_fee) || 0) + (Number(c.extra_features_fee) || 0), 0);

  // Conversion Rate (Ποσοστό Κλεισίματος Τελευταίων 30 Ημερών)
  const leads30d = leads.rows.filter(l => l.lead_date >= since30);
  const wonLeads30d = leads30d.filter(l => l.status === 'won');
  const conversionRate = leads30d.length > 0 ? Math.round((wonLeads30d.length / leads30d.length) * 100) : 0;

  return (
    <div className="min-h-screen">
      {isDemo && (
        <div className="flex items-center justify-center gap-3 bg-sand-100 px-4 py-2 text-xs text-sand-500">
          <span>Demo mode · τα δεδομένα αποθηκεύονται μόνο στον browser σου.</span>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="font-semibold underline">Επαναφορά</button>
        </div>
      )}
      <Header me={me} live={live} onProfile={() => setShowProfile(true)} />

      <main className="mx-auto max-w-7xl space-y-8 px-4 pt-6 pb-24 sm:px-6 sm:py-8">
        
        {/* Header & Tabs */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-fadeIn">
            <p className="text-sm capitalize text-navy-400">{formatLong(todayStr())}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-800 sm:text-3xl">
              {greeting()}, {firstName} 👋
            </h1>
          </div>

          <div className="flex items-center rounded-xl bg-navy-50/70 p-1.5 shadow-sm border border-navy-100/50">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cx('flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200', activeTab === 'dashboard' ? 'bg-white text-navy-800 shadow-soft border border-navy-100' : 'text-navy-500 hover:text-navy-700 hover:bg-navy-50')}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={cx('flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200', activeTab === 'clients' ? 'bg-white text-navy-800 shadow-soft border border-navy-100' : 'text-navy-500 hover:text-navy-700 hover:bg-navy-50')}
            >
              <Briefcase className="h-4 w-4" /> Client Hub
            </button>
          </div>
        </section>

        {activeTab === 'dashboard' ? (
          <div className="animate-fadeIn space-y-8">
            
            {isAdmin && (
              <div className="space-y-4">
                <section className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-white border border-navy-100 p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-1">Συνολικο MRR</p>
                      <p className="text-2xl font-bold text-navy-800">€{totalMRR}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-sage-50 flex items-center justify-center text-sage-600"><TrendingUp className="h-5 w-5" /></div>
                  </div>
                  
                  <div className="rounded-2xl bg-white border border-navy-100 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-rose-200 transition-colors" onClick={() => setShowExpenses(true)} title="Κλικ για διαχείριση εξόδων">
                    <div>
                      <p className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-1">Μηνιαια Εξοδα</p>
                      <p className="text-2xl font-bold text-rose-600">€{totalExpenses}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500"><CreditCard className="h-5 w-5" /></div>
                  </div>

                  <div className="rounded-2xl bg-navy-800 text-white p-4 shadow-soft flex items-center justify-between lg:col-span-2">
                    <div>
                      <p className="text-xs font-bold text-navy-300 uppercase tracking-wider mb-1">Καθαρο Κερδος (Net)</p>
                      <p className="text-2xl font-bold">€{netProfit}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-navy-300">Πελάτες: €{totalClientCosts} cost</p>
                        <p className="text-[10px] text-navy-300">Agency: €{totalAgencyCosts} cost</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white"><Wallet className="h-5 w-5" /></div>
                    </div>
                  </div>
                </section>

                {/* --- ΝΕΟ: ΥΠΟ-ΠΙΝΑΚΑΣ ΕΦΑΠΑΞ & ΑΠΟΔΟΣΗΣ ΠΩΛΗΣΕΩΝ --- */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-navy-50/50 border border-navy-100 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-navy-600 border border-navy-100"><PieChart className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-bold text-navy-500 uppercase tracking-wider">Εφαπαξ Εσοδα Μηνα</p>
                        <p className="text-lg font-bold text-navy-800">€{currentMonthOneOff}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-navy-400 text-right">Χωρίς συνδρομές.<br/>Νέα projects & upsells.</p>
                  </div>
                  
                  <div className="rounded-xl bg-navy-50/50 border border-navy-100 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-sage-600 border border-navy-100"><Target className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-bold text-navy-500 uppercase tracking-wider">Ποσοστο Κλεισιματος</p>
                        <p className="text-lg font-bold text-sage-600">{conversionRate}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-navy-600 bg-white px-1.5 py-0.5 rounded shadow-sm inline-block">Τελευταίες 30 Μέρες</p>
                      <p className="text-[10px] font-medium text-navy-400 mt-1">{wonLeads30d.length} από {leads30d.length} Leads</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Categories Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:pb-0" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <div className="flex shrink-0 gap-1.5">
                <Chip active={!filterCat} onClick={() => setFilterCat(null)}>Όλα</Chip>
                {categories.rows.map((c) => (
                  <Chip key={c.id} active={filterCat === c.id} onClick={() => setFilterCat(filterCat === c.id ? null : c.id)}>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="whitespace-nowrap">{c.name}</span>
                  </Chip>
                ))}
              </div>
              <button onClick={() => setShowCats(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-navy-400 transition hover:bg-navy-50 hover:text-navy-700">
                <Tag className="h-3.5 w-3.5" /> Κατηγορίες
              </button>
            </div>

            <StatsRow tasks={tasks.rows} leads={recentLeads} goals={macro.rows} />
            <MacroGoals macro={macro} categories={categories.rows} catMap={catMap} filterCat={filterCat} />

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="space-y-8 lg:col-span-2">
                <MicroGoals tasks={tasks} categories={categories.rows} catMap={catMap} profMap={profMap} filterCat={filterCat} me={me} isAdmin={isAdmin} />
                <TaskBacklog tasks={tasks} catMap={catMap} me={me} isAdmin={isAdmin} />
                <DailySync notes={notes} profMap={profMap} me={me} isAdmin={isAdmin} />
              </div>
              <aside>
                <LeadsTracker leads={{...leads, rows: recentLeads}} profMap={profMap} me={me} isAdmin={isAdmin} />
              </aside>
            </div>
          </div>
        ) : (
          <ClientHub leads={leads} me={me} isAdmin={isAdmin} />
        )}
      </main>

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} me={me} profiles={profiles} isAdmin={isAdmin} />
      <CategoryManager open={showCats} onClose={() => setShowCats(false)} categories={categories} me={me} isAdmin={isAdmin} />
      <AgencyExpensesModal open={showExpenses} onClose={() => setShowExpenses(false)} expenses={expenses} />
      
      <Toaster />
    </div>
  );
}

function AgencyExpensesModal({ open, onClose, expenses }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function addExpense(e) {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('agency_expenses')
      .insert({ title: title.trim(), amount: Number(amount), is_recurring: true })
      .select()
      .single();
    setBusy(false);
    if (error) notify(error.message);
    else { expenses.upsert(data); setTitle(''); setAmount(''); }
  }

  async function delExpense(id) {
    expenses.remove(id);
    await supabase.from('agency_expenses').delete().eq('id', id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-800 flex items-center gap-2"><CreditCard className="h-5 w-5 text-rose-500"/> Γενικά Έξοδα Agency</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-navy-400 hover:bg-navy-50"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={addExpense} className="mb-5 flex gap-2">
          <input className="input flex-1" placeholder="π.χ. Figma, Λογιστής..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="number" className="input w-24" placeholder="Ποσό (€)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button type="submit" disabled={busy || !title.trim() || !amount}><Plus className="h-4 w-4" /></Button>
        </form>

        <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
          {expenses.rows.length === 0 ? (
            <p className="text-center text-sm text-navy-400 py-4">Δεν υπάρχουν καταγεγραμμένα έξοδα.</p>
          ) : (
            expenses.rows.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl border border-navy-100 bg-navy-50/30">
                <span className="text-sm font-medium text-navy-700">{exp.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-rose-600">€{exp.amount}/μήνα</span>
                  <button onClick={() => delExpense(exp.id)} className="text-navy-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
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