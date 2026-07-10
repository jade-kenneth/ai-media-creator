import { Building2, UserCog, UserX } from 'lucide-react';
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

const platformAreas = [
  {
    title: 'Organizations',
    description: 'Create tenants and manage their branding and feature flags.',
    href: '/super-admin/organizations',
    icon: Building2,
  },
  {
    title: 'Admin accounts',
    description: 'Provision and maintain organization administrator access.',
    href: '/super-admin/admin-accounts',
    icon: UserCog,
  },
  {
    title: 'Deletion requests',
    description: 'Review user requests for permanent account removal.',
    href: '/super-admin/account-deletion-requests',
    icon: UserX,
  },
] as const;

export function SuperAdminDashboardPageView() {
  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {platformAreas.map(({ description, href, icon: Icon, title }) => (
        <Card key={href}>
          <CardHeader>
            <Icon aria-hidden="true" />
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This foundation is available without any product-specific module.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href={href}>Open {title.toLowerCase()}</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
}
