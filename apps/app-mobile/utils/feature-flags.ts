export const FEATURE_FLAGS = {
  MOBILE_AUTH: 'mobile_auth',
  MEMBER_PROFILE: 'member_profile',
  MOBILE_REQUESTS: 'mobile_requests',
  OFFICIALS: 'officials',
  ADMIN_GALLERY: 'admin_gallery',
  MOBILE_GALLERY: 'mobile_gallery',
  ADMIN_MEMBERS: 'admin_members',
  ADMIN_REQUESTS: 'admin_requests',
  COMMUNITY_POLLS: 'community_polls',
} as const;

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];
