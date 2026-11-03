import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ListChecks, Minus, Plus, Trash2, History, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { addDays, fireConfetti, notify, todayStr } from '../lib/utils';
import { AnimatedNumber, Button, Card, CategoryBadge, CategorySelect, EmptyState, ProgressBar, SectionTitle, cx } from './ui';
import CompletedTasksModal from './CompletedTasksModal';
import EditTaskModal from './EditTaskModal'; // Προσθήκη του νέου Modal

export default function MicroGoals({ tasks, categories, catMap, profMap, filterCat, me, isAdmin }) {
  const today = todayStr();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(1);
  const [catId, setCatId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isBacklog, setIsBacklog] = useState(false);
  
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // Κρατάει το task που επεξεργαζόμαστε

  const allToday = useMemo(() => tasks.rows.filter((t) => t.task_date === today && !t.is_backlog), [tasks.rows, today]);
  const todays = useMemo(() => {
    return allToday
      .filter((t) => !filterCat || t.category_id === filterCat)
      .sort((a, b) => {
        const aDone = a.current_count >= a.target_count;
        const bDone = b.current_count >= b.target_count;
        
        if (aDone && !bDone) return 1;  // Αν το 'a' ολοκληρώθηκε, πάει στο τέλος
        if (!aDone && bDone) return -1; // Αν το 'b' ολοκληρώθηκε, το 'a' μένει ψηλά
        return 0; // Διαφορετικά διατηρούν την αρχική τους σειρά
      });
  }, [allToday, filterCat]);

  const totalTarget = allToday.reduce((s, t) => s + t.target_count, 0);
  const totalDone = allToday.reduce((s, t) => s + Math.min(t.current_count, t.target_count), 0);
  const dayPct = totalTarget ? Math.round((totalDone / totalTarget) * 100) : 0;
  const allComplete = allToday.length > 0 && allToday.every((t) => t.current_count >= t.target_count);

  const prev = useRef(null);
  useEffect(() => {
    if (tasks.loading) return;
    if (prev.current === false && allComplete) fireConfetti('big');
    prev.current = allComplete;
  }, [allComplete, tasks.loading]);

  const prevDay = useMemo(() => {
    const dates = [...new Set(tasks.rows.filter((t) => t.task_date < today).map((t) => t.task_date))].sort();
    return dates[dates.length - 1];
  }, [tasks.rows, today]);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    const { data, error } = await supabase
      .from('micro_tasks')
      .insert({ 
        title: title.trim(), 
        target_count: Math.max(1, Number(target) || 1), 
        category_id: catId ?? filterCat ?? null, 
        task_date: today,
        is_recurring: isRecurring,
        is_backlog: isBacklog
      })
      .select()
      .single();
    setAdding(false);
    if (error) return notify(error.message);
    tasks.upsert(data);
    setTitle('');
    setTarget(1);
    setIsRecurring(false);
    setIsBacklog(false);
  }

  async function copyYesterday() {
    const src = tasks.rows.filter((t) => t.task_date === prevDay);
    const { data, error } = await supabase
      .from('micro_tasks')
      .insert(src.map((t) => ({ title: t.title, target_count: t.target_count, category_id: t.category_id, task_date: today })))
      .select();
    if (error) return notify(error.message);
    tasks.upsert(data);
  }

  async function adjust(task, delta) {
    const next = Math.max(0, Math.min(task.target_count, task.current_count + delta));
    if (next === task.current_count) return;
    tasks.upsert({ ...task, current_count: next, last_updated_by: me.id, completed_at: next >= task.target_count ? new Date().toISOString() : null });
    const { data, error } = await supabase.rpc('adjust_task', { task_id: task.id, delta });
    if (error) {
      tasks.upsert(task);
      return notify(error.message);
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      tasks.upsert(row);
      if (row.current_count >= row.target_count && task.current_count < task.target_count) fireConfetti('small');
    }
  }

  const toggle = (task) =>
    adjust(task, task.current_count >= task.target_count ? -task.current_count : task.target_count - task.current_count);

  async function del(task) {
    const { error } = await supabase.from('micro_tasks').delete().eq('id', task.id);
    if (error) notify(error.message);
    else tasks.remove(task.id);
  }

  return (
    <section>
      <SectionTitle
        icon={ListChecks}
        title="Micro Goals · Σήμερα"
        hint="Κοινή λίστα ομάδας · μετράει η συνολική πρόοδος"
        action={
          <div className="flex items-center gap-4">
            <DayRing pct={dayPct} complete={allComplete} />
            <button 
              onClick={() => setIsCompletedModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 shadow-soft transition hover:border-sage-400 hover:text-sage-600"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Ολοκληρωμένα</span>
            </button>
          </div>
        }
      />

      <Card className="p-4 sm:p-5">
        <form onSubmit={addTask} className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Νέο task, π.χ. «Πραγματοποίηση 5 τηλεφωνημάτων»"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input w-20 text-center"
              type="number"
              min="1"
              max="999"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              title="Ποσοτικός στόχος"
            />
            <CategorySelect className="w-40" categories={categories} value={catId ?? filterCat} onChange={setCatId} />
            <label className="flex cursor-pointer items-center space-x-2 rounded-lg border border-navy-100 bg-navy-50/50 px-3 py-1.5 transition-colors hover:bg-navy-50">
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-navy-200 text-sage-500 focus:ring-sage-500" />
              <span className="text-sm text-navy-700">Κάθε μέρα</span>
            </label>
            <label className="flex cursor-pointer items-center space-x-2 rounded-lg border border-navy-100 bg-navy-50/50 px-3 py-1.5 transition-colors hover:bg-navy-50">
              <input type="checkbox" checked={isBacklog} onChange={(e) => setIsBacklog(e.target.checked)} className="h-4 w-4 rounded border-navy-200 text-sand-500 focus:ring-sand-500" />
              <span className="text-sm text-navy-700">Για αργότερα</span>
            </label>
            <Button type="submit" disabled={adding || !title.trim()}>
              <Plus className="h-4 w-4" /> Προσθήκη
            </Button>
          </div>
        </form>

        {todays.length === 0 ? (
          <EmptyState icon={ListChecks} title={filterCat ? 'Κανένα task σε αυτή την κατηγορία' : 'Δεν υπάρχουν tasks για σήμερα'} hint="Πρόσθεσε το πρώτο task ή ξεκίνα από τη χθεσινή λίστα." />
        ) : (
          <ul className="space-y-2">
            {todays.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                cat={catMap[t.category_id]}
                author={profMap[t.last_updated_by]?.full_name}
                canEdit={isAdmin || t.created_by === me.id}
                canDelete={isAdmin || t.created_by === me.id}
                onAdjust={adjust}
                onToggle={toggle}
                onDelete={del}
                onEdit={() => setEditingTask(t)} // Περνάμε τη συνάρτηση επεξεργασίας
              />
            ))}
          </ul>
        )}

        {allToday.length === 0 && prevDay && (
          <div className="mt-3 flex justify-center">
            <Button variant="soft" onClick={copyYesterday}>
              <Copy className="h-4 w-4" /> Αντιγραφή tasks της τελευταίας μέρας
            </Button>
          </div>
        )}
      </Card>

      <CompletedTasksModal 
        isOpen={isCompletedModalOpen} 
        onClose={() => setIsCompletedModalOpen(false)} 
        tasks={tasks} 
        catMap={catMap} 
        me={me} 
        isAdmin={isAdmin} 
      />

      {/* Το νέο Modal Επεξεργασίας */}
      <EditTaskModal 
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        categories={categories}
        tasks={tasks}
      />
    </section>
  );
}

