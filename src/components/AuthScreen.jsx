import { useState } from 'react';
import { Compass, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cx } from './ui';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(form.email, form.password);
        if (err) throw err;
      } else {
        const { data, error: err } = await signUp(form.email, form.password, form.name);
        if (err) throw err;
        if (!data.session) setInfo('Ο λογαριασμός δημιουργήθηκε. Έλεγξε το email σου για επιβεβαίωση και μετά συνδέσου.');
      }
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Λάθος email ή κωδικός.'
          : err.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-navy-800 text-white shadow-lift">
            <Compass className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-800">Agency HQ</h1>
          <p className="mt-1 text-sm text-navy-400">Στόχοι, παραγωγικότητα και διαφάνεια για την ομάδα.</p>
        </div>

        <div className="rounded-2xl border border-navy-100/70 bg-white p-6 shadow-soft">
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-navy-50 p-1 text-sm font-medium">
            {[
              ['login', 'Σύνδεση'],
              ['register', 'Εγγραφή'],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setMode(k);
                  setError('');
                  setInfo('');
                }}
                className={cx(
                  'rounded-lg py-2 transition-all',
                  mode === k ? 'bg-white text-navy-800 shadow-soft' : 'text-navy-400 hover:text-navy-600'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'register' && (
              <label className="block">
                <span className="label">Ονοματεπώνυμο</span>
                <input className="input" required value={form.name} onChange={set('name')} placeholder="π.χ. Γιώργος Παπαδόπουλος" />
              </label>
            )}
            <label className="block">
              <span className="label">Email</span>
              <input className="input" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="name@agency.gr" />
            </label>
            <label className="block">
              <span className="label">Κωδικός</span>
              <input
                className="input"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Τουλάχιστον 6 χαρακτήρες"
              />
            </label>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
            {info && <p className="rounded-lg bg-sage-50 px-3 py-2 text-xs text-sage-700">{info}</p>}

            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-navy-700 active:scale-[0.98] disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Σύνδεση' : 'Δημιουργία λογαριασμού'}
            </button>
          </form>
        </div>

        {mode === 'register' && (
          <p className="mt-4 text-center text-xs text-navy-400">Ο πρώτος χρήστης που εγγράφεται γίνεται αυτόματα Admin.</p>
        )}
      </div>
    </div>
  );
}
