import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface InfoSection {
  heading: string;
  body: string[];
}

export function InfoPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: string;
  sections: InfoSection[];
}) {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to store
        </Link>
      </Button>

      <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{title}</h1>
      {intro && <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">{intro}</p>}

      <div className="mt-8 space-y-7">
        {sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-lg font-extrabold tracking-tight">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <p className="font-bold">Still need help?</p>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Email <a className="font-semibold text-amber-700 dark:text-amber-400 hover:underline" href="mailto:support@mentoos.in">support@mentoos.in</a>{' '}
          or visit our <Link className="font-semibold text-amber-700 dark:text-amber-400 hover:underline" href="/contact">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
