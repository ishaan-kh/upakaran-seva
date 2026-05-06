import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { qk } from '@/lib/queryClient';
import type { Equipment, EquipmentWithRelations } from '@/types/domain';
import type { EquipmentFormInput } from './equipment.schema';

// ---- LIST ----
export function useEquipmentList() {
  return useQuery({
    queryKey: qk.equipment,
    queryFn: async (): Promise<EquipmentWithRelations[]> => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          Category:categories(Id, Name, HasSizeVariants),
          Location:locations(Id, Name, Dhyanasthali),
          Vendor:vendors!VendorId(Id, Name)
        `)
        .order('Code');
      if (error) throw error;
      return (data ?? []) as unknown as EquipmentWithRelations[];
    },
  });
}

// ---- GET ONE ----
export function useEquipment(id: string | null) {
  return useQuery({
    queryKey: id ? qk.equipmentItem(id) : ['equipment', 'none'],
    enabled: !!id,
    queryFn: async (): Promise<EquipmentWithRelations | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          Category:categories(Id, Name, HasSizeVariants),
          Location:locations(Id, Name, Dhyanasthali),
          Vendor:vendors!VendorId(Id, Name)
        `)
        .eq('Id', id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as EquipmentWithRelations | null;
    },
  });
}

// ---- CREATE ----
export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EquipmentFormInput): Promise<Equipment> => {
      const { data, error } = await supabase
        .from('equipment')
        .insert({
          ...input,
          // Bulk should always have TotalQuantity from form;
          // Individual is forced to 1
          TotalQuantity: input.TrackingType === 'Bulk' ? input.TotalQuantity : 1,
          CurrentStatus: 'Available',
          IsActive: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Equipment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.equipment });
    },
  });
}

// ---- UPDATE ----
export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<EquipmentFormInput> }): Promise<Equipment> => {
      const { data, error } = await supabase
        .from('equipment')
        .update(input)
        .eq('Id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Equipment;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: qk.equipment });
      qc.invalidateQueries({ queryKey: qk.equipmentItem(vars.id) });
    },
  });
}

// ---- RETIRE ----
export function useRetireEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, reason, retiredByUserId,
    }: { id: string; reason: string; retiredByUserId: string }): Promise<void> => {
      const { error } = await supabase
        .from('equipment')
        .update({
          IsActive: false,
          CurrentStatus: 'Retired',
          RetiredAt: new Date().toISOString(),
          RetiredReason: reason,
          RetiredByUserId: retiredByUserId,
        })
        .eq('Id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: qk.equipment });
      qc.invalidateQueries({ queryKey: qk.equipmentItem(vars.id) });
    },
  });
}

// ---- PHOTO UPLOAD ----
/**
 * Upload an image File to the equipment-photos bucket.
 * Returns the storage path (use getPublicPhotoUrl to display).
 *
 * Photo is auto-resized client-side to 800px max dim and converted
 * to JPEG at 0.85 quality before upload to keep storage small.
 */
export async function uploadEquipmentPhoto(file: File, userId: string): Promise<string> {
  const resized = await resizeImage(file, 800, 0.85);
  const path = `${userId}/${Date.now()}-${randomSuffix()}.jpg`;
  const { error } = await supabase.storage
    .from('equipment-photos')
    .upload(path, resized, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
  if (error) throw error;
  return path;
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

async function resizeImage(file: File, maxDim: number, quality: number): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to encode image')),
      'image/jpeg',
      quality
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
