import { useMemo, useState } from 'react';
import { MessagesSquare, Send, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { addDays, formatLong, formatTime, notify, todayStr } from '../lib/utils';
import { Avatar, Button, Card, EmptyState, SectionTitle } from './ui';

export default function DailySync({ notes, profMap, me, isAdmin }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const today = todayStr();

  const groups = useMemo(() => {
    const g = {};
    notes.rows.forEach((n) => (g[n.note_date] ||= []).push(n));
    return Object.entries(g).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [notes.rows]);

  async function post(e) {
    e?.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from('sync_notes').insert({ content: text.trim(), note_date: today }).select().single();
    setBusy(false);
    if (error) return notify(error.message);
    notes.upsert(data);
    setText('');
  }

  async function del(n) {
    const { error } = await supabase.from('sync_notes').delete().eq('id', n.id);
    if (error) notify(error.message);
    else notes.remove(n.id);
  }

  const label = (d) => (d === today ? 'Σήμερα' : d === addDays(today, -1) ? 'Χθες' : formatLong(d));

  return (
    <section>
      <SectionTitle icon={MessagesSquare} title="Daily Sync" hint="Updates και σημειώσεις για την ομάδα · τελευταίες 7 μέρες" />
      <Card className="p-4 sm:p-5">
        <form onSubmit={post} className="mb-5">
          <textarea
            className="input min-h-[84px] resize-none"
            placeholder="Τι έκανες, τι μένει, τι χρειάζεσαι από τους άλλους; (Ctrl/⌘ + Enter για αποστολή)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && post(e)}
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={busy || !text.trim()}>
              <Send className="h-4 w-4" /> Ανάρτηση
            </Button>
          </div>
        </form>

        {groups.length === 0 ? (
          <EmptyState icon={MessagesSquare} title="Καμία σημείωση ακόμα" hint="Άφησε το πρώτο update για την ομάδα." />
        ) : (
          <div className="space-y-5">
            {groups.map(([date, list]) => (
              <div key={date}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide capitalize text-navy-300">{label(date)}</p>
                <ul className="space-y-2.5">
                  {list.map((n) => {
                    const author = profMap[n.created_by]?.full_name || 'Άγνωστος';
                    return (
                      <li key={n.id} className="group flex animate-fadeIn gap-3 rounded-xl bg-navy-50/50 p-3">
                        <Avatar name={author} size="h-8 w-8" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs">
                            <span className="font-semibold text-navy-700">{author}</span>
                            <span className="ml-2 text-navy-300">{formatTime(n.created_at)}</span>
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-navy-700">{n.content}</p>
                        </div>
                        {(isAdmin || n.created_by === me.id) && (
                          <button
                            onClick={() => del(n)}
                            className="self-start rounded-lg p-1.5 text-navy-300 transition hover:bg-rose-50 hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label="Διαγραφή"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
