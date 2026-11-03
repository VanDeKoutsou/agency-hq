import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/utils';
import { Button, CategorySelect } from './ui';

export default function EditTaskModal({ task, isOpen, onClose, categories, tasks }) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(1);
  const [catId, setCatId] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isBacklog, setIsBacklog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Όταν ανοίγει το Modal, γεμίζουμε τα πεδία με τα τρέχοντα δεδομένα του επιλεγμένου task
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setTarget(task.target_count || 1);
      setCatId(task.category_id || null);
      setIsRecurring(task.is_recurring || false);
      setIsBacklog(task.is_backlog || false);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const newTarget = Math.max(1, Number(target) || 1);
    
    // Προστασία: Αν ο νέος στόχος είναι μικρότερος από την τρέχουσα πρόοδο, προσαρμόζουμε την πρόοδο.
    const newCurrentCount = Math.min(task.current_count, newTarget);
    
    // Ελέγχουμε αν η νέα αλλαγή ολοκληρώνει το task
    const completedAt = (newCurrentCount >= newTarget && task.completed_at === null)
        ? new Date().toISOString() 
        : (newCurrentCount < newTarget ? null : task.completed_at);

    const updates = {
      title: title.trim(),
      target_count: newTarget,
      current_count: newCurrentCount,
      category_id: catId,
      is_recurring: isRecurring,
      is_backlog: isBacklog,
      completed_at: completedAt
    };

    // 1. Ενημέρωση στη Βάση (Supabase)
    const { error } = await supabase
      .from('micro_tasks')
      .update(updates)
      .eq('id', task.id);

    setSaving(false);

    if (error) {
      notify(error.message);
    } else {
      // 2. Ενημέρωση τοπικού UI αμέσως
      tasks.upsert({ ...task, ...updates });
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-800">Επεξεργασία Task</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">Τίτλος</label>
            <input
              className="input w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <label className="mb-1.5 block text-sm font-medium text-navy-700">Στόχος</label>
              <input
                className="input w-full"
                type="number"
                min="1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-navy-700">Κατηγορία</label>
              <CategorySelect categories={categories} value={catId} onChange={setCatId} />
            </div>
          </div>

          <div className="flex gap-4 pt-3 border-t border-navy-50">
            <label className="flex cursor-pointer items-center space-x-2">
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-navy-200 text-sage-500 focus:ring-sage-500" />
              <span className="text-sm text-navy-700">Κάθε μέρα</span>
            </label>
            <label className="flex cursor-pointer items-center space-x-2">
              <input type="checkbox" checked={isBacklog} onChange={(e) => setIsBacklog(e.target.checked)} className="h-4 w-4 rounded border-navy-200 text-sand-500 focus:ring-sand-500" />
              <span className="text-sm text-navy-700">Για αργότερα</span>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <Button variant="soft" onClick={onClose} type="button">Ακύρωση</Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              <Save className="h-4 w-4" /> Αποθήκευση
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}