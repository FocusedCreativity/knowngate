"use client";

import { FormEvent, useEffect, useReducer, useRef, useState } from "react";
import { boardReducer, initialBoardState } from "@/lib/board/reducer";
import { compactBoard } from "@/lib/knowngate/compact";
import { FDA9_KEYS, type Fda9Key, type ItemResult, type PlaceResult, type Restriction } from "@/lib/knowngate/contracts";
import { knownGateClient } from "@/lib/knowngate/client";
import { compactItem, compactPlace } from "@/lib/knowngate/compact";
import { parseCheckItemRequest, parseCheckPlaceRequest, parsePremise } from "@/lib/knowngate/validation";
import { rulingRoomSchemas } from "@/lib/webmcp/schemas";
import { useWebMcpTools } from "@/lib/webmcp/use-webmcp-tools";

const LABELS: Record<Fda9Key, string> = { milk: "Milk", egg: "Egg", fish: "Fish", shellfish: "Shellfish", tree_nut: "Tree nuts", peanut: "Peanut", wheat: "Wheat", soy: "Soy", sesame: "Sesame" };
const uid = () => crypto.randomUUID();
const restrictionText = (items: Restriction[]) => items.map((item) => item.note ?? LABELS[item.key as Fda9Key] ?? item.key).join(" · ");

