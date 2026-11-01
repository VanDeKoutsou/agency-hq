# Agency HQ

Κεντρικό στρατηγείο στόχων, παραγωγικότητας και διαφάνειας για την ομάδα του agency.
React + Vite + Tailwind CSS + Supabase (Auth, Postgres, Realtime).

## Εγκατάσταση

1. **Supabase project**: φτιάξε ένα project στο https://supabase.com.
2. **Database**: SQL Editor → επικόλλησε και τρέξε ολόκληρο το `supabase/schema.sql`
   (πίνακες, RLS policies, realtime, trigger για profiles, αρχικές κατηγορίες).
3. **Auth**: Authentication → Providers → Email. Για πιο γρήγορο ξεκίνημα απενεργοποίησε προσωρινά το
   "Confirm email" (αλλιώς οι νέοι χρήστες πρέπει να επιβεβαιώσουν το email τους).
4. **Env**: αντίγραψε το `.env.example` σε `.env` και βάλε το Project URL και το anon key
   (Project Settings → API).
5. Τρέξε:

   ```bash
   npm install
   npm run dev
   ```

## Roles

- Ο **πρώτος** χρήστης που εγγράφεται γίνεται αυτόματα **Admin**, οι επόμενοι **Member**.
- Οι admins αλλάζουν ρόλους από Προφίλ → Μέλη ομάδας.
- Σήμερα: όλοι οι συνδεδεμένοι βλέπουν και ενημερώνουν τα κοινά δεδομένα. Διαγραφή επιτρέπεται στον δημιουργό
  ή σε Admin. Αν θέλεις αυστηρότερα permissions (π.χ. μόνο Admin δημιουργεί macro goals), άλλαξε τα policies
  στο `schema.sql` με `public.is_admin()`.

## Deploy

`npm run build` και ανέβασε το `dist/` σε Vercel / Netlify / Cloudflare Pages. Πρόσθεσε τα
`VITE_SUPABASE_URL` και `VITE_SUPABASE_ANON_KEY` ως environment variables του hosting.
Στο Supabase → Authentication → URL Configuration βάλε το domain σου στο Site URL.

## Δομή

```
supabase/schema.sql        πίνακες, RLS, realtime, triggers
src/context/AuthContext    session + profile
src/hooks/useTable.js      fetch + realtime sync ανά πίνακα
src/lib/utils.js           ημερομηνίες, streak, confetti
src/components/            Dashboard, MacroGoals, MicroGoals, StatsRow,
                           DailySync, LeadsTracker, CategoryManager, ProfileModal
```
