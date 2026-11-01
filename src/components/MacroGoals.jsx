import { useState } from 'react';
import { Minus, Pencil, Plus, Target, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { clamp, diffDays, fireConfetti, formatShort, notify, pct, todayStr } from '../lib/utils';
import { AnimatedNumber, Button, Card, CategoryBadge, CategorySelect, EmptyState, Field, Modal, ProgressBar, SectionTitle, cx } from './ui';

const blank = () => ({
  title: '',
  description: '',
  category_id: null,
  unit: '',
  target_value: 100,
  current_value: 0,
  step: 1,
  start_date: todayStr(),
  deadline: '',
});

export default function MacroGoals({ macro, categories, catMap, filterCat }) {
  const [editing, setEditing] = useState(null);

  const goals = macro.rows.filter((g) => !filterCat || g.category_id === filterCat);

  async function bump(g, dir) {
    const cur = Number(g.current_value);
    const next = clamp(cur + dir * Number(g.step), 0, Number(g.target_value));
    if (next === cur) return;
    macro.upsert({ ...g, current_value: next });
    const { error } = await supabase.from('macro_goals').update({ current_value: next }).eq('id', g.id);
    if (error) {
      macro.upsert(g);
      notify(error.message);
    } else if (next >= Number(g.target_value) && cur < Number(g.target_value)) {
      fireConfetti('big');
    }
  }

  async function del(g) {
    if (!window.confirm(`Διαγραφή του στόχου «${g.title}»;`)) return;
    const { error } = await supabase.from('macro_goals').delete().eq('id', g.id);
    if (error) notify(error.message);
    else macro.remove(g.id);
  }

  return (
    <section>
      <SectionTitle
        icon={Target}
        title="Macro Goals"
        hint="Μηνιαίοι και μακροπρόθεσμοι στόχοι με deadline"
        action={
          <Button onClick={() => setEditing(blank())}>
            <Plus className="h-4 w-4" /> Νέος στόχος
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="Δεν υπάρχουν macro στόχοι" hint="Πρόσθεσε τον πρώτο μηνιαίο στόχο της ομάδας." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g, i) => (
            <GoalCard key={g.id} goal={g} cat={catMap[g.category_id]} index={i} onBump={bump} onEdit={() => setEditing(g)} onDelete={() => del(g)} />
          ))}
        </div>
      )}

      <GoalModal editing={editing} onClose={() => setEditing(null)} categories={categories} macro={macro} />
    </section>
  );
}

