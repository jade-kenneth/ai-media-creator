import { addDays, addMinutes, isAfter } from 'date-fns';
import { isBoolean, isNull, isPlainObject, isUndefined } from 'es-toolkit';
import { isNil } from 'es-toolkit/compat';
import * as SecureStore from 'expo-secure-store';
import z from 'zod';

import { UserRole } from '@/react-query/generated__types';
import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
  AUTH_ROLE,
} from '@/utils/constants';

import { Session__Authenticated } from './type';

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
  if (isUndefined(value)) return Promise.resolve();

  if (isNull(value)) {
    return SecureStore.deleteItemAsync(key);
  }

  if (isBoolean(value)) {
    if (value === true) {
      return SecureStore.setItemAsync(key, 'true');
    } else {
      return SecureStore.deleteItemAsync(key);
    }
  }

  return SecureStore.setItemAsync(key, value);
}

function setexp(
  key: string,
  val: string | boolean | null | undefined,
  exp: number,
) {
  if (isUndefined(val)) return Promise.resolve();

  if (isNull(val)) {
    return SecureStore.deleteItemAsync(key);
  }

  if (isBoolean(val)) {
    if (val === true) {
      return SecureStore.setItemAsync(
        key,
        JSON.stringify({
          __v: 'true',
          __t: exp,
        }),
      );
    } else {
      return SecureStore.deleteItemAsync(key);
    }
  }

  return SecureStore.setItemAsync(
    key,
    JSON.stringify({
      __v: val,
      __t: exp,
    }),
  );
}

async function getexp(key: string) {
  const value = await SecureStore.getItemAsync(key);
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

  await SecureStore.deleteItemAsync(key);
  return undefined;
}

async function get(key: string) {
  const val = await SecureStore.getItemAsync(key);
  return val || undefined;
}

function del(...keys: string[]) {
  return Promise.all(
    keys.map((key) => {
      return SecureStore.deleteItemAsync(key);
    }),
  ).then(() => undefined);
}

const createStore = (): Store => {
  return {
    get(): Promise<StoreValue> {
      return new Promise<StoreValue>(async (resolve) => {
        const accessToken = await getexp($('accessToken'));
        const refreshToken = await getexp($('refreshToken'));
        const role = await get($('role'));

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
        return new Promise<void>(async (resolve) => {
          await setexp(
            $('accessToken'),
            arg0.accessToken,
            addMinutes(new Date(), 15).getTime(),
          );
          await setexp(
            $('refreshToken'),
            arg0.refreshToken,
            addDays(new Date(), 30).getTime(),
          );

          await set($('role'), arg0.role);
          resolve();
        });
      }

      return new Promise<void>((resolve) => {
        resolve();
      });
    },
    del(...keys) {
      return new Promise(async (resolve) => {
        await del(...keys.map((k) => $(k)));
        resolve();
      });
    },
    clearSession() {
      return new Promise(async (resolve) => {
        await del($('role'), $('accessToken'), $('refreshToken'));
        resolve();
      });
    },
  };
};

export const store = createStore();
