import { addDays, addMinutes, isAfter } from 'date-fns';
import { isBoolean, isNull, isPlainObject, isUndefined } from 'es-toolkit';

import { UserRole } from '@/react-query/generated__types';

import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
  AUTH_ROLE,
} from '@/utils/constants';
import { isNil } from 'es-toolkit/compat';
import z from 'zod';
import { Session__Authenticated } from './types';

type AuthId = keyof Omit<Session__Authenticated, 'status'>;

type StoreValue = { [K in AuthId]?: Session__Authenticated[K] | null };
type AuthIdWithExpiration = Extract<AuthId, 'accessToken' | 'refreshToken'>;
type AuthIdWithoutExpiration = Exclude<AuthId, AuthIdWithExpiration>;

type StoreKey = AuthId;

function $(id: StoreKey) {
  const map: Record<StoreKey, string> = {
    accessToken: AUTH_ACCESS_TOKEN_STORAGE_KEY,
    refreshToken: AUTH_REFRESH_TOKEN_STORAGE_KEY,
    role: AUTH_ROLE,
  };

  return map[id];
}

type Store = {
  get: {
    (): Promise<StoreValue>;
    <T extends StoreKey>(key: T): Promise<StoreValue[T]>;
  };
  set: {
    (value: StoreValue): Promise<void>;
    <T extends AuthIdWithoutExpiration>(
      key: T,
      value: StoreValue[T],
    ): Promise<void>;
    <T extends AuthIdWithExpiration>(
      key: T,
      value: StoreValue[T],
      expires: number,
    ): Promise<void>;
  };
  del?: (...keys: [StoreKey, ...StoreKey[]]) => Promise<void>;
  clearSession: () => Promise<void>;
};

function set(key: string, value: string | boolean | null | undefined) {
  if (isUndefined(value)) return;

  if (isNull(value)) {
    return localStorage.removeItem(key);
  }

  if (isBoolean(value)) {
    if (value === true) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }

    return;
  }

  localStorage.setItem(key, value);
}

function setexp(
  key: string,
  val: string | boolean | null | undefined,
  exp: number,
) {
  if (isUndefined(val)) return;

  if (isNull(val)) {
    return localStorage.removeItem(key);
  }

  if (isBoolean(val)) {
    if (val === true) {
      localStorage.setItem(
        key,
        JSON.stringify({
          __v: 'true',
          __t: exp,
        }),
      );
    } else {
      localStorage.removeItem(key);
    }

    return;
  }

  return localStorage.setItem(
    key,
    JSON.stringify({
      __v: val,
      __t: exp,
    }),
  );
}

function getexp(key: string) {
  const value = localStorage.getItem(key);
  if (isNil(value)) return undefined;

  try {
    const obj = z
      .object({
        __v: z.string(),
        __t: z.number().transform((v) => new Date(v)),
      })
      .parse(JSON.parse(value));

    if (isAfter(obj.__t, new Date())) return obj.__v;
  } catch {
    /* empty */
  }

  localStorage.removeItem(key);
  return undefined;
}

function get(key: string) {
  const val = localStorage.getItem(key) || undefined;
  return val;
}
function del(...keys: string[]) {
  keys.forEach((key) => {
    localStorage.removeItem(key);
  });
}

const createStore = (): Store => {
  return {
    get(): Promise<StoreValue> {
      return new Promise<StoreValue>((resolve) => {
        const accessToken = getexp($('accessToken'));
        const refreshToken = getexp($('refreshToken'));
        const role = get($('role'));

        resolve({
          accessToken,
          refreshToken,
          role: role as UserRole,
        });
      });
    },
    set<T extends StoreKey>(
      arg0: StoreValue | T,
      _arg1?: StoreValue[T],
      _arg2?: number,
    ): Promise<void> {
      if (isPlainObject(arg0)) {
        return new Promise<void>((resolve) => {
          setexp(
            $('accessToken'),
            arg0.accessToken,
            addMinutes(new Date(), 15).getTime(),
          );
          setexp(
            $('refreshToken'),
            arg0.refreshToken,
            addDays(new Date(), 30).getTime(),
          );

          set($('role'), arg0.role);
          resolve();
        });
      }

      return new Promise<void>((resolve) => {
        resolve();
      });
    },
    del(...keys) {
      return new Promise((resolve) => {
        del(...keys.map((k) => $(k)));
        resolve();
      });
    },
    clearSession() {
      return new Promise((resolve) => {
        del($('role'), $('accessToken'), $('refreshToken'));
        resolve();
      });
    },
  };
};

export const store = createStore();
