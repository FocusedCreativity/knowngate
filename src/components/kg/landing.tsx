"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { knownGateClient } from "@/lib/knowngate/client";
import type { Restriction } from "@/lib/knowngate/contracts";
import type { LandingExamples } from "@/lib/kg/landing-data";
import { LANDING_RESULT_KEY } from "@/lib/kg/landing-handoff";

const RESTRICTIONS = [
  "milk",
  "egg",
  "fish",
  "shellfish",
  "tree nuts",
  "peanut",
  "wheat",
  "soy",
  "sesame",
  "+ other",
] as const;

const DONT = [
  "No ads",
  "No tracking",
  "No silos",
  "No personalization",
  "No quality scores",
  "No recommendations",
] as const;

function chipToKey(chip: string): Restriction["key"] {
  if (chip === "tree nuts") return "tree_nut";
  return chip as Restriction["key"];
}

function subjectFromInput(raw: string): { kind: "upc" | "product_query"; value: string } {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 8 && digits.length <= 14) {
    return { kind: "upc", value: digits.padStart(14, "0").slice(-14) };
  }
  return { kind: "product_query", value: trimmed };
}

function verdictClass(verdict: string): string {
  if (verdict === "conflict_found") return "shut";
  if (verdict === "no_conflict_found") return "clear";
  if (verdict === "ask_one_question") return "ask";
  return "held";
}

