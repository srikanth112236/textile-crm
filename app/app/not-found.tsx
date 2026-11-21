import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-8 text-center shadow-soft">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand">404</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">This page could not be found</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          The link may have moved. Head back to the storefront or search for what you need.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild className="bg-slate-950 text-white hover:bg-amber-500 hover:text-slate-950">
            <Link href="/"><Home className="mr-2 h-4 w-4" /> Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search"><Search className="mr-2 h-4 w-4" /> Search</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/products"><ShoppingBag className="mr-2 h-4 w-4" /> Shop all</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
