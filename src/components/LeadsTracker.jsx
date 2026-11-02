import { useMemo, useState } from 'react';
import { Phone, PhoneCall, Plus, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fireConfetti, notify, todayStr } from '../lib/utils';
import { Button, Card, EmptyState, SectionTitle, cx } from './ui';

const STATUS = {
  new: { label: 'Νέο', cls: 'bg-navy-50 text-navy-600' },
  called: { label: 'Καλέσαμε', cls: 'bg-navy-100 text-navy-700' },
  follow_up: { label: 'Follow-up', cls: 'bg-sand-100 text-sand-500' },
  won: { label: 'Κερδήθηκε', cls: 'bg-sage-100 text-sage-700' },
  lost: { label: 'Χάθηκε', cls: 'bg-navy-50 text-navy-300' },
};
const OPEN = ['new', 'follow_up'];

export default function LeadsTracker({ leads, profMap, me, isAdmin }) {
  const today = todayStr();
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [busy, setBusy] = useState(false);

  const { todays, carry } = useMemo(
    () => ({
      todays: leads.rows.filter((l) => l.lead_date === today),
      carry: leads.rows.filter((l) => l.lead_date < today && OPEN.includes(l.status)),
    }),
    [leads.rows, today]
  );

  const calls = todays.filter((l) => l.status !== 'new').length;
  const won = todays.filter((l) => l.status === 'won').length;

  async function add(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('leads')
      .insert({ name: form.name.trim(), phone: form.phone.trim() || null, note: form.note.trim() || null, lead_date: today })
      .select()
      .single();
    setBusy(false);
    if (error) return notify(error.message);
    leads.upsert(data);
    setForm({ name: '', phone: '', note: '' });
  }

  async function setStatus(lead, status) {
    leads.upsert({ ...lead, status });
    const { error } = await supabase.from('leads').update({ status }).eq('id', lead.id);
    if (error) {
      leads.upsert(lead);
      notify(error.message);
    } else if (status === 'won') fireConfetti('small');
  }

  async function del(lead) {
    const { error } = await supabase.from('leads').delete().eq('id', lead.id);
    if (error) notify(error.message);
    else leads.remove(lead.id);
  }

  const row = (l) => (
    <LeadRow key={l.id} lead={l} author={profMap[l.created_by]?.full_name} canDelete={isAdmin || l.created_by === me.id} onStatus={setStatus} onDelete={del} />
  );

  return (
    <section className="lg:sticky lg:top-24">
      <SectionTitle icon={Users} title="Leads Tracker" hint="Ενεργά leads & calls της ημέρας" />
      <Card className="p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['Leads', todays.length],
            ['Calls', calls],
            ['Won', won],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-navy-50/70 py-2.5">
              <p className="text-xl font-semibold text-navy-800">{v}</p>
              <p className="text-[11px] text-navy-400">{k}</p>
            </div>
          ))}
        </div>

        <form onSubmit={add} className="mb-5 space-y-2">
          <input className="input" placeholder="Όνομα / επιχείρηση" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="input" placeholder="Τηλέφωνο" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input" placeholder="Σημείωση" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <Button type="submit" className="w-full justify-center" disabled={busy || !form.name.trim()}>
            <Plus className="h-4 w-4" /> Προσθήκη lead
          </Button>
        </form>

        {todays.length === 0 && carry.length === 0 ? (
          <EmptyState icon={PhoneCall} title="Κανένα lead ακόμα" hint="Πρόσθεσε το πρώτο call της ημέρας." />
        ) : (
          <>
            <ul className="space-y-2">{todays.map(row)}</ul>
            {carry.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy-300">Εκκρεμή από προηγούμενες μέρες</p>
                <ul className="space-y-2">{carry.map(row)}</ul>
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  );
}

function LeadRow({ lead, author, canDelete, onStatus, onDelete }) {
  const s = STATUS[lead.status];
  return (
    <li className="group animate-fadeIn rounded-xl border border-navy-100 bg-white p-3 transition-all hover:border-navy-200 hover:shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-navy-800">{lead.name}</p>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-800">
              <Phone className="h-3 w-3" /> {lead.phone}
            </a>
          )}
          {lead.note && <p className="mt-1 text-xs text-navy-400">{lead.note}</p>}
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(lead)}
            className="rounded-lg p-1 text-navy-300 transition hover:bg-rose-50 hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Διαγραφή"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <select
          value={lead.status}
          onChange={(e) => onStatus(lead, e.target.value)}
          className={cx('cursor-pointer rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold outline-none transition', s.cls)}
        >
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        {author && <span className="text-[11px] text-navy-300">{author.split(' ')[0]}</span>}
      </div>
    </li>
  );
}
