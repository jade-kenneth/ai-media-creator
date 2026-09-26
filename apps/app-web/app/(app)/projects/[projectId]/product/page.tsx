import type { Metadata } from 'next';

import { ProductPage } from '@/features/product-setup/product-page';

export const metadata: Metadata = { title: 'Product' };

export default function Page() {
  return <ProductPage />;
}
