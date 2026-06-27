// import { AUTH_TOKEN_STORAGE_KEY } from '@/react-query/session';
// import { useSyncExternalStore } from 'react';

// export const authStore = {
//   getToken: () => {
//     if (typeof window === 'undefined') {
//       return null;
//     }
//     return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
//   },

//   subscribe: (callback: () => void) => {
//     window.addEventListener('storage', callback);

//     return () => {
//       window.removeEventListener('storage', callback);
//     };
//   },
// };

// export function useSyncAuthenticated() {
//   const token = useSyncExternalStore(
//     authStore.subscribe,
//     authStore.getToken,
//     () => null, // server: no localStorage
//   );

//   return token !== null;
// }
