import { notFound } from "next/navigation";
import { getFreeze } from "@/lib/knowngate/api";
import { isFreezeId } from "@/lib/knowngate/validation";

export default async function FrozenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!isFreezeId(id)) notFound(); const frozen = await getFreeze(id); if (!frozen) notFound();
  return <main className="ruling-room"><header className="masthead"><div><p className="eyebrow">KNOWNGATE / FROZEN CHECK</p><h1>Frozen record</h1></div><p className="doctrine">Read-only evidence.<br />This page does not update.</p></header><section className="panel premise-panel"><p className="step">FROZEN {new Date(frozen.frozen_at).toLocaleString()}</p><h2>Checked against: {frozen.payload.premise.restrictions.map((item) => item.note ?? item.key).join(" · ")}</h2><p>These restrictions came from the household, not from KnownGate.</p></section><section className="panel premise-panel"><p className="step">RESULTS / {frozen.ck_id}</p>{frozen.payload.results.map((result, index) => <article className="entry" key={index}>{"verdict" in result ? <><p className={`verdict verdict-${result.verdict}`}>{result.verdict.replaceAll("_", " ")}</p><h3>{result.subject.name ?? result.subject.value}</h3><p className="source">SOURCE / {result.source.name} / READ {result.source.read_date}</p></> : <><p className="verdict">{result.chart.replaceAll("_", " ")}</p><h3>{result.venue.name}</h3><p className="source">SOURCE / {result.source.name} / READ {result.source.read_date}</p></>}</article>)}</section></main>;
}
