import { Platform } from 'react-native';

export function isPlatform(platform: 'android' | 'ios' | 'web') {
  return Platform.OS === platform;
}
