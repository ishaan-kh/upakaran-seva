/**
 * Domain types — handcrafted to mirror the database schema.
 *
 * These can be replaced with auto-generated types from Supabase CLI:
 *   pnpm supabase:types
 *
 * Convention: keep PascalCase to match DB columns directly (no camelCase mapping).
 */

export type RoleId =
  | 'UpakaranAdmin'
  | 'UpakaranCustodian'
  | 'EventCoordinator'
  | 'MediaTeamMember'
  | 'UpakaranViewer'
  | string; // custom role IDs are also allowed

export type ConditionGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type EquipmentStatus = 'Available' | 'CheckedOut' | 'Overdue' | 'InMaintenance' | 'Retired';
export type CheckoutStatus = 'Active' | 'Returned' | 'Overdue';
export type EventStatus = 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';
export type ChecklistItemStatus = 'Pending' | 'CheckedOut' | 'Returned' | 'Cancelled';
export type TicketStatus = 'Open' | 'InRepair' | 'Resolved' | 'Unrepairable' | 'ReturnedAsIs';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketOutcome = 'Resolved' | 'Unrepairable' | 'ReturnedAsIs';
export type VendorType = 'Supplier' | 'Repair' | 'Both';
export type TrackingType = 'Individual' | 'Bulk';

export interface Role {
  Id: RoleId;
  Label: string;
  BasedOn: RoleId | null;
  ShortDesc: string;
  Description: string;
  Permissions: string[];
  BgColor: string;
  TextColor: string;
  SortOrder: number;
  IsBuiltIn: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Category {
  Id: string;
  Name: string;
  Description: string;
  HasSizeVariants: boolean;
  SortOrder: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface User {
  Id: string;
  AuthUserId: string | null;
  Name: string;
  Email: string;
  Phone: string | null;
  Roles: RoleId[];
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Location {
  Id: string;
  Name: string;
  Dhyanasthali: string | null;
  Address: string | null;
  InchargeUserId: string | null;
  Notes: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Vendor {
  Id: string;
  Name: string;
  VendorType: VendorType;
  Gstin: string | null;
  ContactName: string | null;
  Phone: string | null;
  Email: string | null;
  Address: string | null;
  Notes: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface EventType {
  Id: string;
  Name: string;
  Emoji: string | null;
  Description: string;
  SortOrder: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Equipment {
  Id: string;
  Code: string;
  Name: string;
  CategoryId: string;
  LocationId: string | null;
  VendorId: string | null;
  TrackingType: TrackingType;
  TotalQuantity: number;
  SizeVariant: string | null;
  Specs: Record<string, unknown>;
  PhotoUrl: string | null;
  CurrentGrade: ConditionGrade | null;
  CurrentStatus: EquipmentStatus;
  PurchaseDate: string | null;
  PurchasePrice: number | null;
  WarrantyEndDate: string | null;
  AmcVendorId: string | null;
  AmcStartDate: string | null;
  AmcEndDate: string | null;
  AmcCost: number | null;
  IsActive: boolean;
  RetiredAt: string | null;
  RetiredReason: string | null;
  RetiredByUserId: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedByUserId: string | null;
}

export interface Checkout {
  Id: string;
  EquipmentId: string;
  CheckedOutByUserId: string;
  EventId: string | null;
  Quantity: number;
  CheckedOutAt: string;
  ExpectedReturnAt: string;
  ActualReturnAt: string | null;
  Status: CheckoutStatus;
  ConditionAtCheckout: ConditionGrade | null;
  ConditionAtReturn: ConditionGrade | null;
  Purpose: string | null;
  Notes: string | null;
  DamageOnReturn: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  ReturnProcessedByUserId: string | null;
}

export interface Event {
  Id: string;
  Name: string;
  EventTypeId: string | null;
  LocationId: string | null;
  CoordinatorUserId: string | null;
  StartAt: string;
  EndAt: string;
  Status: EventStatus;
  Description: string | null;
  Notes: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedByUserId: string | null;
}

export interface EventChecklistItem {
  Id: string;
  EventId: string;
  EquipmentId: string;
  Quantity: number;
  Status: ChecklistItemStatus;
  CheckoutId: string | null;
  Notes: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ConditionLog {
  Id: string;
  EquipmentId: string;
  Grade: ConditionGrade;
  Observations: string | null;
  PhotoUrl: string | null;
  ReportedByUserId: string;
  CreatedAt: string;
}

export interface MaintenanceTicket {
  Id: string;
  TicketNumber: string;
  EquipmentId: string;
  OpenedByUserId: string;
  Priority: TicketPriority;
  Status: TicketStatus;
  Issue: string;
  AssignedVendorId: string | null;
  EstimatedCost: number | null;
  ActualCost: number | null;
  Resolution: string | null;
  Outcome: TicketOutcome | null;
  GradeAfter: ConditionGrade | null;
  OpenedAt: string;
  AssignedAt: string | null;
  ResolvedAt: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

// Joined / view types
export interface EquipmentWithRelations extends Equipment {
  Category?: Pick<Category, 'Id' | 'Name' | 'HasSizeVariants'>;
  Location?: Pick<Location, 'Id' | 'Name' | 'Dhyanasthali'> | null;
  Vendor?: Pick<Vendor, 'Id' | 'Name'> | null;
}
