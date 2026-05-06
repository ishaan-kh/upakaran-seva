import { Package, ArrowRightLeft, Calendar, Wrench } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';

export function DashboardPage() {
  const { currentUser } = useAuth();

  // Quick counts — minimal for v1, full dashboard ported later
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const [eq, co, ev, mt] = await Promise.all([
        supabase.from('equipment').select('Id', { count: 'exact', head: true }).eq('IsActive', true),
        supabase.from('checkouts').select('Id', { count: 'exact', head: true }).eq('Status', 'Active'),
        supabase.from('events').select('Id', { count: 'exact', head: true }).in('Status', ['Planned', 'InProgress']),
        supabase.from('maintenancetickets').select('Id', { count: 'exact', head: true }).in('Status', ['Open', 'InRepair']),
      ]);
      return {
        equipment: eq.count ?? 0,
        activeCheckouts: co.count ?? 0,
        upcomingEvents: ev.count ?? 0,
        openTickets: mt.count ?? 0,
      };
    },
  });

  const greeting = getGreeting();
  const firstName = currentUser?.Name.split(' ')[0] ?? '';

  return (
    <>
      <div className="mb-6">
        <h1 className="fd text-2xl font-medium tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm" style={{ color: 'var(--tm)' }}>
          Welcome to Upakaran Seva — Gurutattva Foundation's media equipment system
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Package}
          label="Total Equipment"
          value={stats?.equipment}
          accent="var(--p)"
          accentBg="var(--ps)"
        />
        <StatCard
          icon={ArrowRightLeft}
          label="Active Checkouts"
          value={stats?.activeCheckouts}
          accent="var(--in)"
          accentBg="var(--ins)"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Events"
          value={stats?.upcomingEvents}
          accent="var(--sc)"
          accentBg="var(--scs)"
        />
        <StatCard
          icon={Wrench}
          label="Open Tickets"
          value={stats?.openTickets}
          accent="var(--w)"
          accentBg="var(--ws)"
        />
      </div>

      <Card title="Welcome to Upakaran Seva v1">
        <div className="text-sm space-y-2" style={{ color: 'var(--tm)' }}>
          <p>
            This is the production v1 deployment. Equipment management is fully functional —
            you can add, edit, search, retire, and track condition grades.
          </p>
          <p>
            <strong style={{ color: 'var(--t)' }}>Coming soon:</strong> Checkouts, Events,
            Maintenance, Billing, and full Masters management. These will be added incrementally.
          </p>
          <p className="pt-2">
            Found a bug or have feedback? Reach out to the Digital &amp; IT Operations team.
          </p>
        </div>
      </Card>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  accentBg,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number | undefined;
  accent: string;
  accentBg: string;
}) {
  return (
    <div className="bg-white border border-[var(--b)] rounded-xl p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg grid place-items-center flex-shrink-0"
        style={{ background: accentBg, color: accent }}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--tm)' }}>
          {label}
        </div>
        <div className="fd text-2xl font-medium leading-tight">{value ?? '—'}</div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
