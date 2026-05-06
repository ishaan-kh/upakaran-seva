import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';

import { useAuth } from '@/features/auth/AuthContext';

export function TopBar() {
  const { currentUser, roles, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!currentUser) return null;

  const primaryRole = roles.find((r) => r.Id === currentUser.Roles[0]);

  return (
    <header className="bg-white border-b border-[var(--b)] px-6 h-14 flex items-center justify-end">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--s2)]"
        >
          <Avatar name={currentUser.Name} />
          <div className="text-left hidden sm:block">
            <div className="text-sm font-semibold leading-tight">{currentUser.Name}</div>
            {primaryRole && (
              <div className="text-[11px]" style={{ color: 'var(--tm)' }}>
                {primaryRole.Label}
              </div>
            )}
          </div>
          <ChevronDown size={14} style={{ color: 'var(--tm)' }} />
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1 w-64 bg-white border border-[var(--b)] rounded-xl shadow-lg overflow-hidden a-fi"
          >
            <div className="px-4 py-3 border-b border-[var(--b)]">
              <div className="font-semibold text-sm">{currentUser.Name}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--tm)' }}>{currentUser.Email}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {currentUser.Roles.map((rid) => {
                  const r = roles.find((x) => x.Id === rid);
                  if (!r) return null;
                  return (
                    <span
                      key={rid}
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: r.BgColor, color: r.TextColor }}
                    >
                      {r.Label}
                    </span>
                  );
                })}
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[var(--ds)]"
              style={{ color: 'var(--di)' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold"
      style={{ background: 'var(--ps)', color: 'var(--pi)' }}
    >
      {initials}
    </div>
  );
}
