import { UserRole } from '@/react-query/generated__types';
import { Merge } from 'type-fest';

export type Session__Authenticated = {
  accessToken: string;
  refreshToken: string | null | undefined;
  status: 'authenticated';
  role: UserRole;
};

export type Session__Unauthenticated = Merge<
  { [K in keyof Session__Authenticated]?: never },
  { status: 'unauthenticated' }
>;

export type Session__Error = Merge<
  { [K in keyof Session__Authenticated]?: never },
  { status: 'error' }
>;

export type Session__Loading = Merge<
  { [K in keyof Session__Authenticated]?: never },
  { status: 'loading' }
>;

export type Session =
  | Session__Authenticated
  | Session__Unauthenticated
  | Session__Error;

export type LazySession =
  | Session__Authenticated
  | Session__Unauthenticated
  | Session__Loading
  | Session__Error;
