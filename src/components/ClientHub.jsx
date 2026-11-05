import { useMemo, useState, useEffect } from 'react';
import { ExternalLink, CheckSquare, Briefcase, Plus, MessageSquare, Trash2, Calendar, Square, CheckSquare as CheckIcon, User, CreditCard, TrendingUp, AlertCircle, Package, PieChart, Tag, ArrowDownRight, ArrowUpRight, Clock, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { notify, todayStr } from '../lib/utils';
import { Button, Card, EmptyState, SectionTitle, cx, Avatar } from './ui';

const REQ_CATEGORIES = ['Γενικά', 'Τεχνικό / Bug', 'Περιεχόμενο', 'Νέο Feature', 'Γραφιστικά / UI'];

export default function ClientHub({ leads, me, isAdmin }) {
  const clients = useMemo(() => leads.rows.filter(l => l.status === 'won'), [leads.rows]);
  const [activeClientId, setActiveClientId] = useState(null);

  const activeClient = useMemo(() => {
    if (activeClientId) return clients.find(c => c.id === activeClientId);
    return clients.length > 0 ? clients[0] : null;
  }, [clients, activeClientId]);

  if (clients.length === 0) {
    return <EmptyState icon={Briefcase} title="Κανένας Ενεργός Πελάτης" hint="Τα leads που μαρκάρονται ως 'Κερδήθηκε' θα εμφανιστούν αυτόματα εδώ." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4 animate-fadeIn">
      <div className="lg:col-span-1 space-y-4">
        <SectionTitle icon={Briefcase} title="Πελάτες" hint={`${clients.length} Ενεργοί`} />
        <div className="flex flex-col gap-2">
          {clients.map(client => {
            const hasDebt = client.debt_months > 0;
            return (
              <button
                key={client.id}
                onClick={() => setActiveClientId(client.id)}
                className={cx(
                  'flex items-center justify-between gap-3 rounded-xl p-3 text-left transition-all duration-200 border',
                  activeClient?.id === client.id ? 'bg-white border-navy-200 shadow-soft ring-1 ring-navy-100' : 'bg-navy-50/50 border-transparent hover:bg-white hover:border-navy-100'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={client.name} size="h-9 w-9 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy-800">{client.name}</p>
                    <p className="truncate text-[11px] text-navy-400">{client.active_package || 'Χωρίς πακέτο'}</p>
                  </div>
                </div>
                {hasDebt && <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" title="Έχει οφειλή" />}
              </button>
            )
          })}
        </div>
      </div>

      {activeClient && (
        <div className="lg:col-span-3 space-y-6">
          <ClientProfile client={activeClient} updateLead={leads.upsert} me={me} isAdmin={isAdmin} />
          <ClientRequests client={activeClient} me={me} isAdmin={isAdmin} />
        </div>
      )}
    </div>
  );
}

function ClientProfile({ client, updateLead, me, isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    setForm({
      owner_name: client.owner_name || '',
      active_package: client.active_package || '',
      monthly_fee: client.monthly_fee || 0,
      monthly_cost: client.monthly_cost || 0,
      setup_fee: client.setup_fee || 0,
      extra_features_fee: client.extra_features_fee || 0,
      debt_amount: client.debt_amount || 0,
      debt_months: client.debt_months || 0,
      domain_url: client.domain_url || '',
      payment_behavior: client.payment_behavior || 'Τυπικός',
      project_brief: client.project_brief || ''
    });
    setIsEditing(false);
  }, [client]);

  const startDate = new Date(client.created_at);
  const monthsActive = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24 * 30)));
  const oneOffTotal = (Number(client.setup_fee) || 0) + (Number(client.extra_features_fee) || 0);
  const ltv = oneOffTotal + ((Number(client.monthly_fee) || 0) * monthsActive);
  const netMonthly = (Number(client.monthly_fee) || 0) - (Number(client.monthly_cost) || 0);
  const hasDebt = (Number(client.debt_months) || 0) > 0;

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from('leads').update(form).eq('id', client.id);
    setSaving(false);
    if (error) notify(error.message);
    else { updateLead({ ...client, ...form }); setIsEditing(false); }
  }

  return (
    <Card className="p-5 sm:p-6 shadow-sm border border-navy-100/50">
      <div className="flex items-start justify-between border-b border-navy-50 pb-4 mb-5">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-navy-800 flex items-center gap-2">
            {client.name}
            {client.domain_url && (
              <a href={client.domain_url.startsWith('http') ? client.domain_url : `https://${client.domain_url}`} target="_blank" rel="noreferrer" className="text-navy-300 hover:text-sage-500 transition">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-navy-500">
            {client.phone && <span className="flex items-center gap-1.5">📞 {client.phone}</span>}
            {client.owner_name && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {client.owner_name}</span>}
            <span className="flex items-center gap-1.5 text-sage-600 bg-sage-50 px-2 py-0.5 rounded-md">Πελάτης εδώ και {monthsActive} μήνες</span>
          </div>
        </div>
        
        {!isEditing ? (
          <Button variant="soft" size="sm" onClick={() => setIsEditing(true)}>Επεξεργασία</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="soft" size="sm" onClick={() => setIsEditing(false)}>Ακύρωση</Button>
            <Button size="sm" onClick={saveProfile} disabled={saving}>Αποθήκευση</Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-5 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="mb-1 block text-xs font-medium text-navy-600">Ιδιοκτήτης</label><input className="input w-full text-sm" value={form.owner_name} onChange={(e) => setForm({...form, owner_name: e.target.value})} /></div>
            <div><label className="mb-1 block text-xs font-medium text-navy-600">Ιστοσελίδα</label><input className="input w-full text-sm" value={form.domain_url} onChange={(e) => setForm({...form, domain_url: e.target.value})} /></div>
            <div><label className="mb-1 block text-xs font-medium text-navy-600">Ενεργό Πακέτο</label><input className="input w-full text-sm" value={form.active_package} onChange={(e) => setForm({...form, active_package: e.target.value})} /></div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-600">Συμπεριφορά</label>
              <select className="input w-full text-sm" value={form.payment_behavior} onChange={(e) => setForm({...form, payment_behavior: e.target.value})}>
                <option value="Τυπικός">Τυπικός</option>
                <option value="Καθυστερεί">Καθυστερεί</option>
                <option value="Προκαταβολικά">Προκαταβολικά</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-navy-50 pt-4 bg-navy-50/20 -mx-5 px-5 pb-2">
            <div><label className="mb-1 block text-xs font-medium text-navy-600">Εφάπαξ Setup (€)</label><input type="number" className="input w-full text-sm" value={form.setup_fee} onChange={(e) => setForm({...form, setup_fee: e.target.value})} /></div>
            <div><label className="mb-1 block text-xs font-medium text-navy-600">Upsells/Features (€)</label><input type="number" className="input w-full text-sm" value={form.extra_features_fee} onChange={(e) => setForm({...form, extra_features_fee: e.target.value})} /></div>
            <div><label className="mb-1 block text-xs font-medium text-sage-600">Μηνιαία Αμοιβή (€)</label><input type="number" className="input w-full text-sm border-sage-200" value={form.monthly_fee} onChange={(e) => setForm({...form, monthly_fee: e.target.value})} /></div>
            <div><label className="mb-1 block text-xs font-medium text-rose-600">Μηνιαίο Κόστος μας (€)</label><input type="number" className="input w-full text-sm border-rose-200" value={form.monthly_cost} onChange={(e) => setForm({...form, monthly_cost: e.target.value})} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-navy-50 pt-4">
            <div><label className="mb-1 block text-xs font-medium text-navy-600">Τρέχουσα Οφειλή (€)</label><input type="number" className="input w-full text-sm" value={form.debt_amount} onChange={(e) => setForm({...form, debt_amount: e.target.value})} /></div>
            <div><label className="mb-1 block text-xs font-medium text-navy-600">Μήνες Καθυστέρησης</label><input type="number" className="input w-full text-sm" value={form.debt_months} onChange={(e) => setForm({...form, debt_months: e.target.value})} /></div>
          </div>

          <div className="border-t border-navy-50 pt-4">
            <label className="mb-1 block text-xs font-medium text-navy-600">Project Brief</label>
            <textarea className="input w-full min-h-[100px] resize-y text-sm" value={form.project_brief} onChange={(e) => setForm({...form, project_brief: e.target.value})} />
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-navy-100 bg-navy-50/30 p-3 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-navy-500 mb-2"><CreditCard className="h-3.5 w-3.5" /> <span className="text-[11px] font-bold uppercase tracking-wider">Καθαρο Μηνιαιο</span></div>
              <p className="text-2xl font-bold text-navy-800">€{netMonthly}</p>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold">
                <span className="text-sage-600 flex items-center"><ArrowUpRight className="h-3 w-3 mr-0.5"/> €{client.monthly_fee || 0}</span>
                <span className="text-rose-500 flex items-center"><ArrowDownRight className="h-3 w-3 mr-0.5"/> €{client.monthly_cost || 0}</span>
              </div>
            </div>
            
            <div className="rounded-xl border border-navy-100 bg-navy-50/30 p-3">
              <div className="flex items-center gap-1.5 text-navy-500 mb-2"><Package className="h-3.5 w-3.5" /> <span className="text-[11px] font-bold uppercase tracking-wider">Εφαπαξ εσοδα</span></div>
              <p className="text-2xl font-bold text-navy-800">€{oneOffTotal}</p>
              <p className="text-[10px] font-medium text-navy-400 mt-1">Setup €{client.setup_fee || 0} · Extra €{client.extra_features_fee || 0}</p>
            </div>

            <div className="rounded-xl border border-sage-200 bg-sage-50/50 p-3 relative">
              <div className="flex items-center gap-1.5 text-sage-600 mb-2"><TrendingUp className="h-3.5 w-3.5" /> <span className="text-[11px] font-bold uppercase tracking-wider">Συνολικη Αξια (LTV)</span></div>
              <p className="text-2xl font-bold text-sage-700">€{ltv}</p>
              <p className="text-[10px] font-medium text-sage-600/70 mt-1">Σε {monthsActive} μήνες</p>
            </div>

            <div className={cx("rounded-xl border p-3 flex flex-col justify-between", hasDebt ? "border-rose-200 bg-rose-50" : "border-navy-100 bg-navy-50/30")}>
              <div>
                <div className={cx("flex items-center gap-1.5 mb-2", hasDebt ? "text-rose-600" : "text-navy-500")}><AlertCircle className="h-3.5 w-3.5" /> <span className="text-[11px] font-bold uppercase tracking-wider">Οφειλη</span></div>
                <p className={cx("text-xl font-bold", hasDebt ? "text-rose-700" : "text-navy-800")}>{client.debt_amount > 0 ? `€${client.debt_amount}` : '€0'}</p>
              </div>
              <div className="flex justify-between items-end">
                <span className={cx("text-[10px] font-bold px-1.5 py-0.5 rounded", hasDebt ? "bg-rose-100 text-rose-600" : "bg-navy-100 text-navy-500")}>{client.payment_behavior}</span>
                {hasDebt && <span className="text-[10px] font-bold text-rose-500">{client.debt_months} μήνες</span>}
              </div>
            </div>
          </div>

          <div className="bg-navy-50/30 rounded-xl p-4 min-h-[80px] border border-navy-50">
            <h3 className="text-xs font-bold text-navy-400 uppercase tracking-wide mb-2">Project Brief</h3>
            {client.project_brief ? <p className="text-sm text-navy-700 whitespace-pre-wrap leading-relaxed">{client.project_brief}</p> : <p className="text-sm text-navy-300 italic">Δεν υπάρχουν μόνιμες σημειώσεις.</p>}
          </div>
        </div>
      )}
    </Card>
  );
}

function ClientRequests({ client, me, isAdmin }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(REQ_CATEGORIES[0]);
  const [adding, setAdding] = useState(false);

  useMemo(() => {
    async function fetchRequests() {
      setLoading(true);
      const { data } = await supabase.from('client_requests').select('*').eq('lead_id', client.id).order('created_at', { ascending: false });
      setRequests(data || []); setLoading(false);
    }
    fetchRequests();
  }, [client.id]);

  // --- ΣΤΑΤΙΣΤΙΚΑ: Υπολογισμοί ---
  const totalReqs = requests.length;
  const pendingReqs = requests.filter(r => !r.is_completed).length;
  
  // Profitability Score (Αιτήματα Μήνα vs Μηνιαία Αμοιβή)
  const now = new Date();
  const reqsThisMonth = requests.filter(r => {
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  
  let profitScore = { label: 'Ιδανικός', color: 'text-sage-600 bg-sage-50' };
  if (client.monthly_fee > 0) {
    const revenuePerRequest = client.monthly_fee / (reqsThisMonth || 1);
    if (revenuePerRequest < 10) profitScore = { label: 'Χρονοβόρος', color: 'text-rose-600 bg-rose-50' };
    else if (revenuePerRequest < 30) profitScore = { label: 'Οριακός', color: 'text-amber-600 bg-amber-50' };
  } else if (reqsThisMonth > 0) {
    profitScore = { label: 'Ζημιογόνος', color: 'text-rose-600 bg-rose-50' }; // Ζητάει ενώ δεν πληρώνει μηνιαίο
  }

  // Average Resolution Time (Μέσος Χρόνος Επίλυσης)
  const completedReqs = requests.filter(r => r.is_completed && r.completed_at);
  let avgResolutionHours = 0;
  if (completedReqs.length > 0) {
    const totalHours = completedReqs.reduce((sum, r) => sum + (new Date(r.completed_at) - new Date(r.created_at)) / 36e5, 0);
    avgResolutionHours = Math.round(totalHours / completedReqs.length);
  }
  const resolutionText = avgResolutionHours > 24 ? `${Math.round(avgResolutionHours / 24)} μέρες` : `${avgResolutionHours} ώρες`;

  async function addRequest(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    const { data, error } = await supabase.from('client_requests').insert({ lead_id: client.id, title: newTitle.trim(), category: newCategory }).select().single();
    setAdding(false);
    if (error) notify(error.message); else { setRequests([data, ...requests]); setNewTitle(''); }
  }

  async function toggleStatus(req) {
    const nextStatus = !req.is_completed;
    const completedAt = nextStatus ? new Date().toISOString() : null; // Σώζουμε το πότε έκλεισε
    setRequests(requests.map(r => r.id === req.id ? { ...r, is_completed: nextStatus, completed_at: completedAt } : r));
    const { error } = await supabase.from('client_requests').update({ is_completed: nextStatus, completed_at: completedAt }).eq('id', req.id);
    if (error) { notify(error.message); setRequests(requests.map(r => r.id === req.id ? { ...r, is_completed: !nextStatus, completed_at: req.completed_at } : r)); }
  }

  async function deleteReq(req) {
    setRequests(requests.filter(r => r.id !== req.id));
    await supabase.from('client_requests').delete().eq('id', req.id);
  }

  async function makeTask(req) {
    const { error } = await supabase.from('micro_tasks').insert({ title: `🎯 Req (${client.name}): ${req.title}`, target_count: 1, task_date: todayStr(), is_recurring: false, is_backlog: false });
    if (error) notify("Αποτυχία: " + error.message); else notify("Προστέθηκε στα Daily Tasks!");
  }

  return (
    <Card className="p-5 sm:p-6 shadow-sm border border-navy-100/50">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-navy-400" /><h3 className="text-base font-bold text-navy-800">Αιτήματα (Ticketing)</h3></div>
        
        {/* ΝΕΟ: Advanced Analytics Bar */}
        {totalReqs > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-navy-50/30 px-4 py-2.5 rounded-lg border border-navy-50/80">
            <div className="flex items-center gap-1.5 text-xs" title="Ταχύτητα Επίλυσης">
              <Clock className="h-3.5 w-3.5 text-navy-400" /> <span className="text-navy-500">Επίλυση:</span> <span className="font-bold text-navy-700">{completedReqs.length > 0 ? resolutionText : '-'}</span>
            </div>
            <div className="w-px h-4 bg-navy-200"></div>
            <div className="flex items-center gap-1.5 text-xs" title="Δείκτης Απόδοσης-Χρόνου βάσει εσόδων">
              <Activity className="h-3.5 w-3.5 text-navy-400" /> <span className="text-navy-500">Πελάτης:</span> 
              <span className={cx("font-bold px-1.5 py-0.5 rounded", profitScore.color)}>{profitScore.label}</span>
            </div>
            <div className="w-px h-4 bg-navy-200"></div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-navy-800">{totalReqs}</span> <span className="text-navy-400">σύνολο</span>
              {pendingReqs > 0 && <span className="ml-1 font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">{pendingReqs} ανοιχτά</span>}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={addRequest} className="mb-6 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <select className="input w-36 bg-navy-50/30 border-navy-100 text-xs font-medium" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            {REQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="input flex-1 bg-navy-50/30 border-navy-100 focus:bg-white" placeholder="Περιγραφή (π.χ. Αλλαγή banner...)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        </div>
        <Button type="submit" disabled={adding || !newTitle.trim()}><Plus className="h-4 w-4" /> Προσθήκη</Button>
      </form>

      {loading ? (
        <div className="animate-pulse space-y-3"><div className="h-12 bg-navy-50 rounded-xl"></div></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-navy-300"><CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-20" /><p className="text-sm">Δεν υπάρχουν αιτήματα.</p></div>
      ) : (
        <ul className="space-y-2">
          {requests.map(req => {
            // --- ΝΕΟ: SLA Tracking Logic ---
            let slaBadge = null;
            if (!req.is_completed) {
              const openHours = (new Date() - new Date(req.created_at)) / 36e5;
              if (openHours >= 48) slaBadge = <span className="bg-rose-100 text-rose-600 text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">⚠️ &gt;48h SLA</span>;
              else if (openHours >= 24) slaBadge = <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold">⏳ &gt;24h</span>;
            }

            return (
              <li key={req.id} className={cx("group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 transition-all", req.is_completed ? "border-sage-200 bg-sage-50/40" : "border-navy-100 bg-white hover:border-navy-200")}>
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <button onClick={() => toggleStatus(req)} className="shrink-0 text-navy-300 hover:text-sage-500 transition-colors">{req.is_completed ? <CheckIcon className="h-5 w-5 text-sage-500" /> : <Square className="h-5 w-5" />}</button>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                    <span className={cx("text-sm transition-all", req.is_completed ? "text-navy-400 line-through" : "text-navy-700 font-medium")}>{req.title}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-navy-50 text-navy-400 px-1.5 py-0.5 rounded"><Tag className="h-3 w-3" /> {req.category || 'Γενικά'}</span>
                      {slaBadge}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pl-8 sm:pl-0">
                  {!req.is_completed && <button onClick={() => makeTask(req)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-navy-600 bg-navy-50 hover:bg-navy-100 transition-colors mr-2"><Calendar className="h-3.5 w-3.5" /> Στο Σήμερα</button>}
                  <button onClick={() => deleteReq(req)} className="rounded-lg p-1.5 text-navy-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}