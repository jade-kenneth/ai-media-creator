import { Bell, Building2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function DashboardPageView() {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <Building2 aria-hidden="true" />
          <CardTitle>Organization workspace</CardTitle>
          <CardDescription>
            This neutral dashboard is ready for the modules your application
            needs. Tenant identity and authenticated routing are already wired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="text-primary" />
              Organization-scoped authentication
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="text-primary" />
              Role-protected admin routes
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Bell aria-hidden="true" />
          <CardTitle>Push delivery</CardTitle>
          <CardDescription>
            Register a device token and verify push-notification delivery from
            the reusable notification infrastructure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The tester can target one user or the registered devices in the
            current organization.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/admin/push-tester">Open push tester</Link>
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
