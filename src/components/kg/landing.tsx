"use client";

import Link from "next/link";
import type { LandingExamples } from "@/lib/kg/landing-data";
import { MustNotOmit } from "@/components/kg/primitives";
import { NutritionPanelTable, PackShot } from "@/components/kg/label-panels";
import { PARSE_MAX_CHARS, RESTRICTION_CHIPS } from "@/lib/kg/premise-parse";
import { usePremiseFlow } from "@/lib/kg/use-premise-flow";

/** Fallback picker, shown only when the parser cannot be reached. */
const DONT = [
  "No advice",
  "No meal plans",
  "No diets",
  "No groceries or prices",
  "No pantry",
  "No “is this healthy”",
] as const;

function verdictClass(verdict: string): string {
  if (verdict === "conflict_found") return "shut";
  if (verdict === "no_conflict_found") return "clear";
  if (verdict === "ask_one_question") return "ask";
  return "held";
}

/** Nothing on this site prints an em dash, including copy that arrives from the API. */
function noDash(text: string): string {
  return text.replace(/\s*—\s*/g, ", ");
}


/**
 * Canon copy. The relay rules are part of the product law, not phrasing, so
 * this is built here rather than typed by anyone: the URL cannot go missing
 * and the render rules survive into whatever the agent reports back.
 */
function chatGptPrompt(typed: string): string {
  const rules = typed.trim() || "ask me what my family can't eat";
  return (
    "Open https://www.knowngate.com in your browser and use it to check food for me. " +
    "The page gives your model context the tools; use them. " +
    `My rules: ${rules}. ` +
    "Report back exactly what the site returns: the verdict, its source, its date, and every line marked must not omit. " +
    'If it couldn\'t verify something, say that plainly; never the word "safe".'
  );
}

