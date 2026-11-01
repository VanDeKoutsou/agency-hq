import { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { initials } from '../lib/utils';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx('rounded-2xl border border-navy-100/70 bg-white shadow-soft', className)} {...rest}>
      {children}
    </div>
  );
}

const VARIANTS = {
  primary: 'bg-navy-800 text-white hover:bg-navy-700 shadow-soft',
  soft: 'bg-navy-50 text-navy-700 hover:bg-navy-100',
  sage: 'bg-sage-500 text-white hover:bg-sage-600',
  ghost: 'text-navy-500 hover:bg-navy-50 hover:text-navy-800',
  danger: 'text-rose-600 hover:bg-rose-50',
};
const SIZES = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', icon: 'h-8 w-8 justify-center' };

export function Button({ variant = 'primary', size = 'md', className, ...rest }) {
  return (
    <button
      className={cx(
        'inline-flex items-center gap-1.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    />
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 animate-fadeIn bg-navy-900/25 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx('relative max-h-[90vh] w-full animate-slideUp overflow-y-auto rounded-2xl bg-white p-6 shadow-lift', width)}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-navy-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700" aria-label="Κλείσιμο">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const TONES = { navy: 'bg-navy-600', sage: 'bg-sage-500', sand: 'bg-sand-500' };
export function ProgressBar({ value, tone = 'navy', height = 'h-2', className }) {
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-navy-50', height, className)}>
      <div
        className={cx('h-full rounded-full transition-all duration-700 ease-out', TONES[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-white px-2 py-0.5 text-[11px] font-medium text-navy-600">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: category.color }} />
      {category.name}
    </span>
  );
}

export function Avatar({ name, size = 'h-7 w-7', className }) {
  return (
    <span
      className={cx('inline-grid shrink-0 place-items-center rounded-full bg-navy-100 text-[10px] font-semibold text-navy-700', size, className)}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function CategorySelect({ categories, value, onChange, className }) {
  return (
    <select className={cx('input', className)} value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">Χωρίς κατηγορία</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-100 px-4 py-8 text-center">
      {Icon && <Icon className="mb-2 h-5 w-5 text-navy-300" />}
      <p className="text-sm font-medium text-navy-600">{title}</p>
      {hint && <p className="mt-0.5 text-xs text-navy-400">{hint}</p>}
    </div>
  );
}

export function SectionTitle({ icon: Icon, title, hint, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-50 text-navy-600">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h2 className="text-[15px] font-semibold leading-tight text-navy-800">{title}</h2>
          {hint && <p className="text-xs text-navy-400">{hint}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function AnimatedNumber({ value, duration = 600, suffix = '' }) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const from = current.current;
    if (from === value) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (value - from) * eased);
      current.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <>
      {shown}
      {suffix}
    </>
  );
}

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const id = Math.random();
      setItems((p) => [...p, { id, ...e.detail }]);
      setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 4200);
    };
    window.addEventListener('hq:toast', onToast);
    return () => window.removeEventListener('hq:toast', onToast);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex animate-slideUp items-center gap-2 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm text-navy-700 shadow-lift"
        >
          {t.tone === 'error' ? <AlertCircle className="h-4 w-4 text-rose-500" /> : <CheckCircle2 className="h-4 w-4 text-sage-500" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
