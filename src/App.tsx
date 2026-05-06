import { useRoutes, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/features/auth/AuthContext';
import { useCan } from '@/features/auth/useCan';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppLayout } from '@/components/AppLayout';
import { AccessDenied } from '@/components/AccessDenied';

import { DashboardPage } from '@/pages/DashboardPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

import { EquipmentListPage } from '@/features/equipment/EquipmentListPage';
import { EquipmentDetailPage } from '@/features/equipment/EquipmentDetailPage';

import type { PageId } from '@/lib/permissions';

/** Wraps a page so it renders AccessDenied if the user can't see it. */
function Gated({ page, children }: { page: PageId; children: React.ReactNode }) {
  const { canSee } = useCan();
  return canSee(page) ? <>{children}</> : <AccessDenied />;
}

export function App() {
  const { session, loading, currentUser } = useAuth();

  // Bootstrap loading
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--tm)' }}>
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return useRoutes([
    {
      path: '/login',
      element: session ? <Navigate to="/" replace /> : <LoginPage />,
    },
    {
      path: '/',
      element: session
        ? currentUser
          ? <AppLayout />
          : <NoProfileGate />
        : <Navigate to="/login" replace />,
      children: [
        { index: true, element: <Gated page="dashboard"><DashboardPage /></Gated> },

        // Equipment (fully ported)
        { path: 'equipment',     element: <Gated page="equipment"><EquipmentListPage /></Gated> },
        { path: 'equipment/:id', element: <Gated page="equipment"><EquipmentDetailPage /></Gated> },

        // Pending modules (placeholders, schema ready)
        { path: 'checkouts',   element: <Gated page="checkouts"><PlaceholderPage title="Checkouts" /></Gated> },
        { path: 'events',      element: <Gated page="events"><PlaceholderPage title="Events" /></Gated> },
        { path: 'maintenance', element: <Gated page="maintenance"><PlaceholderPage title="Maintenance" /></Gated> },
        { path: 'billing',     element: <Gated page="billing"><PlaceholderPage title="Billing" /></Gated> },

        // Masters (admin only)
        { path: 'masters/users',        element: <Gated page="users"><PlaceholderPage title="Users" /></Gated> },
        { path: 'masters/roles',        element: <Gated page="roles"><PlaceholderPage title="Roles" /></Gated> },
        { path: 'masters/categories',   element: <Gated page="categories"><PlaceholderPage title="Categories" /></Gated> },
        { path: 'masters/event-types',  element: <Gated page="eventTypes"><PlaceholderPage title="Event Types" /></Gated> },
        { path: 'masters/locations',    element: <Gated page="locations"><PlaceholderPage title="Locations" /></Gated> },
        { path: 'masters/vendors',      element: <Gated page="vendors"><PlaceholderPage title="Vendors" /></Gated> },

        // 404
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ]);
}

/**
 * Shown when a user is authenticated in Supabase Auth but has no Users-table row,
 * or the row is inactive. Admin needs to set them up.
 */
function NoProfileGate() {
  const { session, signOut } = useAuth();
  return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-md text-center">
        <h1 className="fd text-2xl font-medium mb-2">Account not provisioned</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--tm)' }}>
          Your email <strong>{session?.user.email}</strong> is authenticated, but no active profile is linked.
          Please ask your admin to add you to the Users table.
        </p>
        <button
          onClick={signOut}
          className="text-sm px-4 py-2 rounded-lg border border-[var(--b)] bg-white"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
