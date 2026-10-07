import type { ReactNode } from 'react';

export function AuthPageLayout({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <section className="shell pt-44 pb-20 sm:pt-36 md:pt-44 lg:pt-52 lg:pb-28" aria-labelledby="auth-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-20 xl:gap-32">
        <div>
          <h1 id="auth-title" className="max-w-[14ch] font-serif text-4xl leading-tight font-light tracking-[-0.03em] sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="text-text-secondary mt-5 max-w-[36ch] text-base leading-relaxed sm:text-lg">{lede}</p>
        </div>
        <div className="border-border-editorial border-t pt-8 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">{children}</div>
      </div>
    </section>
  );
}
