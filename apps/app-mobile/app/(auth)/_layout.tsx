import { useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

import {
  organizationsQueryKeys,
  organizationsRequest,
} from '@/react-query/organizations/organizations-operations';

export default function AuthLayout() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: organizationsQueryKeys.list({ filter: { isActive: true } }),
      queryFn: () => organizationsRequest({ filter: { isActive: true } }).then((r) => {
        if (r.ok) return r.data;
        throw new Error(r.error.message);
      }),
      staleTime: 24 * 60 * 60 * 1000,
    });
  }, [queryClient]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="organization-picker"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen
        name="registration-pending"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="registration-rejected"
        options={{ gestureEnabled: false }}
      />
    </Stack>
  );
}
