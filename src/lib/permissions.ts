/**
 * Permissions — client-side mirror of the backend RLS rules.
 *
 * IMPORTANT: This is for UI gating only (showing/hiding buttons).
 * The database enforces these same rules via RLS — the client cannot
 * bypass them. If client and server disagree, server wins.
 *
 * Keep ACTION_PERMISSIONS in sync with has_action() in the SQL migration.
 */

import type { Role, RoleId, User } from '@/types/domain';

export type ActionId =
  | 'equipment.create'
  | 'equipment.edit'
  | 'equipment.retire'
  | 'equipment.reportCondition'
  | 'checkout.create'
  | 'checkout.return'
  | 'event.create'
  | 'event.edit'
  | 'event.checklist'
  | 'event.bulkOps'
  | 'maintenance.create'
  | 'maintenance.manage'
  | 'masters.manage';

export type PageId =
  | 'dashboard' | 'equipment' | 'scan' | 'checkouts' | 'events'
  | 'maintenance' | 'billing'
  | 'users' | 'roles' | 'categories' | 'eventTypes' | 'locations' | 'vendors';

const PAGE_PERMISSIONS: Record<RoleId, ReadonlyArray<PageId | '*'>> = {
  UpakaranAdmin:     ['*'],
  UpakaranCustodian: ['dashboard', 'equipment', 'scan', 'checkouts', 'events', 'maintenance', 'locations', 'eventTypes'],
  EventCoordinator:  ['dashboard', 'equipment', 'scan', 'checkouts', 'events', 'eventTypes'],
  MediaTeamMember:   ['dashboard', 'equipment', 'scan', 'checkouts', 'events'],
  UpakaranViewer:    ['*'],
};

const DEFAULT_CUSTOM_ROLE_PAGES: ReadonlyArray<PageId> = [
  'dashboard', 'equipment', 'scan', 'checkouts', 'events',
];

const ACTION_PERMISSIONS: Record<ActionId, ReadonlyArray<RoleId>> = {
  'equipment.create':          ['UpakaranAdmin', 'UpakaranCustodian'],
  'equipment.edit':            ['UpakaranAdmin', 'UpakaranCustodian'],
  'equipment.retire':          ['UpakaranAdmin'],
  'equipment.reportCondition': ['UpakaranAdmin', 'UpakaranCustodian', 'EventCoordinator', 'MediaTeamMember'],
  'checkout.create':           ['UpakaranAdmin', 'UpakaranCustodian', 'EventCoordinator', 'MediaTeamMember'],
  'checkout.return':           ['UpakaranAdmin', 'UpakaranCustodian'],
  'event.create':              ['UpakaranAdmin', 'EventCoordinator'],
  'event.edit':                ['UpakaranAdmin', 'EventCoordinator'],
  'event.checklist':           ['UpakaranAdmin', 'EventCoordinator', 'UpakaranCustodian'],
  'event.bulkOps':             ['UpakaranAdmin', 'EventCoordinator', 'UpakaranCustodian'],
  'maintenance.create':        ['UpakaranAdmin', 'UpakaranCustodian'],
  'maintenance.manage':        ['UpakaranAdmin', 'UpakaranCustodian'],
  'masters.manage':            ['UpakaranAdmin'],
};

export const isBuiltInRole = (id: RoleId): boolean =>
  Object.prototype.hasOwnProperty.call(PAGE_PERMISSIONS, id);

/**
 * Resolve a user's effective role IDs (custom roles → BasedOn template).
 */
function effectiveRoleIds(user: User | null, allRoles: Role[]): RoleId[] {
  if (!user) return [];
  const out: RoleId[] = [];
  for (const rid of user.Roles) {
    if (isBuiltInRole(rid)) {
      out.push(rid);
    } else {
      const custom = allRoles.find(r => r.Id === rid);
      if (custom?.BasedOn) out.push(custom.BasedOn);
    }
  }
  return out;
}

export function canViewPage(user: User | null, page: PageId, allRoles: Role[]): boolean {
  if (!user) return false;
  if (user.Roles.length === 0) return page === 'dashboard';
  return user.Roles.some(rid => {
    let pages = PAGE_PERMISSIONS[rid];
    if (!pages) {
      // Custom role
      const custom = allRoles.find(r => r.Id === rid);
      if (custom?.BasedOn) pages = PAGE_PERMISSIONS[custom.BasedOn];
    }
    if (!pages) return DEFAULT_CUSTOM_ROLE_PAGES.includes(page);
    return pages.includes('*') || pages.includes(page);
  });
}

export function canDoAction(user: User | null, action: ActionId, allRoles: Role[]): boolean {
  if (!user) return false;
  const allowed = ACTION_PERMISSIONS[action];
  if (!allowed) return false;
  const effective = effectiveRoleIds(user, allRoles);
  return effective.some(rid => allowed.includes(rid));
}