export function LandingPage({ examples }: { examples: LandingExamples }) {
  // The whole words-to-rules-to-check flow lives in the hook, shared with the
  // agent workspace so the two can never diverge on what a premise means.
  const {
    stage,
    text,
    setText,
    parsed,
    amounts,
    setAmounts,
    subject,
    setSubject,
    manual,
    toggleManual,
    parserDown,
    busy,
    error,
    onRead,
    onCheck,
    startOver,
    dropRestriction,
    dropThreshold,
  } = usePremiseFlow({ mode: "human" });

  const menu = examples.menu;

  return (
    <div className="kg-landing">
      <header className="kg-landing-hero">
        <h1>&ldquo;It&rsquo;s fine.&rdquo; Says who?</h1>
        <p className="lead">
          Tell us what your family can&rsquo;t eat, or how much is too much. We check the label, the menu and
          the kitchen, and show you what we found. When nobody knows, we tell you that too.
        </p>
      </header>

      <section className="kg-landing-form-wrap">
        <div className="kg-landing-form">
          {stage === "compose" ? (
            <form onSubmit={onRead}>
              <div className="kg-chatgpt-cta">
                <a
                  className="kg-chatgpt-btn"
                  href={`https://chatgpt.com/?q=${encodeURIComponent(chatGptPrompt(text))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Use ChatGPT instead
                </a>
                <p>
                  Opens ChatGPT with the task ready. Switch to work mode so its agent can come back here and
                  do the checking.
                </p>
              </div>
              <div className="kg-landing-composer">
                <input
                  id="kg-premise-input"
                  name="premise"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={PARSE_MAX_CHARS}
                  aria-label="What your family cannot eat, or a number to stay under"
                  placeholder="Tell us in your own words: “no peanuts, and keep sugar under 10g”"
                />
                <span className="kg-composer-icon" aria-hidden title="Scan a barcode">
                  BAR
                </span>
                <span className="kg-composer-icon" aria-hidden title="Upload a photo">
                  CAM
                </span>
                <button
                  type="submit"
                  id="kg-check-button"
                  className="kg-btn"
                  disabled={busy}
                  aria-label="Read my words into rules"
                >
                  {busy ? "Reading…" : "Check it"}
                </button>
              </div>
              {error ? <p className="kg-landing-error">{error}</p> : null}
              <div className="kg-landing-form-note">
                <span>We turn your words into exact rules you can see and edit before we check anything.</span>
                <span>We keep nothing unless you choose to save a record you can share.</span>
              </div>
            </form>
          ) : (
            <form onSubmit={onCheck} className="kg-confirm">
              <div className="kg-confirm-head">
                <p className="kg-eyebrow">CHECK THIS, AND ONLY THIS</p>
                <button type="button" className="kg-confirm-back" onClick={startOver}>
                  Start again
                </button>
              </div>

              {parserDown ? (
                <>
                  <p className="kg-confirm-note">
                    We could not read your words just now, so pick the rules by hand. Nothing has been checked
                    yet.
                  </p>
                  <div className="kg-chip-row">
                    {RESTRICTION_CHIPS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        className={`chip${manual.includes(c) ? " on" : ""}`}
                        aria-pressed={manual.includes(c)}
                        onClick={() => toggleManual(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {parsed?.note ? <p className="kg-confirm-note">{noDash(parsed.note)}</p> : null}

                  {parsed?.restrictions.length ? (
                    <div className="kg-confirm-row">
                      <span className="kg-eyebrow">CANNOT BE IN IT</span>
                      <div className="kg-chip-row">
                        {parsed.restrictions.map((r) => (
                          <span key={r} className="chip on">
                            {r.replace(/_/g, " ")}
                            <button type="button" aria-label={`Remove ${r}`} onClick={() => dropRestriction(r)}>
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {parsed?.thresholds.length ? (
                    <div className="kg-confirm-row">
                      <span className="kg-eyebrow">MUST STAY UNDER</span>
                      <div className="kg-chip-row">
                        {parsed.thresholds.map((t) => (
                          <span key={t.nutrient} className="chip on">
                            {t.nutrient} under {t.max}
                            {t.unit} per serving
                            <button
                              type="button"
                              aria-label={`Remove the ${t.nutrient} rule`}
                              onClick={() => dropThreshold(t.nutrient)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {parsed?.needs_number.map((need) => (
                    <div className="kg-confirm-row" key={need.nutrient}>
                      <span className="kg-eyebrow">{need.nutrient.toUpperCase()} NEEDS A NUMBER</span>
                      <p className="kg-confirm-said">
                        You said &ldquo;{need.said}&rdquo;. We will not guess a number for you, so give us one
                        or leave it out.
                      </p>
                      <label className="kg-confirm-amount">
                        <span>Under</span>
                        <input
                          inputMode="numeric"
                          value={amounts[need.nutrient] ?? ""}
                          onChange={(e) =>
                            setAmounts((a) => ({ ...a, [need.nutrient]: e.target.value }))
                          }
                          aria-label={`Maximum ${need.nutrient} per serving`}
                        />
                        <span>{need.nutrient === "sodium" ? "mg" : "g"} per serving</span>
                      </label>
                    </div>
                  ))}

                  {parsed?.unparsed.length ? (
                    <p className="kg-confirm-unparsed">
                      We did not use: {parsed.unparsed.join("; ")}. Only the rules above will be checked.
                    </p>
                  ) : null}
                </>
              )}

              <div className="kg-confirm-row">
                <span className="kg-eyebrow">WHAT TO CHECK</span>
                <input
                  id="kg-subject-input"
                  name="subject"
                  className="kg-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="A product name, a barcode, or a dish"
                  aria-label="What to check"
                />
              </div>

              {error ? <p className="kg-landing-error">{error}</p> : null}
              <button
                type="submit"
                id="kg-confirm-button"
                className="kg-btn"
                disabled={busy}
                aria-label="Run the check"
              >
                {busy ? "Checking…" : "Check it"}
              </button>
              <div className="kg-landing-form-note">
                <span>We keep nothing unless you choose to save a record you can share.</span>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="kg-landing-section">
        <h2>Whose job is it to check?</h2>
        <p className="sub center">
          Nobody&rsquo;s. Everyone else does fine if no one checks. You are the one who pays if it goes wrong.
        </p>
        <div className="kg-grid-4">
          <article className="kg-landing-claim">
            <p className="kg-eyebrow">THE LABEL</p>
            <strong>&ldquo;Low sodium.&rdquo;</strong>
            <p>
              The claim on the front of the pack. Almost nobody checks it against the numbers on the back.
            </p>
          </article>
          <article className="kg-landing-claim">
            <p className="kg-eyebrow">THE MENU</p>
            <strong>&ldquo;No nuts in this one.&rdquo;</strong>
            <p>Written to make you order it, not to tell you what is really in it.</p>
          </article>
          <article className="kg-landing-claim">
            <p className="kg-eyebrow">THE HOST</p>
            <strong>&ldquo;It&rsquo;s fine, I made it myself.&rdquo;</strong>
            <p>Said with love. But it&rsquo;s from memory, not from the four labels in the bin.</p>
          </article>
          <article className="kg-landing-claim">
            <p className="kg-eyebrow">THE AGENT</p>
            <strong>&ldquo;That looks safe for you.&rdquo;</strong>
            <p>Sounds just as confident whether it actually knows or not.</p>
          </article>
        </div>
        <div className="kg-landing-dark-band">
          <strong>&ldquo;Verified&rdquo; has been sold to you before.</strong>
          <p>
            A blue check tells you who is talking. It doesn&rsquo;t tell you whether what they said is true.
            With food, being wrong costs more.
          </p>
        </div>
      </section>

      <section className="kg-landing-section paper">
        <h2>What can I ask it?</h2>
        <p className="sub center">
          Ask two kinds of question: &ldquo;this can&rsquo;t be in my food&rdquo; or &ldquo;keep this under a
          number.&rdquo; We check exactly what you asked. Nothing more, nothing less.
        </p>
        <div className="kg-grid-2">
          <article className="kg-landing-ask-card">
            <h3>What can&rsquo;t be in it</h3>
            <p>&ldquo;No sesame.&rdquo; &ldquo;No cashews.&rdquo; Anything your family can&rsquo;t have.</p>
            <div className="kg-axes">
              <div className="kg-axis covered">
                <span className="axis-label">
                  <span className="dot" aria-hidden />
                  Composition
                </span>
                <p>What&rsquo;s in it, according to the label</p>
              </div>
              <div className="kg-axis covered">
                <span className="axis-label">
                  <span className="dot" aria-hidden />
                  Preparation
                </span>
                <p>Shared fryers, shared boards, how it is actually made</p>
              </div>
            </div>
            <p className="note">We need both. An ingredient list on its own never gets a yes.</p>
          </article>
          <article className="kg-landing-ask-card">
            <h3>What it must stay under</h3>
            <p>
              &ldquo;Under 600mg of salt.&rdquo; &ldquo;Under 10g of sugar.&rdquo; Any number, per serving.
            </p>
            <div className="kg-axes">
              <div className="kg-axis covered">
                <span className="axis-label">
                  <span className="dot" aria-hidden />
                  The panel
                </span>
                <p>What the nutrition panel says, per serving, with the date we read it</p>
              </div>
            </div>
            <p className="note">One source: the panel. It&rsquo;s under your number or it isn&rsquo;t.</p>
          </article>
        </div>
        <p className="kg-landing-center-line">
          Either way you get the same thing back: what we found, where it came from, and when we read it.
        </p>
      </section>

      <section className="kg-landing-section">
        <h2>One item, one menu, or a whole week.</h2>
        <p className="sub center">
          Same check, same four answers, for one product, a whole menu, or a week of meals.
        </p>

        <p className="kg-eyebrow" style={{ textAlign: "left", width: "100%", maxWidth: 1100 }}>
          A PRODUCT · AGAINST A NUMBER · SODIUM UNDER 600 MG PER SERVING
        </p>
        <div className="kg-grid-3 kg-landing-examples">
          {examples.products.map((p) => {
            const cls = verdictClass(p.verdict);
            return (
              <article key={p.upc} className={`kg-landing-example ${cls}`}>
                <PackShot src={p.imageUrl} alt={p.name} className="kg-example-shot" />
                <NutritionPanelTable nutrition={p.nutrition} highlight="sodium" />
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
              A MENU · AGAINST AN ALLERGEN · {menu.venueName.toUpperCase()} ·{" "}
              {menu.premiseLine.toUpperCase()}
            </p>
            <div className="kg-landing-menu-card">
              <div className="kg-landing-menu-head">
                <div>
                  <strong>{menu.venueName}</strong>
                  <p>
                    {menu.itemCount} items ruled · {menu.counts.conflict_found} conflict found ·{" "}
                    {menu.counts.ask_one_question} ask one question
                    {menu.readDate ? ` · read ${menu.readDate}` : ""}
                  </p>
                </div>
                {menu.sourceName ? <span className="chip">{menu.sourceName}</span> : null}
              </div>
              <MustNotOmit items={menu.mustNotOmit} />
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
            Up to 25 things at once: a recipe, a shopping basket, seven days of meals. One answer per item,
            each with its date.
          </p>
          <Link className="kg-btn quiet" href="/developers">
            check_plan
          </Link>
        </div>
      </section>

      <section className="kg-landing-section paper">
        <h2>What if it doesn&rsquo;t know?</h2>
        <p className="sub center">
          It tells you. Four answers can come back, and two of them are honest ways of saying &ldquo;we
          don&rsquo;t know.&rdquo; That&rsquo;s the part everyone else leaves out.
        </p>
        <div className="kg-grid-4">
          <article className="kg-landing-verdict clear">
            <span className="dot clear" aria-hidden />
            <strong>No conflict found</strong>
            <p>Everything checked out, and we show you the source and the date we read it.</p>
          </article>
          <article className="kg-landing-verdict shut">
            <span className="dot shut" aria-hidden />
            <strong>Conflict found</strong>
            <p>It&rsquo;s in there, or it&rsquo;s over your number. Named, with its source and date.</p>
          </article>
          <article className="kg-landing-verdict ask">
            <span className="dot ask" aria-hidden />
            <strong>Ask one question</strong>
            <p>One thing is missing. We give you the exact question that closes it.</p>
          </article>
          <article className="kg-landing-verdict held">
            <span className="dot held" aria-hidden />
            <strong>Couldn&rsquo;t verify</strong>
            <p>Nobody can answer this one. We say so instead of guessing.</p>
          </article>
        </div>
        <div className="kg-grid-3" style={{ marginTop: 20 }}>
          <article className="kg-landing-claim">
            <strong>The rules are published</strong>
            <p>
              What counts as proof, in full, at knowngate.com/standard. You can check our reasoning, not only
              our answer.
            </p>
          </article>
          <article className="kg-landing-claim">
            <strong>So is how often we refuse</strong>
            <p>
              A checker that always says yes is worth nothing. We publish how often we say &ldquo;we
              don&rsquo;t know&rdquo;, and we do not try to shrink it.
            </p>
          </article>
          <article className="kg-landing-claim">
            <strong>We published our own mistake</strong>
            <p>
              In August we found 63,601 of our own records reading &ldquo;may contain&rdquo; as &ldquo;contains
              &rdquo;. We fixed it and said so publicly.
            </p>
          </article>
        </div>
        <div className="kg-landing-dark-band">
          <strong>Unknown counts as no.</strong>
          <p>
            You can&rsquo;t turn that off. The word &ldquo;safe&rdquo; never appears here. We show you what we
            found; you decide.
          </p>
        </div>
      </section>

      <section className="kg-landing-section">
        <h2>Then what do I do?</h2>
        <p className="sub center">
          When something is missing, we hand you the exact question to ask, and tell you what a real answer
          sounds like.
        </p>
        <div className="kg-grid-2">
          <article className="kg-landing-q">
            <p className="kg-eyebrow">TO A KITCHEN</p>
            <span className="code">Q-PREP-11</span>
            <strong>&ldquo;Is the fryer shared with anything breaded in sesame?&rdquo;</strong>
            <p>
              What counts: a clear yes or no about today. &ldquo;It should be fine&rdquo; doesn&rsquo;t count.
            </p>
          </article>
          <article className="kg-landing-q">
            <p className="kg-eyebrow">TO A PACK</p>
            <span className="code">Q-SERV-01</span>
            <strong>&ldquo;What is the serving size on the pack you have?&rdquo;</strong>
            <p>
              What counts: the number printed on your pack. Brands change serving sizes between formats.
            </p>
          </article>
        </div>
        <div className="kg-landing-dark-band">
          <strong>The answer gets written down, with a name and a time on it.</strong>
          <p>
            Save a check and you get a dated record anyone can open. Show the kitchen, send it to school, keep
            it for next time. It is the only thing we ever keep, and only because you asked.
          </p>
        </div>
        <div className="kg-landing-actions">
          <Link className="kg-btn" href="/check">
            Show the kitchen
          </Link>
          <Link className="kg-btn quiet" href="/check">
            Send it on
          </Link>
        </div>
      </section>

      <section className="kg-landing-section paper">
        <h2>What&rsquo;s the catch?</h2>
        <p className="sub center">
          There isn&rsquo;t one, not for you. You are the one carrying the risk, so you never pay and we never
          ask you for anything.
        </p>
        <div className="kg-grid-3">
          <article className="kg-landing-claim">
            <strong>Free, permanently</strong>
            <p>Not a trial. Checking is free for families and always will be.</p>
          </article>
          <article className="kg-landing-claim">
            <strong>No account to check</strong>
            <p>No sign-up, no profile. Type it, scan it, or photograph it, then press check.</p>
          </article>
          <article className="kg-landing-claim">
            <strong>Nothing kept</strong>
            <p>Your check lives on your screen and nowhere else, unless you save it to share.</p>
          </article>
        </div>
        <h3 className="kg-landing-donts-head">Six things we deliberately don&rsquo;t do</h3>
        <p className="sub center">
          We check claims. We never give advice. The moment we tell you what to eat, we would have a stake in
          the answer, and a checker with a stake in the answer is worthless.
        </p>
        <div className="kg-landing-donts">
          {DONT.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </section>

      <section className="kg-landing-dev">
        <div>
          <strong>Building an agent that talks about food?</strong>
          <p>
            One call returns the answer with its source and date, for allergens and for numbers. A free key
            covers API and MCP access.
          </p>
        </div>
        <Link className="kg-dev-cta" href="/developers">
          Read the docs
        </Link>
      </section>
    </div>
  );
}
