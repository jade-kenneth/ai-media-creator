export type SelectedOrganization = {
  address: string | null;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  organizationLogoUrl: string | null;
  contactNumber: string | null;
  primaryColor: string | null;
  features: string[];
};
