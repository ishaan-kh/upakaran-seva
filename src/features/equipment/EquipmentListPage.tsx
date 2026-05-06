import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Search, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, EmptyState } from '@/components/ui/Card';
import { StatusChip, GradeBadge } from '@/components/ui/Badges';
import { useCan } from '@/features/auth/useCan';
import { useEquipmentList } from './equipment.api';
import { EquipmentForm } from './EquipmentForm';
import type { EquipmentWithRelations } from '@/types/domain';

export function EquipmentListPage() {
  const { can } = useCan();
  const { data: equipment = [], isLoading, error } = useEquipmentList();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return equipment;
    const q = search.trim().toLowerCase();
    return equipment.filter((e) =>
      e.Code.toLowerCase().includes(q) ||
      e.Name.toLowerCase().includes(q) ||
      e.Category?.Name.toLowerCase().includes(q)
    );
  }, [equipment, search]);

  return (
    <>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="fd text-2xl font-medium tracking-tight">Equipment</h1>
          <p className="text-sm" style={{ color: 'var(--tm)' }}>
            {equipment.length} {equipment.length === 1 ? 'item' : 'items'} in inventory
          </p>
        </div>
        {can('equipment.create') && (
          <Button variant="primary" leftIcon={<Plus size={15} />} onClick={() => setShowForm(true)}>
            Add Equipment
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ts)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, or category…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--b)] text-sm bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background: 'var(--ds)', color: 'var(--di)' }}>
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <Card padded>
          <div className="flex items-center justify-center gap-2 py-10" style={{ color: 'var(--tm)' }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading equipment…</span>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Package}
            title={search ? 'No matches found' : 'No equipment yet'}
            message={
              search
                ? 'Try a different search term.'
                : 'Add the first piece of equipment to start tracking.'
            }
            action={
              !search && can('equipment.create') && (
                <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>
                  Add Equipment
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--b)] text-left">
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th>Grade</Th>
                  <Th align="right">Qty</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--b)]">
                {filtered.map((eq) => (
                  <EquipmentRow key={eq.Id} eq={eq} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <EquipmentForm open={showForm} onClose={() => setShowForm(false)} />
    </>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${align === 'right' ? 'text-right' : ''}`}
      style={{ color: 'var(--tm)' }}
    >
      {children}
    </th>
  );
}

function EquipmentRow({ eq }: { eq: EquipmentWithRelations }) {
  return (
    <tr className="hover:bg-[var(--psr)]">
      <td className="px-4 py-3">
        <Link to={`/equipment/${eq.Id}`} className="fm text-xs font-semibold" style={{ color: 'var(--pi)' }}>
          {eq.Code}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{eq.Name}</div>
        {eq.SizeVariant && (
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--tm)' }}>
            Size: {eq.SizeVariant}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-xs" style={{ color: 'var(--tm)' }}>
        {eq.Category?.Name ?? '—'}
      </td>
      <td className="px-4 py-3 text-xs" style={{ color: 'var(--tm)' }}>
        {eq.Location?.Name ?? <span className="italic">unassigned</span>}
      </td>
      <td className="px-4 py-3"><StatusChip status={eq.CurrentStatus} size="sm" /></td>
      <td className="px-4 py-3"><GradeBadge grade={eq.CurrentGrade} size="sm" /></td>
      <td className="px-4 py-3 text-right fm text-xs">
        {eq.TrackingType === 'Bulk' ? eq.TotalQuantity : '1'}
      </td>
    </tr>
  );
}
