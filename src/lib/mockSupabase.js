// Demo mode: μιμείται το υποσύνολο του Supabase API που χρησιμοποιεί η εφαρμογή.
// Τα δεδομένα αποθηκεύονται στο localStorage του browser (χωρίς backend).
import { addDays, todayStr } from './utils';

export const DB_KEY = 'hq-demo-db-v1';
export const USER_KEY = 'hq-demo-user';

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}${Date.now()}`;

const U1 = '00000000-0000-4000-8000-000000000001';
const U2 = '00000000-0000-4000-8000-000000000002';
const U3 = '00000000-0000-4000-8000-000000000003';

const at = (h, m, dayOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

function seed() {
  const today = todayStr();
  const cat = {
    scan: uid(),
    client: uid(),
    mkt: uid(),
  };
  const db = {
    categories: [
      { id: cat.scan, name: 'ScanEat', color: '#5fa777', created_by: U1, created_at: at(9, 0, -30) },
      { id: cat.client, name: 'Client Sites', color: '#3b6ea5', created_by: U1, created_at: at(9, 1, -30) },
      { id: cat.mkt, name: 'Marketing / Internal', color: '#c28b4a', created_by: U1, created_at: at(9, 2, -30) },
    ],
    profiles: [
      { id: U1, full_name: 'Γιώργος Παπαδόπουλος', role: 'admin', email: 'giorgos@agency.gr', created_at: at(9, 0, -30) },
      { id: U2, full_name: 'Μαρία Κωνσταντίνου', role: 'member', email: 'maria@agency.gr', created_at: at(9, 0, -29) },
      { id: U3, full_name: 'Νίκος Αντωνίου', role: 'member', email: 'nikos@agency.gr', created_at: at(9, 0, -28) },
    ],
    macro_goals: [
      {
        id: uid(), title: '10 νέοι πελάτες Νοεμβρίου', description: 'Νέα συμβόλαια για websites και συντήρηση.',
        category_id: cat.client, unit: 'πελάτες', target_value: 10, current_value: 4, step: 1,
        start_date: addDays(today, -10), deadline: addDays(today, 20), created_by: U1, created_at: at(9, 5, -10),
      },
      {
        id: uid(), title: 'ScanEat: 50 εστιατόρια onboarded', description: null,
        category_id: cat.scan, unit: 'εστιατόρια', target_value: 50, current_value: 24, step: 1,
        start_date: addDays(today, -40), deadline: addDays(today, 15), created_by: U1, created_at: at(9, 6, -40),
      },
      {
        id: uid(), title: 'Social reach 20.000', description: 'Συνολικές εμφανίσεις Instagram + LinkedIn.',
        category_id: cat.mkt, unit: 'εμφανίσεις', target_value: 20000, current_value: 14200, step: 500,
        start_date: addDays(today, -20), deadline: addDays(today, 10), created_by: U2, created_at: at(9, 7, -20),
      },
      {
        id: uid(), title: 'Launch νέου site του agency', description: null,
        category_id: cat.mkt, unit: '%', target_value: 100, current_value: 100, step: 10,
        start_date: addDays(today, -30), deadline: addDays(today, -2), created_by: U1, created_at: at(9, 8, -30),
      },
    ],
    micro_tasks: [],
    sync_notes: [
      { id: uid(), content: 'Ολοκλήρωσα το mockup για το site του πελάτη. Περιμένω feedback πριν προχωρήσω σε development.', note_date: today, created_by: U2, created_at: at(10, 15) },
      { id: uid(), content: 'Έκλεισα 2 ραντεβού για την Τρίτη. Χρειάζομαι το νέο pricing sheet από τον Γιώργο.', note_date: today, created_by: U3, created_at: at(11, 40) },
      { id: uid(), content: 'Στείλαμε 3 προσφορές χθες. Follow-up σε όλους τη Δευτέρα.', note_date: addDays(today, -1), created_by: U1, created_at: at(17, 30, -1) },
    ],
    leads: [
      { id: uid(), name: 'Taverna Μακεδονία', phone: '2310000001', note: 'Θέλουν QR menu + site', status: 'called', lead_date: today, created_by: U3, created_at: at(10, 5) },
      { id: uid(), name: 'Beauty Studio Ελένη', phone: '6900000002', note: 'Ήρθε από Instagram', status: 'new', lead_date: today, created_by: U2, created_at: at(10, 50) },
      { id: uid(), name: 'Café Πλατεία', phone: '2310000003', note: 'Να ξαναπάρουμε μετά τις 5', status: 'follow_up', lead_date: today, created_by: U3, created_at: at(11, 20) },
      { id: uid(), name: 'Gym FitZone', phone: '6900000004', note: 'Υπέγραψαν πακέτο ScanEat', status: 'won', lead_date: today, created_by: U1, created_at: at(12, 0) },
      { id: uid(), name: 'Οδοντιατρείο Παπαδάκη', phone: '2310000005', note: 'Περιμένουν προσφορά', status: 'follow_up', lead_date: addDays(today, -1), created_by: U1, created_at: at(16, 0, -1) },
    ],
  };

  // Ιστορικό: 5 συνεχόμενες μέρες ολοκληρωμένες (streak), μία αποτυχημένη, μετά άλλες 2 καλές
  const templates = [
    ['Πραγματοποίηση 5 τηλεφωνημάτων', 5, cat.scan],
    ['Ανέβασμα 2 posts στο Instagram', 2, cat.mkt],
    ['Εργασία σε site πελάτη', 1, cat.client],
  ];
  for (let off = -1; off >= -8; off--) {
    const d = addDays(today, off);
    templates.forEach(([title, target, category_id], i) => {
      const missed = off === -6 && i === 0;
      db.micro_tasks.push({
        id: uid(), title, category_id, target_count: target, current_count: missed ? target - 2 : target,
        task_date: d, completed_at: missed ? null : at(17, 0, off), last_updated_by: [U1, U2, U3][i % 3],
        created_by: U1, created_at: at(9, 10 + i, off),
      });
    });
  }
  // Σήμερα: μερική πρόοδος
  [
    ['Πραγματοποίηση 5 τηλεφωνημάτων', 5, 3, cat.scan, U3],
    ['Ανέβασμα 2 posts στο Instagram', 2, 1, cat.mkt, U2],
    ['Εργασία σε site πελάτη', 1, 0, cat.client, null],
    ['Αποστολή προσφοράς στο Café Πλατεία', 1, 1, cat.client, U1],
  ].forEach(([title, target, cur, category_id, by], i) => {
    db.micro_tasks.push({
      id: uid(), title, category_id, target_count: target, current_count: cur,
      task_date: today, completed_at: cur >= target ? at(11, 0) : null, last_updated_by: by,
      created_by: U1, created_at: at(9, 10 + i),
    });
  });
  return db;
}

const DEFAULTS = {
  categories: () => ({ color: '#3b6ea5' }),
  profiles: () => ({}),
  macro_goals: () => ({ description: null, category_id: null, unit: '', target_value: 100, current_value: 0, step: 1, start_date: todayStr() }),
  micro_tasks: () => ({ category_id: null, target_count: 1, current_count: 0, task_date: todayStr(), completed_at: null, last_updated_by: null }),
  sync_notes: () => ({ note_date: todayStr() }),
  leads: () => ({ phone: null, note: null, status: 'new', lead_date: todayStr() }),
};

export function createMockClient() {
  let db;
  try {
    db = JSON.parse(localStorage.getItem(DB_KEY));
  } catch {
    db = null;
  }
  if (!db) {
    db = seed();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    localStorage.setItem(USER_KEY, U1); // άμεση είσοδος στο πρώτο άνοιγμα
  }

  const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
  const listeners = new Set();
  const authListeners = new Set();

  const emit = (table, eventType, row) =>
    setTimeout(() => listeners.forEach((l) => l.table === table && l.cb({ eventType, new: row, old: { id: row.id } })), 0);

  const currentUser = () => {
    const id = localStorage.getItem(USER_KEY);
    const p = id && db.profiles.find((x) => x.id === id);
    return p ? { id: p.id, email: p.email } : null;
  };
  const sessionOf = (u) => (u ? { user: u } : null);
  const fireAuth = () => authListeners.forEach((cb) => cb('SIGNED_IN', sessionOf(currentUser())));

  class Query {
    constructor(table) {
      this.table = table;
      this.op = 'select';
      this.filters = [];
      this.ord = null;
      this.payload = null;
      this.mode = null;
      this.ret = false;
    }
    select() {
      if (this.op !== 'select') this.ret = true;
      return this;
    }
    insert(p) { this.op = 'insert'; this.payload = p; return this; }
    update(p) { this.op = 'update'; this.payload = p; return this; }
    delete() { this.op = 'delete'; return this; }
    eq(k, v) { this.filters.push((r) => r[k] === v); return this; }
    gte(k, v) { this.filters.push((r) => r[k] >= v); return this; }
    order(k, { ascending = true } = {}) { this.ord = { k, ascending }; return this; }
    single() { this.mode = 'single'; return this; }
    maybeSingle() { this.mode = 'maybe'; return this; }
    then(res, rej) { return Promise.resolve().then(() => this.run()).then(res, rej); }

    finish(out) {
      if (this.mode === 'single') {
        return out.length
          ? { data: out[0], error: null }
          : { data: null, error: { code: 'PGRST116', message: 'Δεν βρέθηκε εγγραφή' } };
      }
      if (this.mode === 'maybe') return { data: out[0] ?? null, error: null };
      return { data: out, error: null };
    }

    run() {
      const { table } = this;
      if (!db[table]) return { data: null, error: { message: `Άγνωστος πίνακας: ${table}` } };
      const rows = db[table];
      const match = (r) => this.filters.every((f) => f(r));

      if (this.op === 'select') {
        let out = rows.filter(match).map((r) => ({ ...r }));
        if (this.ord) {
          const { k, ascending } = this.ord;
          out.sort((a, b) => (a[k] === b[k] ? 0 : (a[k] > b[k] ? 1 : -1) * (ascending ? 1 : -1)));
        }
        return this.finish(out);
      }

      if (this.op === 'insert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const created = [];
        for (const it of items) {
          if (table === 'categories' && rows.some((r) => r.name === it.name)) {
            return { data: null, error: { code: '23505', message: 'duplicate key' } };
          }
          const row = {
            id: uid(),
            created_at: new Date().toISOString(),
            created_by: currentUser()?.id ?? null,
            ...DEFAULTS[table](),
            ...it,
          };
          rows.push(row);
          created.push(row);
        }
        save();
        created.forEach((r) => emit(table, 'INSERT', r));
        return this.ret ? this.finish(created.map((r) => ({ ...r }))) : { data: null, error: null };
      }

      if (this.op === 'update') {
        const targets = rows.filter(match);
        targets.forEach((r) => Object.assign(r, this.payload));
        save();
        targets.forEach((r) => emit(table, 'UPDATE', r));
        return this.ret ? this.finish(targets.map((r) => ({ ...r }))) : { data: null, error: null };
      }

      // delete
      const removed = rows.filter(match);
      db[table] = rows.filter((r) => !match(r));
      save();
      removed.forEach((r) => emit(table, 'DELETE', r));
      return { data: null, error: null };
    }
  }

  return {
    from: (table) => new Query(table),

    rpc: (fn, args) =>
      Promise.resolve().then(() => {
        if (fn !== 'adjust_task') return { data: null, error: { message: `Άγνωστη συνάρτηση: ${fn}` } };
        const t = db.micro_tasks.find((x) => x.id === args.task_id);
        if (!t) return { data: null, error: { message: 'Το task δεν βρέθηκε' } };
        const next = Math.max(0, Math.min(t.target_count, t.current_count + args.delta));
        t.current_count = next;
        t.completed_at = next >= t.target_count ? t.completed_at || new Date().toISOString() : null;
        t.last_updated_by = currentUser()?.id ?? null;
        save();
        emit('micro_tasks', 'UPDATE', t);
        return { data: { ...t }, error: null };
      }),

    channel: () => {
      const ch = {
        regs: [],
        on(_type, filter, cb) {
          ch.regs.push({ table: filter.table, cb });
          return ch;
        },
        subscribe(cb) {
          ch.regs.forEach((r) => listeners.add(r));
          if (cb) setTimeout(() => cb('SUBSCRIBED'), 0);
          return ch;
        },
      };
      return ch;
    },
    removeChannel: (ch) => {
      ch.regs?.forEach((r) => listeners.delete(r));
    },

    auth: {
      getSession: async () => ({ data: { session: sessionOf(currentUser()) } }),
      onAuthStateChange: (cb) => {
        authListeners.add(cb);
        return { data: { subscription: { unsubscribe: () => authListeners.delete(cb) } } };
      },
      signInWithPassword: async () => {
        localStorage.setItem(USER_KEY, U1);
        fireAuth();
        return { data: { session: sessionOf(currentUser()) }, error: null };
      },
      signUp: async (creds) => {
        const name = creds?.options?.data?.full_name || creds.email.split('@')[0];
        const p = { id: uid(), full_name: name, role: 'member', email: creds.email, created_at: new Date().toISOString() };
        db.profiles.push(p);
        save();
        emit('profiles', 'INSERT', p);
        localStorage.setItem(USER_KEY, p.id);
        fireAuth();
        return { data: { session: sessionOf(currentUser()) }, error: null };
      },
      signOut: async () => {
        localStorage.removeItem(USER_KEY);
        authListeners.forEach((cb) => cb('SIGNED_OUT', null));
        return { error: null };
      },
    },
  };
}
