import ProductImportWizard from '@/components/admin/products/ProductImportWizard';

export const metadata = {
  title: 'Bulk Import Products | Admin',
  description: 'Upload a CSV and import products in bulk.',
};

export default function ProductImportPage() {
  return (
    <div className="p-4">
      <ProductImportWizard />
    </div>
  );
}
