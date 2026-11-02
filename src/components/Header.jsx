import { Compass } from 'lucide-react';
import { Avatar, cx } from './ui';

export default function Header({ me, live, onProfile }) {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy-800 text-white shadow-soft">
            <Compass className="h-[18px] w-[18px]" />
          </span>
          <div className="leading-tight">
            <p className="text-[14px] sm:text-[15px] font-semibold text-navy-800">Agency HQ</p>
            <p className="text-[11px] text-navy-400">Team command center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 text-xs text-navy-400 sm:inline-flex">
            <span className="relative flex h-2 w-2">
              {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-60" />}
              <span className={cx('relative inline-flex h-2 w-2 rounded-full', live ? 'bg-sage-500' : 'bg-navy-200')} />
            </span>
            {live ? 'Live sync' : 'Σύνδεση…'}
          </span>

          <button
            onClick={onProfile}
            className="flex items-center gap-2.5 rounded-full border border-navy-100 bg-white py-1 pl-1 pr-3.5 transition hover:border-navy-200 hover:shadow-soft"
          >
            <Avatar name={me.full_name} size="h-7 w-7" />
            <span className="hidden text-sm font-medium text-navy-700 sm:block">{me.full_name?.split(' ')[0]}</span>
            {me.role === 'admin' && (
              <span className="rounded-md bg-sand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sand-500">Admin</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
