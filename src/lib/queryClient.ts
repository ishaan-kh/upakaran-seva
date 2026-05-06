import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s — most masters change rarely
      gcTime: 5 * 60_000,       // 5 min in cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query keys — central registry to avoid typos
export const qk = {
  // Masters
  roles:        ['roles'] as const,
  categories:   ['categories'] as const,
  users:        ['users'] as const,
  user:         (id: string) => ['users', id] as const,
  locations:    ['locations'] as const,
  vendors:      ['vendors'] as const,
  eventTypes:   ['eventTypes'] as const,

  // Equipment
  equipment:    ['equipment'] as const,
  equipmentItem:(id: string) => ['equipment', id] as const,
  conditionLogs:(equipmentId: string) => ['conditionLogs', equipmentId] as const,

  // Operations
  checkouts:    ['checkouts'] as const,
  events:       ['events'] as const,
  eventDetail:  (id: string) => ['events', id] as const,
  checklist:    (eventId: string) => ['checklist', eventId] as const,
  tickets:      ['tickets'] as const,
  ticket:       (id: string) => ['tickets', id] as const,

  // Auth
  currentUser:  ['auth', 'currentUser'] as const,
} as const;
