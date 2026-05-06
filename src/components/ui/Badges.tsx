import type { ConditionGrade, EquipmentStatus, CheckoutStatus, EventStatus, TicketStatus } from '@/types/domain';

const statusColors: Record<string, { bg: string; color: string }> = {
  Available:     { bg: 'var(--scs)', color: 'var(--sci)' },
  CheckedOut:    { bg: 'var(--ins)', color: 'var(--ini)' },
  Overdue:       { bg: 'var(--ds)',  color: 'var(--di)'  },
  InMaintenance: { bg: 'var(--ws)',  color: 'var(--wi)'  },
  Retired:       { bg: 'var(--s2)',  color: 'var(--ts)'  },
  Active:        { bg: 'var(--ins)', color: 'var(--ini)' },
  Returned:      { bg: 'var(--scs)', color: 'var(--sci)' },
  Planned:       { bg: 'var(--ins)', color: 'var(--ini)' },
  InProgress:    { bg: 'var(--ws)',  color: 'var(--wi)'  },
  Completed:     { bg: 'var(--scs)', color: 'var(--sci)' },
  Cancelled:     { bg: 'var(--s2)',  color: 'var(--ts)'  },
  Open:          { bg: 'var(--ws)',  color: 'var(--wi)'  },
  InRepair:      { bg: 'var(--ins)', color: 'var(--ini)' },
  Resolved:      { bg: 'var(--scs)', color: 'var(--sci)' },
  Unrepairable:  { bg: 'var(--ds)',  color: 'var(--di)'  },
  ReturnedAsIs:  { bg: 'var(--s2)',  color: 'var(--ts)'  },
};

const statusLabels: Record<string, string> = {
  CheckedOut:    'Checked Out',
  InMaintenance: 'In Maintenance',
  InProgress:    'In Progress',
  InRepair:      'In Repair',
  ReturnedAsIs:  'Returned As-Is',
};

interface StatusChipProps {
  status: EquipmentStatus | CheckoutStatus | EventStatus | TicketStatus;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const colors = statusColors[status] ?? { bg: 'var(--s2)', color: 'var(--ts)' };
  const label = statusLabels[status] ?? status;
  const sizing = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-block rounded font-semibold uppercase tracking-wide ${sizing}`}
      style={{ background: colors.bg, color: colors.color }}
    >
      {label}
    </span>
  );
}

interface GradeBadgeProps {
  grade: ConditionGrade | null;
  size?: 'sm' | 'md' | 'lg';
}

const gradeColors: Record<ConditionGrade, { bg: string; color: string }> = {
  A: { bg: 'var(--gas)', color: 'var(--ga)' },
  B: { bg: 'var(--gbs)', color: 'var(--gb)' },
  C: { bg: 'var(--gcs)', color: 'var(--gc)' },
  D: { bg: 'var(--gds)', color: 'var(--gd)' },
  E: { bg: 'var(--ges)', color: 'var(--ge)' },
};

export function GradeBadge({ grade, size = 'md' }: GradeBadgeProps) {
  if (!grade) {
    return <span className="text-xs italic" style={{ color: 'var(--ts)' }}>—</span>;
  }
  const colors = gradeColors[grade];
  const sizeClass =
    size === 'sm' ? 'w-5 h-5 text-[10px]'
    : size === 'lg' ? 'w-9 h-9 text-base'
    : 'w-7 h-7 text-xs';

  return (
    <span
      className={`inline-grid place-items-center rounded-full font-bold fm ${sizeClass}`}
      style={{ background: colors.bg, color: colors.color }}
    >
      {grade}
    </span>
  );
}
