import Link from 'next/link';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import { Reveal } from '@/components/store/StoreMotion';

export interface InfoSection {
  heading: string;
  body: string[];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Shared editorial shell for FAQ, shipping, returns, privacy, terms and support. */
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
    <div className="min-h-screen bg-paper">
      <div className="container-page max-w-5xl pb-16 pt-7">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-ink-subtle transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to store
        </Link>

        <header className="mt-5 border-b border-line pb-6">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[rgb(var(--color-brand))]">
              Mentoos · Help centre
            </p>
          </Reveal>
          <Reveal delay={70}>
            <h1 className="mt-2 max-w-2xl text-[25px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[31px]">
              {title}
            </h1>
          </Reveal>
          {intro && (
            <Reveal delay={130}>
              <p className="mt-2.5 max-w-xl text-[12.5px] leading-relaxed text-ink-muted">{intro}</p>
            </Reveal>
          )}
        </header>

        <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-[196px_minmax(0,1fr)]">
          {/* Sticky index — jumps to each section without a page reload */}
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-ink-subtle">On this page</p>
              <ul className="mt-3 space-y-1.5 border-l border-line">
                {sections.map((section) => (
                  <li key={section.heading}>
                    <a
                      href={`#${slug(section.heading)}`}
                      className="-ml-px block border-l border-transparent py-1 pl-3 text-[11.5px] leading-snug text-ink-muted transition-colors hover:border-brand hover:text-ink"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="max-w-2xl">
            <div className="divide-y divide-line">
              {sections.map((section, index) => (
                <Reveal key={section.heading} delay={Math.min(index * 45, 180)}>
                  <section id={slug(section.heading)} className="scroll-mt-24 py-5 first:pt-0">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[9.5px] font-bold tabular-nums tracking-[0.18em] text-ink-subtle">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2 className="text-[14.5px] font-bold tracking-tight text-ink">{section.heading}</h2>
                    </div>
                    <div className="mt-2 space-y-2 pl-[26px]">
                      {section.body.map((paragraph, i) => (
                        <p key={i} className="text-[12.5px] leading-relaxed text-ink-muted">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                </Reveal>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-[rgb(var(--color-brand))]">
                  <LifeBuoy className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[12.5px] font-bold text-ink">Still need help?</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">
                    Email{' '}
                    <a className="font-semibold text-[rgb(var(--color-brand))] underline decoration-1 underline-offset-2" href="mailto:support@mentoos.in">
                      support@mentoos.in
                    </a>{' '}
                    or read the{' '}
                    <Link className="font-semibold text-[rgb(var(--color-brand))] underline decoration-1 underline-offset-2" href="/contact">
                      contact page
                    </Link>
                    .
                  </p>
                </div>
              </div>
              <Link
                href="/track-order"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-ink/90"
              >
                Track an order
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