export function LandingPage({ examples }: { examples: LandingExamples }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(["peanut", "sesame"]);
  const [subject, setSubject] = useState("");
  const [sodium, setSodium] = useState("600");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(chip: string) {
    if (chip === "+ other") return;
    setSelected((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
    );
  }

  async function onCheck(e: FormEvent) {
    e.preventDefault();
    const value = subject.trim();
    if (!value) {
      setError("Add a product name, URL, or UPC.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const restrictions: Restriction[] = selected.map((chip) => ({ key: chipToKey(chip) }));
      const max = Number(sodium) || 600;
      const result = await knownGateClient.checkItem({
        restrictions,
        subject: subjectFromInput(value),
        thresholds: [
          {
            nutrient: "sodium",
            max,
            unit: "mg",
            basis: "per_serving",
          },
        ],
      });
      sessionStorage.setItem(LANDING_RESULT_KEY, JSON.stringify(result));
      const q = new URLSearchParams();
      q.set("mode", "human");
      q.set("step", "4");
      q.set("from", "landing");
      if (selected.length) q.set("restrictions", selected.join(","));
      q.set("subject", value);
      q.set("sodium", String(max));
      router.push(`/check?${q.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
      setBusy(false);
    }
  }

  const menu = examples.menu;

  return (
    <div className="kg-landing">
      <header className="kg-landing-hero">
        <div className="kg-landing-pill">
          <span className="kg-live-dot" aria-hidden />
          Free · no account to check · nothing stored unless you save a record
        </div>
        <h1>“It&apos;s fine.” Says who?</h1>
        <p className="lead">
          Tell us what can&apos;t be in it, or how much is too much. We check the label, the menu and the kitchen,
          and we say so when nobody knows.
        </p>
      </header>

      <section className="kg-landing-form-wrap">
        <form className="kg-landing-form" onSubmit={onCheck}>
          <div className="kg-landing-form-row">
            <span className="lbl">Can&apos;t be in it</span>
            <div className="kg-chip-row" style={{ margin: 0, flex: 1 }}>
              {RESTRICTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={`chip${selected.includes(chip) ? " on lime" : ""}`}
                  onClick={() => toggle(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="kg-landing-threshold">
            <span className="lbl">How much is too much</span>
            <span className="plain">Keep</span>
            <span className="chip on lime">sodium ▾</span>
            <span className="plain">under</span>
            <label className="kg-landing-amount">
              <input
                value={sodium}
                onChange={(e) => setSodium(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                aria-label="Sodium limit in mg"
              />
              <span>mg</span>
            </label>
            <span className="plain">per serving</span>
          </div>

          <hr />

          <div className="kg-landing-composer">
            <span className="kind">
              Product <span aria-hidden>▾</span>
            </span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Type a name, or paste a UPC"
              aria-label="Product to check"
              disabled={busy}
            />
            <button type="submit" className="kg-btn" disabled={busy}>
              {busy ? "Checking…" : "Check it"}
            </button>
          </div>

          {error ? <p className="kg-landing-error">{error}</p> : null}

          <div className="kg-landing-form-note">
            <p>Two kinds of promise: what can&apos;t be in it, and what it must stay under.</p>
            <p>Nothing stored unless you save a record.</p>
          </div>
        </form>
      </section>

      <section className="kg-landing-section">
        <h2>Whose job is it to check?</h2>
        <p className="sub center">
          Nobody&apos;s. Everyone who could check gains something by not checking, and you are the only person who
          loses when it turns out wrong.
        </p>
        <div className="kg-grid-4 kg-landing-claim-grid">
          <article className="kg-landing-claim">
            <p className="eyebrow">THE LABEL</p>
            <h3>“Low sodium.”</h3>
            <p>A regulated claim on the front of the pack. Almost nobody reads it back against the panel on the side.</p>
          </article>
          <article className="kg-landing-claim">
            <p className="eyebrow">THE MENU</p>
            <h3>“No nuts in this one.”</h3>
            <p>Written to sell a dish. It was never written as an allergen declaration and it does not work as one.</p>
          </article>
          <article className="kg-landing-claim">
            <p className="eyebrow">THE HOST</p>
            <h3>“It&apos;s fine, I made it myself.”</h3>
            <p>Meant sincerely. Made from memory an hour ago, not from four labels.</p>
          </article>
          <article className="kg-landing-claim">
            <p className="eyebrow">THE AGENT</p>
            <h3>“That looks fine for you.”</h3>
            <p>
              Fluent, instant, and answering from nothing. It sounds exactly the same when it knows and when it
              does not.
            </p>
          </article>
        </div>
        <div className="kg-landing-dark-band">
          <strong>“Verified” has been sold to you before.</strong>
          <p>
            A verified account saying “no cashews” tells you who is speaking. It does not tell you whether the
            sentence is true. Food is the same problem with a worse consequence.
          </p>
        </div>
      </section>

      <section className="kg-landing-section paper">
        <h2>What can I ask it?</h2>
        <p className="sub center">
          Two kinds of promise, one gate. Say what can&apos;t be in it, or how much is too much, and the gate
          rules against that and nothing else.
        </p>
        <div className="kg-grid-2">
          <article className="kg-landing-ask-card">
            <h3>
              <span className="dot clear" aria-hidden />
              What can&apos;t be in it
            </h3>
            <p className="intro">“No sesame.” “No cashews.” An allergen, or anything else you name.</p>
            <div className="axis-line">
              <strong>Composition</strong>
              <span>What the ingredient list declares</span>
            </div>
            <div className="axis-line">
              <strong>Preparation</strong>
              <span>Shared fryers, shared boards, the tray the bread was proved on</span>
            </div>
            <p className="foot">Both have to be covered. An ingredient list on its own never clears it.</p>
          </article>
          <article className="kg-landing-ask-card">
            <h3>
              <span className="dot clear" aria-hidden />
              What it must stay under
            </h3>
            <p className="intro">“Under 600mg of sodium.” “Under 10g of added sugar.” A number, per serving.</p>
            <div className="axis-line">
              <strong>The panel</strong>
              <span>What the nutrition panel declares, per serving, with the date it was read</span>
            </div>
            <p className="foot">One source. It either clears the number or it does not.</p>
          </article>
        </div>
        <p className="kg-landing-center-line">
          Either way you get the same thing back: what we found, where it came from, and the date we read it.
        </p>
      </section>

      <section className="kg-landing-section">
        <h2>One item, one menu, or a whole week.</h2>
        <p className="sub center">
          Same gate, same four answers, whatever you point it at. The evidence changes. The discipline doesn&apos;t.
        </p>

        <p className="kg-eyebrow" style={{ textAlign: "left", width: "100%", maxWidth: 1100 }}>
          A PRODUCT · AGAINST A NUMBER · SODIUM UNDER 600 MG PER SERVING
        </p>
        <div className="kg-grid-3 kg-landing-examples">
          {examples.products.map((p) => {
            const cls = verdictClass(p.verdict);
            return (
              <article key={p.upc} className={`kg-landing-example ${cls}`}>
                <div className="ph">NUTRITION PANEL</div>
                <div className="name">
                  <span className={`dot ${cls}`} aria-hidden />
                  {p.name}
                </div>
                <p className={`verdict ${cls}`}>{p.verdictLabel}</p>
                <p>{p.detail}</p>
                <div className="kg-chip-row">
                  {p.chips.map((c) => (
                    <span key={c} className={`chip${c.startsWith("sodium") && cls === "shut" ? " shut" : ""}`}>
                      {c}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        {menu ? (
          <>
            <p
              className="kg-eyebrow"
              style={{ textAlign: "left", width: "100%", maxWidth: 1100, marginTop: 36 }}
            >
              A MENU · AGAINST AN ALLERGEN · {menu.venueName.toUpperCase()} · {menu.premiseLine.toUpperCase()}
            </p>
            <div className="kg-landing-menu-card">
              <div className="kg-landing-menu-head">
                <div>
                  <strong>{menu.venueName}</strong>
                  <p>
                    {menu.itemCount} dishes ruled · {menu.counts.conflict_found} conflict found ·{" "}
                    {menu.counts.ask_one_question} ask one question
                    {menu.readDate ? ` · read ${menu.readDate}` : ""}
                  </p>
                </div>
                {menu.sourceName ? <span className="chip">{menu.sourceName}</span> : null}
              </div>
              <ul className="kg-landing-menu-list">
                {menu.notable.map((n) => {
                  const cls = verdictClass(n.verdict);
                  return (
                    <li key={n.name}>
                      <span className={`dot ${cls}`} aria-hidden />
                      <div>
                        <strong>{n.name}</strong>
                        <span className={`verdict ${cls}`}>{n.verdictLabel}</span>
                        {n.line ? <p>{n.line}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : null}

        <div className="kg-landing-week">
          <strong>A whole week, in one call.</strong>
          <p>
            Up to 25 things at once, a recipe&apos;s ingredients, a shopping basket, seven days of meals. One
            ruling per item, all of them dated.
          </p>
          <Link className="kg-btn quiet" href="/developers">
            View the API
          </Link>
        </div>
      </section>

      <section className="kg-landing-section paper">
        <h2>What if it doesn&apos;t know?</h2>
        <p className="sub center">
          It tells you. Four answers come back, and two of them are not answers at all. That is the part every
          other product leaves out.
        </p>
        <div className="kg-grid-4">
          <article className="kg-landing-verdict">
            <span className="dot clear" aria-hidden />
            <strong>No conflict found</strong>
            <p>Both kinds of evidence were covered. You get the source and the date it was read.</p>
          </article>
          <article className="kg-landing-verdict">
            <span className="dot shut" aria-hidden />
            <strong>Conflict found</strong>
            <p>It is present, or it is over the number. Named, sourced, and dated.</p>
          </article>
          <article className="kg-landing-verdict">
            <span className="dot ask" aria-hidden />
            <strong>Ask one question</strong>
            <p>One thing is missing. You get the exact question and what a real answer sounds like.</p>
          </article>
          <article className="kg-landing-verdict">
            <span className="dot held" aria-hidden />
            <strong>Couldn&apos;t verify</strong>
            <p>Nobody can answer this. We say so rather than guess, and it stays open.</p>
          </article>
        </div>
        <div className="kg-grid-3" style={{ marginTop: 20 }}>
          <article className="kg-landing-claim">
            <h3>What counts as proof</h3>
            <p>
              In full, at <Link href="/standard">/standard</Link>. You can check our reasoning, not only our
              answer.
            </p>
          </article>
          <article className="kg-landing-claim">
            <h3>A high refusal rate is the product working</h3>
            <p>
              A verifier that clears everything is worth nothing. We publish the share we decline on{" "}
              <Link href="/refusals">/refusals</Link>.
            </p>
          </article>
          <article className="kg-landing-claim">
            <h3>We published our own mistake</h3>
            <p>
              In August we found 63,601 rows in our own records reading “may contain” as “contains”. We fixed it
              and said so.
            </p>
          </article>
        </div>
      </section>

      <section className="kg-landing-section">
        <h2>Then what do I do?</h2>
        <p className="sub center">
          When one thing is missing, the gate hands you the question rather than a shrug, and tells you what a
          real answer sounds like.
        </p>
        <div className="kg-grid-2">
          <article className="kg-landing-q">
            <p className="code">Q-PREP-01</p>
            <p className="q">
              “Is {"{item}"} prepared with, or on shared equipment with, anything containing {"{allergen}"}?”
            </p>
            <p className="what">
              What counts: An explicit yes or no about the surface or fryer, today. “It should be fine” does not
              count.
            </p>
          </article>
          <article className="kg-landing-q">
            <p className="code">Q-SERV-02</p>
            <p className="q">“What is the serving size on the pack you have?”</p>
            <p className="what">
              What counts: The number printed on your pack. Brands restate servings between formats, so ours may
              not match yours.
            </p>
          </article>
        </div>
        <div className="kg-landing-actions">
          <Link className="kg-btn" href="/questions">
            View the question library
          </Link>
          <Link className="kg-btn quiet" href="/developers">
            Read the API
          </Link>
        </div>
        <div className="kg-callout" style={{ maxWidth: 740, margin: "28px auto 0" }}>
          <strong>The answer gets written down, with a name and a time on it.</strong>
          <p>
            Save the check and you get a dated record anyone can open. Show it to the kitchen, send it to the
            school, keep it for the next time somebody asks. It is the only thing that writes anything down.
          </p>
        </div>
      </section>

      <section className="kg-landing-section paper">
        <h2>What&apos;s the catch?</h2>
        <p className="sub center">
          There isn&apos;t one for you. You are the person carrying the risk and holding none of the power, so
          you never pay and we never ask you for anything.
        </p>
        <div className="kg-grid-3">
          <article className="kg-landing-claim">
            <h3>Free, permanently</h3>
            <p>Not a trial, not a freemium tier that expires. Checking is free for households and always will be.</p>
          </article>
          <article className="kg-landing-claim">
            <h3>No account to check</h3>
            <p>No sign-up, no profile, no household to build. Type it, scan it, or photograph it and press check.</p>
          </article>
          <article className="kg-landing-claim">
            <h3>Nothing kept</h3>
            <p>Your check exists on your screen and nowhere else. It is written down only if you save it to share.</p>
          </article>
        </div>
        <p className="kg-eyebrow" style={{ marginTop: 28 }}>
          SIX THINGS WE DELIBERATELY DON&apos;T DO
        </p>
        <div className="kg-landing-donts">
          {DONT.map((d) => (
            <span key={d} className="chip">
              {d}
            </span>
          ))}
        </div>
        <p className="sub center" style={{ marginTop: 20, maxWidth: 720 }}>
          We rule claims. We never advise. The moment we start telling you what to eat, we have an interest in
          the answer, and a checker with an interest in the answer is not a checker.
        </p>
      </section>

      <section className="kg-landing-dev">
        <div>
          <h2>Building an agent that talks about food?</h2>
          <p>
            One tool call gives you all four answers with their sources and dates, for allergens and for numeric
            limits. A free key covers direct API and MCP access.
          </p>
        </div>
        <Link className="kg-btn lime" href="/developers">
          Read the docs
        </Link>
      </section>
    </div>
  );
}