export function RulingRoom() {
  const [state, dispatch] = useReducer(boardReducer, initialBoardState);
  const [selected, setSelected] = useState<Fda9Key[]>(["peanut", "sesame"]);
  const [other, setOther] = useState("");
  const [freezeRequested, setFreezeRequested] = useState(false);
  const [freezeUrl, setFreezeUrl] = useState<string | null>(null);
  const confirmed = state.premise.confirmed;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useWebMcpTools([
    { name: "propose_premise", description: "Propose a household premise for visible human confirmation.", inputSchema: rulingRoomSchemas.propose_premise, async execute(input) {
      try { const premise = parsePremise(input); dispatch({ type: "proposePremise", premise }); return { status: "awaiting_human_confirmation", premise }; }
      catch (error) { return errorBody(error); }
    } },
    { name: "check_item", description: "Rule one food subject against the confirmed household premise.", inputSchema: rulingRoomSchemas.check_item, async execute(input) {
      try { const premise = stateRef.current.premise.confirmed; if (!premise) return { error: { code: "premise_not_confirmed", message: "Premise not confirmed — call propose_premise first." } }; const request = parseCheckItemRequest({ ...(input as object), restrictions: premise.restrictions }); const id = uid(); dispatch({ type: "startCheck", id, kind: "item", label: request.subject.value, eventId: uid() }); const result = await knownGateClient.checkItem(request); dispatch({ type: "completeCheck", id, result, eventId: uid() }); return compactItem(result); } catch (error) { return errorBody(error); }
    } },
    { name: "check_place", description: "Rule a venue's published evidence against the confirmed household premise.", inputSchema: rulingRoomSchemas.check_place, async execute(input) {
      try { const premise = stateRef.current.premise.confirmed; if (!premise) return { error: { code: "premise_not_confirmed", message: "Premise not confirmed — call propose_premise first." } }; const value = input as { venue?: string; location?: string }; const request = parseCheckPlaceRequest({ restrictions: premise.restrictions, venue: { name: value.venue, ...(value.location ? { location: value.location } : {}) } }); const id = uid(); dispatch({ type: "startCheck", id, kind: "place", label: request.venue.name, eventId: uid() }); const result = await knownGateClient.checkPlace(request); dispatch({ type: "completeCheck", id, result, eventId: uid() }); return compactPlace(result); } catch (error) { return errorBody(error); }
    } },
    { name: "get_board", description: "Read the current confirmed premise and visible evidence ledger.", inputSchema: rulingRoomSchemas.empty, annotations: { readOnlyHint: true }, async execute() { const current = stateRef.current; return compactBoard(current.premise.confirmed, current.entries.flatMap((entry) => entry.result ? [entry.result] : [])); } },
    { name: "freeze_check", description: "Request visible human confirmation to freeze the current evidence ledger.", inputSchema: rulingRoomSchemas.empty, async execute() { setFreezeRequested(true); return { status: "awaiting_human_confirmation", message: "A human must confirm freeze in the page." }; } },
  ]);

  function propose(event: FormEvent) {
    event.preventDefault();
    const restrictions: Restriction[] = selected.map((key) => ({ key }));
    if (other.trim()) restrictions.push({ key: "other", note: other.trim() });
    if (restrictions.length) dispatch({ type: "proposePremise", premise: { restrictions } });
  }

  async function checkItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = String(data.get("item") ?? "").trim();
    const kind = String(data.get("kind")) as "upc" | "product_query" | "menu_item";
    const venue = String(data.get("venue") ?? "").trim();
    const id = uid();
    dispatch({ type: "startCheck", id, kind: "item", label: value || "item", eventId: uid() });
    if (!confirmed || !value) return;
    try {
      const result = await knownGateClient.checkItem({ restrictions: confirmed.restrictions, subject: { kind, value, ...(kind === "menu_item" ? { venue: venue || "Panda Express" } : {}) } });
      dispatch({ type: "completeCheck", id, result, eventId: uid() });
    } catch (error) { dispatch({ type: "failCheck", id, message: error instanceof Error ? error.message : "Item check failed", eventId: uid() }); }
  }

  async function checkPlace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("place") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const id = uid();
    dispatch({ type: "startCheck", id, kind: "place", label: name || "place", eventId: uid() });
    if (!confirmed || !name) return;
    try {
      const result = await knownGateClient.checkPlace({ restrictions: confirmed.restrictions, venue: { name, ...(location ? { location } : {}) } });
      dispatch({ type: "completeCheck", id, result, eventId: uid() });
    } catch (error) { dispatch({ type: "failCheck", id, message: error instanceof Error ? error.message : "Place check failed", eventId: uid() }); }
  }

  async function freeze() {
    if (!confirmed) return;
    const results = state.entries.flatMap((entry) => entry.result ? [entry.result] : []);
    if (!results.length) return;
    const record = await knownGateClient.freeze({ premise: confirmed, results });
    setFreezeUrl(record.url); setFreezeRequested(false);
  }

  return <main className="ruling-room">
    <header className="masthead"><div><p className="eyebrow">KNOWNGATE / RULING ROOM</p><h1>Every answer,<br />with its source.</h1></div><p className="doctrine">Agent proposes.<br />Page rules.<br />Human owns the premise.</p></header>
    <section className="panel premise-panel" aria-labelledby="premise-title">
      <div className="section-head"><div><p className="step">01 / PREMISE</p><h2 id="premise-title">What must this household avoid?</h2></div><span className={`status ${state.premise.status}`}>{state.premise.status}</span></div>
      <form onSubmit={propose}><fieldset className="restriction-grid"><legend className="sr-only">FDA major allergens</legend>{FDA9_KEYS.map((key) => <label key={key}><input type="checkbox" checked={selected.includes(key)} onChange={() => setSelected((values) => values.includes(key) ? values.filter((value) => value !== key) : [...values, key])} /> {LABELS[key]}</label>)}</fieldset><label className="field">Other restriction <input value={other} onChange={(event) => setOther(event.target.value)} placeholder="e.g. mustard — free text" /></label><button type="submit">Propose premise</button></form>
      {state.premise.status === "proposed" && state.premise.draft && <div className="human-gate" role="alert"><div><strong>Human confirmation required</strong><p>{restrictionText(state.premise.draft.restrictions)}</p></div><div className="button-row"><button className="secondary" onClick={() => dispatch({ type: "cancelPremise" })}>Cancel</button><button onClick={() => dispatch({ type: "confirmPremise", eventId: uid() })}>Confirm premise</button></div></div>}
      {confirmed && state.premise.status === "confirmed" && <p className="confirmed-line"><span>CONFIRMED BY HUMAN</span> {restrictionText(confirmed.restrictions)}</p>}
    </section>
    <section className="work-grid">
      <div className="panel"><p className="step">02 / CHECK</p><h2>Bring a subject</h2><form className="check-form" onSubmit={checkItem}><label className="field">Item <input name="item" defaultValue="0000822910553" required /></label><label className="field">Kind <select name="kind" defaultValue="upc"><option value="upc">UPC</option><option value="product_query">Product query</option><option value="menu_item">Menu item (try Orange Chicken)</option></select></label><label className="field">Venue for menu items <input name="venue" defaultValue="Panda Express" /></label><button disabled={!confirmed}>Check item</button></form><div className="rule" /><form className="check-form" onSubmit={checkPlace}><label className="field">Place <input name="place" defaultValue="Panda Express" required /></label><label className="field">Location <input name="location" defaultValue="Denver" /></label><button disabled={!confirmed}>Check place</button></form></div>
      <div className="panel ledger"><div className="section-head"><div><p className="step">03 / RULINGS</p><h2>Evidence ledger</h2></div><div className="toggle"><button className={state.view === "human" ? "active" : ""} onClick={() => dispatch({ type: "setView", view: "human" })}>Human</button><button className={state.view === "agent" ? "active" : ""} onClick={() => dispatch({ type: "setView", view: "agent" })}>Agent</button></div></div>{state.view === "agent" ? <pre className="agent-json">{JSON.stringify(compactBoard(confirmed, state.entries.flatMap((entry) => entry.result ? [entry.result] : [])), null, 2)}</pre> : <div className="entries">{!state.entries.length && <p className="empty">No rulings yet. Confirm the premise, then check an item or place.</p>}{state.entries.map((entry) => <article className={`entry ${entry.status}`} key={entry.id}><p className="entry-meta">{entry.kind} / {entry.status}</p><h3>{entry.label}</h3>{entry.error && <p className="error">{entry.error}</p>}{entry.result && ("verdict" in entry.result ? <ItemRuling result={entry.result} /> : <PlaceRuling result={entry.result} />)}</article>)}</div>}</div>
    </section>
    <section className="activity"><p className="step">ACTIVITY</p>{state.activity.slice(-4).map((item) => <p className={item.tone} key={item.id}>{item.message}</p>)}</section>
    <section className="panel freeze-panel"><p className="step">04 / FREEZE</p><h2>Make a dated record</h2><p>A human must confirm before this ledger becomes read-only.</p>{freezeUrl ? <p><a href={freezeUrl}>Open frozen record →</a></p> : freezeRequested ? <div className="human-gate"><strong>Confirm freeze of the current visible ledger?</strong><div className="button-row"><button className="secondary" onClick={() => setFreezeRequested(false)}>Cancel</button><button onClick={() => void freeze()}>Confirm freeze</button></div></div> : <button disabled={!confirmed || !state.entries.some((entry) => entry.result)} onClick={() => setFreezeRequested(true)}>Request freeze</button>}</section>
  </main>;
}

