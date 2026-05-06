import { z } from 'zod';

const conditionGrade = z.enum(['A', 'B', 'C', 'D', 'E']);
const trackingType = z.enum(['Individual', 'Bulk']);

/**
 * Schema for the Add/Edit Equipment form.
 *
 * Note: dates and prices are entered as strings from the form, then
 * coerced/transformed before being sent to the API.
 */
export const equipmentFormSchema = z.object({
  Code: z.string().trim().min(2, 'Code must be at least 2 characters').max(40),
  Name: z.string().trim().min(2, 'Name is required').max(120),
  CategoryId: z.string().min(1, 'Select a category'),
  LocationId: z.string().nullable().optional(),
  VendorId: z.string().nullable().optional(),
  TrackingType: trackingType,
  TotalQuantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  SizeVariant: z.string().trim().max(20).nullable().optional(),
  PhotoUrl: z.string().nullable().optional(),
  CurrentGrade: conditionGrade.nullable().optional(),
  PurchaseDate: z.string().nullable().optional(),
  PurchasePrice: z.coerce.number().nonnegative().nullable().optional(),
  WarrantyEndDate: z.string().nullable().optional(),
  AmcVendorId: z.string().nullable().optional(),
  AmcStartDate: z.string().nullable().optional(),
  AmcEndDate: z.string().nullable().optional(),
  AmcCost: z.coerce.number().nonnegative().nullable().optional(),
  Specs: z.record(z.string(), z.unknown()).default({}),
})
.refine((d) => d.TrackingType === 'Bulk' ? d.TotalQuantity >= 1 : d.TotalQuantity === 1, {
  message: 'Individual items must have quantity 1',
  path: ['TotalQuantity'],
});

export type EquipmentFormInput = z.infer<typeof equipmentFormSchema>;
