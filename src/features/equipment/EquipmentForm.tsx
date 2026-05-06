import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useCreateEquipment, useUpdateEquipment } from './equipment.api';
import { equipmentFormSchema, type EquipmentFormInput } from './equipment.schema';
import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/queryClient';
import type { Category, Location, Vendor, Equipment } from '@/types/domain';

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  existing?: Equipment;
}

const defaultValues: EquipmentFormInput = {
  Code: '',
  Name: '',
  CategoryId: '',
  LocationId: null,
  VendorId: null,
  TrackingType: 'Individual',
  TotalQuantity: 1,
  SizeVariant: null,
  PhotoUrl: null,
  CurrentGrade: 'A',
  PurchaseDate: null,
  PurchasePrice: null,
  WarrantyEndDate: null,
  AmcVendorId: null,
  AmcStartDate: null,
  AmcEndDate: null,
  AmcCost: null,
  Specs: {},
};

export function EquipmentForm({ open, onClose, existing }: EquipmentFormProps) {
  const toast = useToast();
  const createMut = useCreateEquipment();
  const updateMut = useUpdateEquipment();

  const { data: categories = [] } = useQuery({
    queryKey: qk.categories,
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('SortOrder');
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: qk.locations,
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('*').eq('IsActive', true).order('Name');
      if (error) throw error;
      return (data ?? []) as Location[];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: qk.vendors,
    queryFn: async () => {
      const { data, error } = await supabase.from('vendors').select('*').eq('IsActive', true).order('Name');
      if (error) throw error;
      return (data ?? []) as Vendor[];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentFormInput>({ defaultValues });

  // Reset form when modal opens or existing item changes
  useEffect(() => {
    if (open) {
      reset(existing ? { ...defaultValues, ...existing } : defaultValues);
    }
  }, [open, existing, reset]);

  const trackingType = watch('TrackingType');
  const categoryId = watch('CategoryId');
  const selectedCategory = categories.find((c) => c.Id === categoryId);
  const showSizeVariant = !!selectedCategory?.HasSizeVariants;

  const onSubmit = async (raw: EquipmentFormInput) => {
    // Normalize: empty strings → null, NaN numbers → null
    // (HTML form inputs send '' for unselected dropdowns and dates)
    const normalized = { ...raw } as Record<string, unknown>;
    const stringNullableKeys = [
      'LocationId', 'VendorId', 'AmcVendorId', 'SizeVariant', 'PhotoUrl',
      'PurchaseDate', 'WarrantyEndDate', 'AmcStartDate', 'AmcEndDate',
    ];
    for (const k of stringNullableKeys) {
      if (normalized[k] === '' || normalized[k] === undefined) normalized[k] = null;
    }
    const numberNullableKeys = ['PurchasePrice', 'AmcCost'];
    for (const k of numberNullableKeys) {
      const v = normalized[k];
      if (v === '' || v === undefined || (typeof v === 'number' && Number.isNaN(v))) {
        normalized[k] = null;
      }
    }

    const parsed = equipmentFormSchema.safeParse(normalized);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message ?? 'Form validation failed');
      return;
    }

    try {
      if (existing) {
        await updateMut.mutateAsync({ id: existing.Id, input: parsed.data });
        toast.success('Equipment updated');
      } else {
        await createMut.mutateAsync(parsed.data);
        toast.success(`Equipment added — ${parsed.data.Code}`);
      }
      onClose();
    } catch (e) {
      // Supabase errors aren't Error instances but have a .message field
      const msg =
        (e as { message?: string })?.message ??
        (e instanceof Error ? e.message : 'Save failed');
      toast.error(msg);
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c.Id, label: c.Name }));
  const locationOptions = [
    { value: '', label: '— Unassigned —' },
    ...locations.map((l) => ({ value: l.Id, label: l.Dhyanasthali ? `${l.Name} (${l.Dhyanasthali})` : l.Name })),
  ];
  const supplierOptions = [
    { value: '', label: '— None —' },
    ...vendors.filter((v) => v.VendorType !== 'Repair').map((v) => ({ value: v.Id, label: v.Name })),
  ];
  const repairOptions = [
    { value: '', label: '— None —' },
    ...vendors.filter((v) => v.VendorType !== 'Supplier').map((v) => ({ value: v.Id, label: v.Name })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Edit Equipment' : 'Add Equipment'}
      subtitle={existing ? `Updating ${existing.Code}` : 'Register a new piece of equipment'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : existing ? 'Save Changes' : 'Add Equipment'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Code"
            required
            placeholder="e.g. CAM-0042"
            {...register('Code')}
            error={errors.Code?.message}
            hint="Unique identifier — usually category prefix + serial"
          />
          <Select
            label="Category"
            required
            placeholder="Choose a category"
            options={categoryOptions}
            {...register('CategoryId')}
            error={errors.CategoryId?.message}
          />
        </div>

        <Input
          label="Name"
          required
          placeholder="e.g. Sony A7 IV Body"
          {...register('Name')}
          error={errors.Name?.message}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tracking Type"
            options={[
              { value: 'Individual', label: 'Individual (1 of 1)' },
              { value: 'Bulk', label: 'Bulk (multiple identical)' },
            ]}
            {...register('TrackingType')}
          />
          <Input
            label={trackingType === 'Bulk' ? 'Total Quantity' : 'Quantity'}
            type="number"
            min={1}
            disabled={trackingType === 'Individual'}
            {...register('TotalQuantity', { valueAsNumber: true })}
            error={errors.TotalQuantity?.message}
            hint={trackingType === 'Individual' ? 'Individual items always have qty 1' : undefined}
          />
        </div>

        {showSizeVariant && (
          <Input
            label="Size Variant"
            placeholder="e.g. 3m, 5m, 10m"
            {...register('SizeVariant')}
            hint="This category supports size variants"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select label="Location" options={locationOptions} {...register('LocationId')} />
          <Select label="Initial Grade" options={[
            { value: 'A', label: 'A — Excellent' },
            { value: 'B', label: 'B — Good' },
            { value: 'C', label: 'C — Fair' },
            { value: 'D', label: 'D — Poor' },
            { value: 'E', label: 'E — Critical' },
          ]} {...register('CurrentGrade')} />
        </div>

        <fieldset className="border border-[var(--b)] rounded-lg p-3">
          <legend className="text-[11px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--tm)' }}>
            Purchase & Warranty
          </legend>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Select label="Supplier" options={supplierOptions} {...register('VendorId')} />
            <Input
              label={trackingType === 'Bulk' ? 'Price Per Unit (₹)' : 'Purchase Price (₹)'}
              type="number"
              step="0.01"
              min={0}
              {...register('PurchasePrice', { valueAsNumber: true })}
            />
            <Input label="Purchase Date" type="date" {...register('PurchaseDate')} />
            <Input label="Warranty End" type="date" {...register('WarrantyEndDate')} />
          </div>
        </fieldset>

        <fieldset className="border border-[var(--b)] rounded-lg p-3">
          <legend className="text-[11px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--tm)' }}>
            AMC (optional)
          </legend>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Select label="AMC Vendor" options={repairOptions} {...register('AmcVendorId')} />
            <Input label="AMC Cost (₹)" type="number" step="0.01" min={0} {...register('AmcCost', { valueAsNumber: true })} />
            <Input label="AMC Start" type="date" {...register('AmcStartDate')} />
            <Input label="AMC End" type="date" {...register('AmcEndDate')} />
          </div>
        </fieldset>

        <Textarea
          label="Notes (optional)"
          rows={2}
          placeholder="Anything special about this equipment?"
          {...register('Specs.notes')}
        />
      </form>
    </Modal>
  );
}
