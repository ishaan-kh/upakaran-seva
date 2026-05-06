import { Construction } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <div className="mb-5">
        <h1 className="fd text-2xl font-medium tracking-tight">{title}</h1>
      </div>
      <Card padded={false}>
        <EmptyState
          icon={Construction}
          title="Coming soon"
          message={
            description ??
            `${title} module will be ported from the prototype in the next release. The database schema, RLS policies, and storage are already in place.`
          }
        />
      </Card>
    </>
  );
}
