import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ArrowRightLeft, Calendar, Wrench, Receipt,
  Users, UserCheck, Tag, MapPin, Building2, ShieldCheck, QrCode,
  type LucideIcon,
} from 'lucide-react';

import { useCan } from '@/features/auth/useCan';
import type { PageId } from '@/lib/permissions';

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  to: string;
  enabled?: boolean;
}

const WORKSPACE_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard, to: '/' },
  { id: 'equipment',   label: 'Equipment',   icon: Package,         to: '/equipment' },
  { id: 'scan',        label: 'Scan',        icon: QrCode,          to: '/scan',        enabled: false },
  { id: 'checkouts',   label: 'Checkouts',   icon: ArrowRightLeft,  to: '/checkouts' },
  { id: 'events',      label: 'Events',      icon: Calendar,        to: '/events' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench,          to: '/maintenance' },
  { id: 'billing',     label: 'Billing',     icon: Receipt,         to: '/billing' },
];

const MASTER_ITEMS: NavItem[] = [
  { id: 'users',      label: 'Users',       icon: Users,     to: '/masters/users' },
  { id: 'roles',      label: 'Roles',       icon: UserCheck, to: '/masters/roles' },
  { id: 'categories', label: 'Categories',  icon: Tag,       to: '/masters/categories' },
  { id: 'eventTypes', label: 'Event Types', icon: Calendar,  to: '/masters/event-types' },
  { id: 'locations',  label: 'Locations',   icon: MapPin,    to: '/masters/locations' },
  { id: 'vendors',    label: 'Vendors',     icon: Building2, to: '/masters/vendors' },
];

export function Sidebar() {
  const { canSee } = useCan();

  const workspace = WORKSPACE_ITEMS.filter((i) => canSee(i.id));
  const masters = MASTER_ITEMS.filter((i) => canSee(i.id));

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col text-white"
      style={{ background: 'linear-gradient(180deg, #1A1410 0%, #2A1F15 100%)' }}
    >
      <div className="px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl grid place-items-center"
            style={{ background: 'linear-gradient(135deg, var(--p), var(--pd))' }}
          >
            <ShieldCheck size={17} className="text-white" />
          </div>
          <div>
            <div className="fd text-base font-medium">Upakaran Seva</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#8A7E6D' }}>
              Gurutattva
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <SectionHeader>Workspace</SectionHeader>
        <ul>
          {workspace.map((it) => <NavItemRow key={it.id} item={it} />)}
        </ul>

        {masters.length > 0 && (
          <>
            <SectionHeader>Masters</SectionHeader>
            <ul>
              {masters.map((it) => <NavItemRow key={it.id} item={it} />)}
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-wider font-semibold"
      style={{ color: '#8A7E6D', letterSpacing: '0.12em' }}
    >
      {children}
    </div>
  );
}

function NavItemRow({ item }: { item: NavItem }) {
  const isPlaceholder = item.enabled === false;
  const Icon = item.icon;

  if (isPlaceholder) {
    return (
      <li className="px-2">
        <span
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm cursor-not-allowed"
          style={{ color: '#5A5042' }}
        >
          <Icon size={15} />
          <span>{item.label}</span>
          <span
            className="ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(200,96,28,0.2)', color: 'var(--ps)' }}
          >
            Soon
          </span>
        </span>
      </li>
    );
  }

  return (
    <li className="px-2">
      <NavLink
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
            isActive ? 'bg-[rgba(200,96,28,0.18)] text-white' : 'text-[#C8B8A0] hover:bg-[rgba(255,255,255,0.04)]'
          }`
        }
      >
        <Icon size={15} />
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}