function GoalCard({ goal: g, cat, index, onBump, onEdit, onDelete }) {
  const progress = pct(g.current_value, g.target_value);
  const done = Number(g.current_value) >= Number(g.target_value);
  const today = todayStr();
  const left = diffDays(today, g.deadline);
  const total = Math.max(1, diffDays(g.start_date, g.deadline));
  const elapsed = clamp(Math.round((diffDays(g.start_date, today) / total) * 100));
  const behind = !done && left >= 0 && progress < elapsed - 15;
  const overdue = !done && left < 0;

  let countdown;
  if (done) countdown = 'Ολοκληρώθηκε';
  else if (overdue) countdown = `Έληξε πριν ${Math.abs(left)} ${Math.abs(left) === 1 ? 'μέρα' : 'μέρες'}`;
  else if (left === 0) countdown = 'Λήγει σήμερα';
  else countdown = `${left} ${left === 1 ? 'μέρα' : 'μέρες'} ακόμα`;

  return (
    <Card
      className={cx('group animate-slideUp p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift', done && 'border-sage-200 bg-sage-50/40')}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CategoryBadge category={cat} />
          <h3 className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold leading-snug text-navy-800">
            {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-sage-500" />}
            <span className="truncate">{g.title}</span>
          </h3>
          {g.description && <p className="mt-1 line-clamp-2 text-xs text-navy-400">{g.description}</p>}
        </div>
        <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
          <button onClick={onEdit} className="rounded-lg p-1.5 text-navy-300 hover:bg-navy-50 hover:text-navy-700" aria-label="Επεξεργασία">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-navy-300 hover:bg-rose-50 hover:text-rose-500" aria-label="Διαγραφή">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm text-navy-700">
            <span className="text-xl font-semibold text-navy-800">
              <AnimatedNumber value={Math.round(Number(g.current_value))} />
            </span>
            <span className="text-navy-400">
              {' '}
              / {Number(g.target_value)} {g.unit}
            </span>
          </span>
          <span className={cx('text-sm font-semibold', done ? 'text-sage-600' : 'text-navy-600')}>{progress}%</span>
        </div>
        <ProgressBar value={progress} tone={done ? 'sage' : 'navy'} height="h-2.5" />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className={cx('font-medium', overdue ? 'text-rose-500' : left <= 7 && !done ? 'text-sand-500' : 'text-navy-500')}>{countdown}</span>
          <span className="text-navy-300">{formatShort(g.deadline)}</span>
        </div>
        <ProgressBar value={done ? 100 : elapsed} tone={done ? 'sage' : overdue ? 'sand' : 'sand'} height="h-1" className="opacity-80" />
        {behind && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-sand-500">
            <AlertTriangle className="h-3 w-3" /> Πίσω από τον ρυθμό του deadline
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-3">
        <span className="text-[11px] text-navy-300">Βήμα: {Number(g.step)}</span>
        <div className="flex items-center gap-1.5">
          <Button variant="soft" size="icon" onClick={() => onBump(g, -1)} aria-label="Μείωση">
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="soft" size="icon" onClick={() => onBump(g, 1)} aria-label="Αύξηση">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function GoalModal({ editing, onClose, categories, macro }) {
  const [form, setForm] = useState(blank());
  const [busy, setBusy] = useState(false);
  const [lastId, setLastId] = useState(null);

  // συγχρονισμός φόρμας όταν ανοίγει διαφορετικός στόχος
  const key = editing ? editing.id ?? 'new' : null;
  if (editing && key !== lastId) {
    setLastId(key);
    setForm({ ...blank(), ...editing, description: editing.description ?? '' });
  }
  if (!editing && lastId) setLastId(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (form.deadline < form.start_date) return notify('Το deadline πρέπει να είναι μετά την ημερομηνία έναρξης.');
    setBusy(true);
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      category_id: form.category_id,
      unit: form.unit.trim(),
      target_value: Number(form.target_value),
      current_value: Number(form.current_value),
      step: Number(form.step) || 1,
      start_date: form.start_date,
      deadline: form.deadline,
    };
    const q = editing.id
      ? supabase.from('macro_goals').update(payload).eq('id', editing.id)
      : supabase.from('macro_goals').insert(payload);
    const { data, error } = await q.select().single();
    setBusy(false);
    if (error) return notify(error.message);
    macro.upsert(data);
    onClose();
  }

  return (
    <Modal open={!!editing} onClose={onClose} title={editing?.id ? 'Επεξεργασία στόχου' : 'Νέος macro στόχος'} width="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Τίτλος">
          <input className="input" required value={form.title} onChange={set('title')} placeholder="π.χ. 10 νέοι πελάτες Νοεμβρίου" autoFocus />
        </Field>
        <Field label="Περιγραφή (προαιρετικά)">
          <textarea className="input min-h-[64px] resize-none" value={form.description} onChange={set('description')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Κατηγορία">
            <CategorySelect categories={categories} value={form.category_id} onChange={(v) => setForm((f) => ({ ...f, category_id: v }))} />
          </Field>
          <Field label="Μονάδα (π.χ. πελάτες, €)">
            <input className="input" value={form.unit} onChange={set('unit')} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Στόχος">
            <input className="input" type="number" min="1" step="any" required value={form.target_value} onChange={set('target_value')} />
          </Field>
          <Field label="Τρέχον">
            <input className="input" type="number" min="0" step="any" required value={form.current_value} onChange={set('current_value')} />
          </Field>
          <Field label="Βήμα +/−">
            <input className="input" type="number" min="0.01" step="any" required value={form.step} onChange={set('step')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Έναρξη">
            <input className="input" type="date" required value={form.start_date} onChange={set('start_date')} />
          </Field>
          <Field label="Deadline">
            <input className="input" type="date" required value={form.deadline} onChange={set('deadline')} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Ακύρωση
          </Button>
          <Button type="submit" disabled={busy}>
            {editing?.id ? 'Αποθήκευση' : 'Δημιουργία'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
