import { useMemo } from 'react';
import { ArrowUpCircle, Inbox, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { notify, todayStr } from '../lib/utils';
import { Card, SectionTitle, CategoryBadge } from './ui';

export default function TaskBacklog({ tasks, catMap, me, isAdmin }) {
  // Φιλτράρουμε ώστε να δείχνει ΜΟΝΟ τα tasks που είναι για το backlog
  const backlogTasks = useMemo(() => tasks.rows.filter(t => t.is_backlog), [tasks.rows]);

  async function moveToToday(task) {
    const today = todayStr();
    // 1. Άμεση ενημέρωση στο UI για να φαίνεται γρήγορο
    tasks.upsert({ ...task, is_backlog: false, task_date: today });
    
    // 2. Ενημέρωση στη Βάση Δεδομένων
    const { error } = await supabase
      .from('micro_tasks')
      .update({ is_backlog: false, task_date: today })
      .eq('id', task.id);
      
    if (error) {
      tasks.upsert(task); // επαναφορά αν χτυπήσει error
      notify(error.message);
    }
  }

  async function del(task) {
    const { error } = await supabase.from('micro_tasks').delete().eq('id', task.id);
    if (error) notify(error.message);
    else tasks.remove(task.id);
  }

  // Αν δεν υπάρχουν backlog tasks, δεν το εμφανίζουμε καθόλου (clean UI)
  if (backlogTasks.length === 0) return null;

  return (
    <section className="mt-8 animate-fadeIn">
      <SectionTitle icon={Inbox} title="Backlog" hint="Μικρά tasks για αργότερα · δεν μετράνε στο ημερήσιο σκορ" />
      <Card className="p-4 sm:p-5">
        <ul className="space-y-2">
          {backlogTasks.map(t => (
            <li key={t.id} className="group flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50/40 px-3.5 py-3 transition hover:border-navy-200">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-navy-600">{t.title}</p>
                  <CategoryBadge category={catMap[t.category_id]} />
                </div>
              </div>
              
              <button 
                onClick={() => moveToToday(t)} 
                className="flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 shadow-soft transition hover:border-sage-400 hover:text-sage-600"
              >
                <ArrowUpCircle className="h-4 w-4" /> 
                <span className="hidden sm:inline">Στο Σήμερα</span>
              </button>

              {(isAdmin || t.created_by === me.id) && (
                <button onClick={() => del(t)} className="rounded-lg p-1.5 text-navy-300 transition hover:bg-rose-50 hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}