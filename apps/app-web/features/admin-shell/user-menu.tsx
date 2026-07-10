'use client';

import { ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/providers/AuthProvider';
import { useCurrentQuery } from '@/react-query/auth/auth-operations';
import { redirectToLogin } from '@/react-query/session';
import { ADMIN_EMAIL, ADMIN_NAME, getInitials } from './admin-config';

export function UserMenu() {
  const user = useCurrentQuery();
  const email = user?.data?.me.email ?? ADMIN_EMAIL;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const t = useTranslations('Common');

  function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    void logout().finally(() => {
      redirectToLogin('signed-out');
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-2 rounded-full border-border/70 bg-background/80 px-2 shadow-sm"
        >
          <Avatar size="sm">
            <AvatarFallback>{getInitials(ADMIN_NAME)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">
            {ADMIN_NAME}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-1">
          <div className="text-sm font-medium text-foreground">
            {ADMIN_NAME}
          </div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onSelect={handleSignOut}
        >
          <LogOut className="size-4" />
          {isSigningOut ? t('signingOut') : t('logOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
