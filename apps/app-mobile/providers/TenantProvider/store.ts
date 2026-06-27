import * as SecureStore from 'expo-secure-store';
import { SELECTED_ORGANIZATION_STORAGE_KEY } from '@/utils/constants';
import type { SelectedOrganization } from './types';

export async function getSelectedOrganization(): Promise<SelectedOrganization | null> {
  try {
    const raw = await SecureStore.getItemAsync(SELECTED_ORGANIZATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SelectedOrganization;
    return { ...parsed, features: parsed.features ?? [] };
  } catch {
    return null;
  }
}

export async function saveSelectedOrganization(
  organization: SelectedOrganization,
): Promise<void> {
  await SecureStore.setItemAsync(
    SELECTED_ORGANIZATION_STORAGE_KEY,
    JSON.stringify(organization),
  );
}

export async function clearSelectedOrganization(): Promise<void> {
  await SecureStore.deleteItemAsync(SELECTED_ORGANIZATION_STORAGE_KEY);
}
