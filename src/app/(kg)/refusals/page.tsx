import type { Metadata } from "next";
import { StatsStrip } from "@/components/kg/primitives";
import { LiveToken } from "@/components/kg/live-token";
import { DataTable } from "@/components/kg/data-table";
import {
  formatInt,
  getCorpus,
  getQuestionCount,
  getRefusalsReviewDefault,
  type RefusalsLayer1,
} from "@/lib/kg/fixtures";

export const metadata: Metadata = {
  title: "Refusal rate — KnownGate",
  description: "How often we decline. Counted across both kinds of premise.",
};

export default async function RefusalsPage({
  searchParams,
}: {
  searchParams: Promise<{ layer1?: string }>;
}) {
  const sp = await searchParams;
  const requested = sp.layer1;
  const layer1: RefusalsLayer1 =
    requested === "zero" || requested === "low_n" || requested === "steady"
      ? requested
      : getRefusalsReviewDefault();
  const c = getCorpus();
  const qCount = getQuestionCount();

  return (
    <>
      <header className="kg-hero">
        <p className="kg-eyebrow">REFUSAL RATE</p>
        <h1>How often we decline.</h1>
        <p className="lead">
          Most of what we are asked about does not clear. This page says how much, why, and what would have to
          change. Counted across both kinds of premise, what must be absent and what must stay under a number.
        </p>
      </header>

      <section className="kg-section">
        <h2>A high refusal rate is the product working.</h2>
        <p className="sub">
          That is a convenient thing for us to say, so here is the reasoning rather than the assertion. Check
          it against the numbers underneath.
        </p>
        <div className="kg-grid-3">
          <article className="kg-tile">
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>1</div>
            <strong>A checker that clears everything</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              is indistinguishable from no checker at all. If every item comes back fine, the answer carries no
              information and you would be better off not asking.
            </p>
          </article>
          <article className="kg-tile">
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>2</div>
            <strong>So the clears are worth exactly</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              what the refusals cost. Every refusal costs us coverage, disappoints a user, and will eventually
              disappoint someone paying. That cost is what makes an approval mean something.
            </p>
          </article>
          <article className="kg-tile">
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>3</div>
            <strong>Which is why we publish the number</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              and why we do not work to bring it down. The easy way to improve it is to clear on thinner
              evidence, and that would make the figure look better while making every verdict worth less.
            </p>
          </article>
        </div>
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>The test you should apply to us.</strong>
          <p>
            If this figure falls sharply and coverage has not risen, we have started clearing on thinner
            evidence. That is the failure to watch for, it is visible on this page, and you should tell us
            about it.
          </p>
        </div>
      </section>

      <div className="kg-photo">
        <div className="kg-photo-ph">IMAGE · PHOTOGRAPH · A SHELF, MID-CHECK</div>
      </div>

      <section className="kg-section">
        <p className="kg-eyebrow">LAYER 1 · LIVE</p>
        <h2>What has been ruled since launch</h2>
        <p className="sub">
          Straight from GET /v0/stats. Zero is a true number and this page is built to show it.
        </p>
        <div className="kg-chips" style={{ marginBottom: 20 }}>
          <span className="kg-chip">rolling 30 days</span>
          <span className="kg-chip">updated daily</span>
          <span className="kg-chip">since 30 Aug 2026</span>
        </div>
        <StatsStrip
          state={layer1}
          counts={
            layer1 === "steady"
              ? {
                  couldnt_verify: "live",
                  ask_one_question: "live",
                  conflict_found: "live",
                  no_conflict_found: "live",
                }
              : layer1 === "low_n"
                ? {
                    couldnt_verify: 89,
                    ask_one_question: 52,
                    conflict_found: 41,
                    no_conflict_found: 32,
                    total: 214,
                  }
                : undefined
          }
        />
      </section>

      <section className="kg-section">
        <div className="kg-callout">
          <strong>
            On 30–31 Aug we found 63,601 rows in our own corpus recording “may contain” as “contains”.
          </strong>
          <p>
            We fixed the reading and re-derived every affected row. This page exists so that kind of error has
            nowhere to hide.
          </p>
        </div>
      </section>

      <section className="kg-section">
        <p className="kg-eyebrow">LAYER 2 · CORPUS</p>
        <h2>Why the gap exists</h2>
        <p className="sub">
          Measured over our evidence corpus, every menu item and product we hold, ruled against each FDA-9
          restriction. Dated, reproducible, and independent of traffic.
        </p>
        <p className="kg-corpus-stamp">
          <strong>Measured {c.measured_at}</strong>
          <span>against production evidence</span>
          <span>
            · {formatInt(c.products)} products · {c.metros} metros
          </span>
        </p>
        <p className="sub">
          {formatInt(c.allergen_findings.count)} ({c.allergen_findings.pct}%) carry ≥1 allergen finding — the
          other {c.allergen_findings.shop_refusal_pct}% is the shop arm&apos;s refusal rate.{" "}
          {formatInt(c.nutrition_panels.count)} ({c.nutrition_panels.pct}%) have a typed nutrition panel ·{" "}
          {c.nutrition_panels.serving_basis_pct}% of panels state a serving basis · trans fat quantified on
          only {c.nutrition_panels.trans_fat_pct}% of panels · added sugar on {c.nutrition_panels.added_sugar_pct}
          %.
        </p>
        <p className="sub" style={{ marginTop: 12 }}>
          Eat-out: {c.eat_out.chains_publish} chains publish; {c.eat_out.machine_readable} are
          machine-readable — {formatInt(c.eat_out.dishes_ruled)} dishes ruled;{" "}
          {c.eat_out.published_not_machine_readable} are &quot;published, not machine-readable&quot; · sit-down
          lane: {c.eat_out.sit_down_venues} venues, {formatInt(c.eat_out.sit_down_items)} items,{" "}
          {formatInt(c.eat_out.sit_down_findings)} findings, {c.eat_out.sit_down_presence_only_pct}%
          presence-only.
        </p>
        <DataTable
          headers={["Cause", "Share of refusals", "Who could close it"]}
          rows={[
            {
              cells: [
                "No preparation evidence published",
                `${c.allergen_findings.shop_refusal_pct}% shop arm`,
                "The venue or the manufacturer, by filing a statement.",
              ],
            },
            {
              cells: [
                "Collective terms on the label",
                "Corpus-derived",
                "The manufacturer, by naming the source of the flavoring.",
              ],
            },
            {
              cells: [
                "No label exists at all",
                "Corpus-derived",
                "Nobody, in-store bakery, deli counter, a home kitchen.",
              ],
            },
            {
              cells: [
                "No fixed recipe",
                "Corpus-derived",
                "Nobody, a daily special changes by definition.",
              ],
            },
            {
              cells: [
                "Venue could not be resolved",
                "Corpus-derived",
                "The agent, by confirming which venue it meant.",
              ],
            },
            {
              cells: [
                "Question raised, unanswered",
                "Corpus-derived",
                "The kitchen, at the table.",
              ],
            },
            {
              cells: [
                "No nutrition panel exists",
                `${100 - c.nutrition_panels.pct}% of products`,
                "Nobody, a made-on-site item has none. A finding, not a failure.",
              ],
            },
            {
              cells: [
                "Panel present, serving basis unstated",
                `${100 - c.nutrition_panels.serving_basis_pct}% of panels`,
                "The manufacturer, by stating whether the figure is per serving or per 100g.",
              ],
            },
            {
              cells: [
                "Panel older than the current formulation",
                "Corpus-derived",
                "The manufacturer, by dating the panel they publish.",
              ],
            },
          ]}
        />
      </section>

      <section className="kg-section">
        <h2>By arm, and by premise type</h2>
        <p className="sub">
          Where a question can be asked, the refusal rate falls sharply. Numeric premises refuse far less often
          than absence premises, because a panel is a single source that either exists or does not.
        </p>
        <DataTable
          headers={["Arm", "Couldn't verify", "Why"]}
          rows={[
            {
              cells: [
                "Shop · packaged",
                `${c.allergen_findings.shop_refusal_pct}%`,
                "A label is a legal declaration. Most products resolve.",
              ],
            },
            {
              cells: [
                "Eat out",
                `${c.eat_out.published_not_machine_readable} of ${c.eat_out.chains_publish} charts unreadable`,
                "A person is present, so questions convert into answers.",
              ],
            },
            {
              cells: [
                "Cook",
                { held: true },
                "Preparation is the household’s own kitchen and is not ruled.",
              ],
            },
            {
              cells: [
                "Order in",
                { held: true },
                "No kitchen reachable. An unanswered question stays unanswered.",
              ],
            },
            {
              cells: [
                "Potluck",
                { held: true },
                "No venue, no label, no barcode. The normal case, not the failure case.",
              ],
            },
            {
              cells: [
                "Packaged · numeric threshold",
                `${formatInt(c.nutrition_panels.count)} panels · ${c.nutrition_panels.pct}%`,
                "One source, and 305,000 panels are rulable. The lowest refusal rate in the product.",
              ],
            },
            {
              cells: [
                "Restaurant dish · numeric threshold",
                `${c.eat_out.sit_down_presence_only_pct}% presence-only`,
                "Almost no venue publishes a panel. Structurally the highest, and honestly so.",
              ],
            },
          ]}
        />
        <p style={{ marginTop: 20, fontSize: 14, color: "var(--kg-ink2)" }}>
          Corpus values above were measured {c.measured_at} against production. They are never estimates and
          never filled in by hand. Order-in and potluck are structural refusals — not covered by any source —
          not a fake zero.
        </p>
      </section>

      <section className="kg-section">
        <p className="sub" style={{ marginBottom: 0 }}>
          <LiveToken label="CORPUS" /> values are computed from production against the evidence corpus and
          stamped with the date they were derived. The measurement runs after the national catalog load
          lands, so these fill in late. They are never estimates and never filled in by hand.
        </p>
      </section>

      <section className="kg-section">
        <div className="kg-callout">
          <strong>We do not optimise this number down.</strong>
          <p>
            The obvious way to improve it is to clear things on thinner evidence. That would make the number
            look better and every verdict worth less. If this figure ever falls sharply without coverage
            rising, assume something is wrong and tell us.
          </p>
        </div>
        <h2 style={{ marginTop: 40 }}>What we do optimise</h2>
        <p className="sub">
          Coverage, not clearance. The refusal rate falls honestly only when more evidence exists.
        </p>
        <DataTable
          headers={["Metric", "Now", "Direction"]}
          rows={[
            {
              cells: [
                "Venues with a filed statement",
                "0",
                "the statements table shipped 30 Aug, empty, up from here",
              ],
            },
            {
              cells: [
                "Products resolving to a label",
                formatInt(c.products),
                "up",
              ],
            },
            {
              cells: [
                "Questions with a sufficient-answer rule",
                `${qCount} of ${qCount}`,
                "held at 100%",
              ],
            },
            {
              cells: ["Verdicts issued without a date", "0", "structurally impossible, held at zero"],
            },
          ]}
        />
      </section>
    </>
  );
}
