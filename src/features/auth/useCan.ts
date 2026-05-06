import { useCallback } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { canDoAction, canViewPage, type ActionId, type PageId } from '@/lib/permissions';

/**
 * Hook returning two checkers based on the current user's roles.
 *
 * Usage:
 *   const { can, canSee } = useCan();
 *   {can('equipment.create') && <Button>Add</Button>}
 *   {canSee('billing') && <NavLink to="/billing">Billing</NavLink>}
 */
export function useCan() {
  const { currentUser, roles } = useAuth();

  const can = useCallback(
    (action: ActionId) => canDoAction(currentUser, action, roles),
    [currentUser, roles]
  );

  const canSee = useCallback(
    (page: PageId) => canViewPage(currentUser, page, roles),
    [currentUser, roles]
  );

  return { can, canSee };
}
