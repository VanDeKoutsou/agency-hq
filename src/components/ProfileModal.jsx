import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/utils';
import { Avatar, Button, Field, Modal } from './ui';

export default function ProfileModal({ open, onClose, me, profiles, isAdmin }) {
  const { user, updateProfile, signOut } = useAuth();
  const [name, setName] = useState(me.full_name || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setName(me.full_name || '');
  }, [open, me.full_name]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    const { error } = await updateProfile({ full_name: name.trim() });
    setBusy(false);
    if (error) notify(error.message);
    else notify('Το προφίλ ενημερώθηκε', 'success');
  }

  async function changeRole(p, role) {
    const { data, error } = await supabase.from('profiles').update({ role }).eq('id', p.id).select().single();
    if (error) notify(error.message);
    else profiles.upsert(data);
  }

  return (
    <Modal open={open} onClose={onClose} title="Προφίλ & ομάδα" width="max-w-lg">
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={me.full_name} size="h-12 w-12 text-sm" />
          <div>
            <p className="text-sm font-medium text-navy-800">{user?.email}</p>
            <p className="text-xs capitalize text-navy-400">Ρόλος: {me.role}</p>
          </div>
        </div>
        <Field label="Ονοματεπώνυμο">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={busy || !name.trim()}>
            Αποθήκευση
          </Button>
          <Button type="button" variant="ghost" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Αποσύνδεση
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-navy-100 pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">Μέλη ομάδας ({profiles.rows.length})</p>
        <ul className="space-y-2">
          {profiles.rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-navy-50/60 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={p.full_name} />
                <span className="truncate text-sm text-navy-700">{p.full_name}</span>
              </div>
              {isAdmin && p.id !== me.id ? (
                <select
                  value={p.role}
                  onChange={(e) => changeRole(p, e.target.value)}
                  className="rounded-lg border border-navy-100 bg-white px-2 py-1 text-xs text-navy-600 outline-none focus:border-navy-400"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <span className="text-xs capitalize text-navy-400">{p.role}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
