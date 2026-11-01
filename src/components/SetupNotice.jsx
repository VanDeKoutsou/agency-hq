import { Database } from 'lucide-react';

export default function SetupNotice() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-navy-100/70 bg-white p-8 shadow-soft">
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-sand-100 text-sand-500">
          <Database className="h-5 w-5" />
        </span>
        <h1 className="text-lg font-semibold text-navy-800">Λείπει η σύνδεση με το Supabase</h1>
        <p className="mt-2 text-sm leading-relaxed text-navy-500">
          Δημιούργησε ένα αρχείο <code className="rounded bg-navy-50 px-1.5 py-0.5 text-xs">.env</code> στη ρίζα του project
          (αντίγραψε το <code className="rounded bg-navy-50 px-1.5 py-0.5 text-xs">.env.example</code>) και βάλε τα στοιχεία του project σου:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-navy-50 p-4 text-xs leading-relaxed text-navy-700">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="mt-4 text-sm text-navy-500">
          Μετά τρέξε το <code className="rounded bg-navy-50 px-1.5 py-0.5 text-xs">supabase/schema.sql</code> στο SQL Editor και κάνε restart το{' '}
          <code className="rounded bg-navy-50 px-1.5 py-0.5 text-xs">npm run dev</code>.
        </p>
      </div>
    </div>
  );
}
