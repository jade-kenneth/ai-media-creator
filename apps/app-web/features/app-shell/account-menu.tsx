'use client';

import { LogOutIcon } from 'lucide-react';
import { useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/providers/AuthProvider';
import { useCurrentQuery } from '@/react-query/auth/auth-operations';
import { buildLoginRedirectUrl, redirectToPath } from '@/react-query/session';

export function useAccountName() {
  const me = useCurrentQuery();
  const user = me.data?.me;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return {
    email: user?.email ?? '',
    name: name || user?.email || '',
    initials:
      [user?.firstName, user?.lastName]
        .filter(Boolean)
        .map((part) => part?.charAt(0).toUpperCase())
        .join('') || (user?.email?.charAt(0).toUpperCase() ?? ''),
  };
}

/** Avatar and account menu: name, email, “Signed in with Google”, Sign out. */
export function AccountMenu() {
  const account = useAccountName();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;

    setSigningOut(true);
    await logout();
    redirectToPath(buildLoginRedirectUrl('signed-out'));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${account.name}`}
          className="press flex size-8 items-center justify-center rounded-full bg-flare-soft text-small font-semibold text-flare-text hover:ring-2 hover:ring-border max-lg:size-10"
        >
          {account.initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2">
          <span className="t-label text-ink">{account.name}</span>
          <span className="t-sm truncate text-ink-2">{account.email}</span>
          <span className="t-caption text-ink-3">Signed in with Google</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={signingOut}
            onSelect={(event) => {
              event.preventDefault();
              void signOut();
            }}
          >
            {signingOut ? <Spinner /> : <LogOutIcon />}
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
