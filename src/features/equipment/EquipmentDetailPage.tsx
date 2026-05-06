import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Archive, Loader2, Package } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, EmptyState } from '@/components/ui/Card';
import { StatusChip, GradeBadge } from '@/components/ui/Badges';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { useCan } from '@/features/auth/useCan';
import { useAuth } from '@/features/auth/AuthContext';
import { useEquipment, useRetireEquipment } from './equipment.api';
import { EquipmentForm } from './EquipmentForm';

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useCan();
  const { currentUser } = useAuth();

  const { data: eq, isLoading, error } = useEquipment(id ?? null);
  const retireMut = useRetireEquipment();

  const [showEdit, setShowEdit] = useState(false);
  const [showRetire, setShowRetire] = useState(false);
  const [retireReason, setRetireReason] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20" style={{ color: 'var(--tm)' }}>
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--ds)', color: 'var(--di)' }}>
        {(error as Error).message}
      </div>
    );
  }

  if (!eq) {
    return (
      <Card padded={false}>
        <EmptyState
          icon={Package}
          title="Equipment not found"
          message="It may have been deleted or you don't have access."
          action={<Button variant="primary" onClick={() => navigate('/equipment')}>Back to Equipment</Button>}
        />
      </Card>
    );
  }

  const handleRetire = async () => {
    if (!retireReason.trim()) {
      toast.error('Please provide a reason for retiring');
      return;
    }
    if (!currentUser) {
      toast.error('Not authenticated');
      return;
    }
    try {
      await retireMut.mutateAsync({
        id: eq.Id,
        reason: retireReason.trim(),
        retiredByUserId: currentUser.Id,
      });
      toast.success('Equipment retired');
      setShowRetire(false);
      setRetireReason('');
      navigate('/equipment');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Retire failed');
    }
  };

  const canRetire =
    eq.IsActive &&
    eq.CurrentStatus !== 'CheckedOut' &&
    eq.CurrentStatus !== 'Overdue' &&
    eq.CurrentStatus !== 'InMaintenance';

  return (
    <>
      <Link
        to="/equipment"
        className="inline-flex items-center gap-1.5 text-xs mb-3 hover:underline"
        style={{ color: 'var(--tm)' }}
      >
        <ArrowLeft size={13} /> Back to Equipment
      </Link>

      <div className="flex items-start gap-5 mb-5 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="fm text-xs font-semibold" style={{ color: 'var(--pi)' }}>{eq.Code}</span>
            <StatusChip status={eq.CurrentStatus} size="sm" />
            {!eq.IsActive && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--s2)', color: 'var(--ts)' }}>
                Retired
              </span>
            )}
          </div>
          <h1 className="fd text-2xl font-medium tracking-tight">{eq.Name}</h1>
          {eq.SizeVariant && (
            <p className="text-xs mt-1" style={{ color: 'var(--tm)' }}>Size: {eq.SizeVariant}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <GradeBadge grade={eq.CurrentGrade} size="lg" />
          <div className="flex gap-2">
            {can('equipment.edit') && eq.IsActive && (
              <Button variant="secondary" leftIcon={<Edit2 size={14} />} onClick={() => setShowEdit(true)}>
                Edit
              </Button>
            )}
            {can('equipment.retire') && canRetire && (
              <Button variant="ghost" leftIcon={<Archive size={14} />} onClick={() => setShowRetire(true)}>
                Retire
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Details">
          <dl className="space-y-2 text-sm">
            <Row label="Category" value={eq.Category?.Name ?? '—'} />
            <Row label="Location" value={eq.Location?.Name ?? <span className="italic" style={{ color: 'var(--ts)' }}>Unassigned</span>} />
            <Row label="Tracking" value={eq.TrackingType === 'Bulk' ? `Bulk · ${eq.TotalQuantity} total` : 'Individual'} />
            <Row label="Supplier" value={eq.Vendor?.Name ?? '—'} />
          </dl>
        </Card>

        <Card title="Purchase & Warranty">
          <dl className="space-y-2 text-sm">
            <Row label="Purchase Date" value={eq.PurchaseDate ?? '—'} />
            <Row
              label={eq.TrackingType === 'Bulk' ? 'Price per Unit' : 'Purchase Price'}
              value={eq.PurchasePrice != null ? `₹${eq.PurchasePrice.toLocaleString('en-IN')}` : '—'}
            />
            {eq.TrackingType === 'Bulk' && eq.PurchasePrice != null && (
              <Row
                label="Total Value"
                value={`₹${(eq.PurchasePrice * eq.TotalQuantity).toLocaleString('en-IN')}`}
              />
            )}
            <Row label="Warranty End" value={eq.WarrantyEndDate ?? '—'} />
          </dl>
        </Card>
      </div>

      {!eq.IsActive && eq.RetiredReason && (
        <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--s2)', color: 'var(--tm)' }}>
          <div className="text-[10px] uppercase font-semibold tracking-wider mb-1">Retired</div>
          <div className="text-sm">{eq.RetiredReason}</div>
          {eq.RetiredAt && (
            <div className="text-[11px] mt-1" style={{ color: 'var(--ts)' }}>
              {new Date(eq.RetiredAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      <EquipmentForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        existing={eq}
      />

      <Modal
        open={showRetire}
        onClose={() => setShowRetire(false)}
        title="Retire Equipment"
        subtitle={`This will mark ${eq.Code} as inactive`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRetire(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleRetire} disabled={retireMut.isPending}>
              {retireMut.isPending ? 'Retiring…' : 'Retire'}
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason"
          required
          placeholder="e.g. Damaged beyond repair, no longer needed…"
          value={retireReason}
          onChange={(e) => setRetireReason(e.target.value)}
          hint="This reason will be saved permanently in the audit trail."
        />
      </Modal>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xs uppercase tracking-wider" style={{ color: 'var(--tm)' }}>{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