function TaskRow({ task, cat, author, canEdit, canDelete, onAdjust, onToggle, onDelete, onEdit }) {
  const done = task.current_count >= task.target_count;
  const single = task.target_count === 1;
  const progress = Math.round((task.current_count / task.target_count) * 100);

  return (
    <li
      className={cx(
        'group flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-300',
        done ? 'border-sage-200 bg-sage-50/70' : 'border-navy-100 bg-white hover:border-navy-200 hover:shadow-soft'
      )}
    >
      <button
        onClick={() => onToggle(task)}
        className={cx(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-all duration-300',
          done ? 'border-sage-500 bg-sage-500 text-white' : 'border-navy-200 text-transparent hover:border-sage-400 hover:text-sage-300'
        )}
      >
        <Check className={cx('h-3.5 w-3.5', done && 'animate-pop')} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cx('text-sm font-medium transition-all duration-300', done ? 'text-navy-400 line-through decoration-sage-300' : 'text-navy-800')}>
            {task.title}
          </p>
          <CategoryBadge category={cat} />
        </div>
        {!single && <ProgressBar value={progress} tone={done ? 'sage' : 'navy'} height="h-1" className="mt-2" />}
        {author && <p className="mt-1 text-[11px] text-navy-300">Τελευταία ενημέρωση: {author}</p>}
      </div>

      {!single && (
        <div className="flex items-center gap-1.5 mr-2">
          <Button variant="soft" size="icon" onClick={() => onAdjust(task, -1)}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[3.2rem] text-center text-sm font-semibold tabular-nums text-navy-700">
            <AnimatedNumber value={task.current_count} duration={300} />
            <span className="font-normal text-navy-300">/{task.target_count}</span>
          </span>
          <Button variant={done ? 'sage' : 'soft'} size="icon" onClick={() => onAdjust(task, 1)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Κουμπιά Επεξεργασίας & Διαγραφής */}
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {canEdit && (
          <button
            onClick={() => onEdit(task)}
            className="rounded-lg p-1.5 text-navy-300 transition hover:bg-sage-50 hover:text-sage-600"
            title="Επεξεργασία"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(task)}
            className="rounded-lg p-1.5 text-navy-300 transition hover:bg-rose-50 hover:text-rose-500"
            title="Διαγραφή"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

function DayRing({ pct, complete }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-navy-400">{complete ? 'Όλα έτοιμα!' : 'Πρόοδος ημέρας'}</span>
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="4" className="stroke-navy-50" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className={cx('transition-all duration-700 ease-out', complete ? 'stroke-sage-500' : 'stroke-navy-600')}
        />
      </svg>
      <span className="-ml-[3.15rem] w-10 text-center text-[11px] font-semibold text-navy-700">{pct}%</span>
    </div>
  );
}