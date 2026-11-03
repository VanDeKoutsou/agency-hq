import { X, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/utils';
import { CategoryBadge } from './ui';

export default function CompletedTasksModal({ isOpen, onClose, tasks, catMap, me, isAdmin }) {
  if (!isOpen) return null;

  // Φιλτράρουμε ΟΛΑ τα ολοκληρωμένα tasks (ανεξαρτήτως ημέρας)
  const completedTasks = tasks.rows.filter(t => t.completed_at !== null);

  async function del(task) {
    const { error } = await supabase.from('micro_tasks').delete().eq('id', task.id);
    if (error) {
      notify(error.message);
    } else {
      tasks.remove(task.id);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        
        {/* Header παραθύρου */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-800">
            <CheckCircle2 className="h-5 w-5 text-sage-500" />
            Ολοκληρωμένα Tasks
          </h2>
          <button 
            onClick={onClose} 
            className="rounded-full p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Λίστα Tasks */}
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {completedTasks.length === 0 ? (
            <p className="text-center text-sm text-navy-400 py-4">Δεν υπάρχουν ολοκληρωμένα tasks.</p>
          ) : (
            <ul className="space-y-2">
              {completedTasks.map(t => (
                <li key={t.id} className="group flex items-center justify-between gap-3 rounded-xl border border-navy-100 bg-navy-50/40 p-3 transition hover:border-navy-200">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-navy-600 line-through opacity-60 truncate">
                      {t.title}
                    </span>
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-navy-400">
                      <span>{t.task_date}</span>
                      {catMap && catMap[t.category_id] && (
                         <CategoryBadge category={catMap[t.category_id]} />
                      )}
                    </div>
                  </div>

                  {/* Κουμπί Διαγραφής (μόνο για admin ή δημιουργό) */}
                  {(isAdmin || t.created_by === me.id) && (
                    <button 
                      onClick={() => del(t)} 
                      className="rounded-lg p-1.5 text-navy-300 transition hover:bg-rose-50 hover:text-rose-500"
                      title="Οριστική διαγραφή από τη βάση"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        
      </div>
    </div>
  );
}