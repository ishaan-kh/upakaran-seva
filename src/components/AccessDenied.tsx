import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function AccessDenied() {
  return (
    <Card padded={false}>
      <EmptyState
        icon={Lock}
        title="Access Denied"
        message="You don't have permission to view this page. Please contact your admin if you believe this is an error."
        action={
          <Link to="/">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </Card>
  );
}
