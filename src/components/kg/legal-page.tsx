import type { ReactNode } from "react";

export type LegalSection = { heading: string; body: ReactNode };

/**
 * Shared shell for /terms and /privacy, which the frames draw identically:
 * an 800px column, a lede that states the short version, then sections
 * separated by a hairline rule.
 */
export function LegalPage({
  title,
  effective,
  lede,
  sections,
}: {
  title: string;
  effective: string;
  lede: string;
  sections: LegalSection[];
}) {
  return (
    <article className="kg-legal">
      <p className="kg-eyebrow">LEGAL</p>
      <h1>{title}</h1>
      <p className="kg-legal-effective">{effective}</p>
      <p className="kg-legal-lede">{lede}</p>
      {sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </article>
  );
}
