import { Metadata } from 'next';
import CategoryForm from './CategoryForm';

export const metadata: Metadata = {
  title: 'New Category | Admin',
  description: 'Create a new product category',
};

export default function NewCategoryPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Create New Category</h1>
        <p className="text-sm text-muted-foreground">Add a parent or sub-category with a clean, modern design.</p>
      </div>
      <CategoryForm />
    </div>
  );
}
