import { useSession } from '@/hooks/use-session';
import { useMeQuery } from '@/react-query/auth/auth-operations';
import { useMyProfileQuery } from '@/react-query/profile/profile-operations';

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function fallbackNameFromEmail(email?: string | null) {
  const local = email?.split('@')[0]?.trim();
  if (!local) return { firstName: 'Member', fullName: 'Member' };

  const parts = local
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const firstName = titleCase(parts[0] ?? local);
  const fullName = titleCase(parts.join(' ') || local);

  return { firstName, fullName };
}

export function useProfileName() {
  const session = useSession();
  const enabled = session.status === 'authenticated';
  const profileQuery = useMyProfileQuery(undefined, { enabled });
  const meQuery = useMeQuery(undefined, { enabled });

  const profile = profileQuery.data?.myProfile;
  const fallback = fallbackNameFromEmail(profile?.user?.email ?? meQuery.data?.me?.email);
  const firstName = profile?.firstName?.trim() || fallback.firstName;
  const fullName = profile?.fullName?.trim()
    || [profile?.firstName, profile?.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ')
    || fallback.fullName;

  return {
    firstName,
    fullName,
    profile,
    isLoaded: profileQuery.isFetched || meQuery.isFetched,
    isLoading: profileQuery.isLoading || meQuery.isLoading,
  };
}