function ItemRuling({ result }: { result: ItemResult }) { return <div><p className={`verdict verdict-${result.verdict}`}>{result.verdict.replaceAll("_", " ")}</p>{result.question && <p className="question">Ask: {result.question}</p>}{result.conflicts.map((conflict) => <p key={conflict.restriction}><strong>{conflict.restriction}:</strong> {conflict.evidence}</p>)}<Source result={result} /></div>; }
function PlaceRuling({ result }: { result: PlaceResult }) { return <div><p className="verdict">{result.chart.replaceAll("_", " ")}</p><p>{result.verdict_counts.conflict} conflict · {result.verdict_counts.ask_one_question} ask one question · {result.verdict_counts.no_conflict} no conflict</p>{result.notable.map((item) => <div className="notable" key={item.subject.value}><strong>{item.subject.name ?? item.subject.value}</strong>{item.question && <p className="question">Ask: {item.question}</p>}</div>)}<Source result={result} /></div>; }
function Source({ result }: { result: ItemResult | PlaceResult }) { return <p className="source">SOURCE / {result.source.url ? <a href={result.source.url} target="_blank" rel="noreferrer">{result.source.name}</a> : result.source.name} / READ {result.source.read_date}</p>; }
function errorBody(error: unknown) { return { error: { code: "invalid_input", message: error instanceof Error ? error.message : "KnownGate could not process that input." } }; }
