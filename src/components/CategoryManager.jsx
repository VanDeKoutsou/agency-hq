import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/utils';
import { Button, Modal, cx } from './ui';

const PALETTE = ['#5fa777', '#3b6ea5', '#c28b4a', '#8b7bb5', '#c4706b', '#4a9a9a', '#7a8794', '#b58ba3'];

export default function CategoryManager({ open, onClose, categories, me, isAdmin }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const { data, error } = await supabase.from('categories').insert({ name: name.trim(), color }).select().single();
    if (error) return notify(error.code === '23505' ? 'Υπάρχει ήδη κατηγορία με αυτό το όνομα.' : error.message);
    categories.upsert(data);
    setName('');
  }

  async function del(c) {
    if (!window.confirm(`Διαγραφή της κατηγορίας «${c.name}»; Οι στόχοι/tasks θα μείνουν χωρίς κατηγορία.`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) notify(error.message);
    else categories.remove(c.id);
  }

  return (
    <Modal open={open} onClose={onClose} title="Κατηγορίες project">
      <ul className="mb-5 space-y-2">
        {categories.rows.map((c) => (
          <li key={c.id} className="group flex items-center justify-between rounded-xl bg-navy-50/60 px-3 py-2.5">
            <span className="flex items-center gap-2.5 text-sm text-navy-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              {c.name}
            </span>
            {(isAdmin || c.created_by === me.id) && (
              <button onClick={() => del(c)} className="rounded-lg p-1.5 text-navy-300 transition hover:bg-rose-50 hover:text-rose-500" aria-label="Διαγραφή">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
        {!categories.rows.length && <p className="text-sm text-navy-400">Δεν υπάρχουν κατηγορίες ακόμα.</p>}
      </ul>

      <form onSubmit={add} className="space-y-3 border-t border-navy-100 pt-4">
        <input className="input" placeholder="Νέα κατηγορία (π.χ. Client Sites)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {PALETTE.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setColor(p)}
                aria-label={p}
                className={cx('h-6 w-6 rounded-full transition-all', color === p ? 'scale-110 ring-2 ring-navy-300 ring-offset-2' : 'hover:scale-110')}
                style={{ background: p }}
              />
            ))}
          </div>
          <Button type="submit" disabled={!name.trim()}>
            <Plus className="h-4 w-4" /> Προσθήκη
          </Button>
        </div>
      </form>
    </Modal>
  );
}
