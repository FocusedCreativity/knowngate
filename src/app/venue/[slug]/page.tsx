import { notFound } from "next/navigation";
import { EvidenceCheckIsland } from "@/components/evidence/evidence-check-island";
import { checkPlace } from "@/lib/knowngate/api";

export function generateStaticParams() { return [{ slug: "panda-express" }]; }
export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; if (slug !== "panda-express") notFound(); const place = await checkPlace({ restrictions: [{ key: "peanut" }], venue: { name: "Panda Express" } });
  return <main className="ruling-room"><header className="masthead"><div><p className="eyebrow">KNOWNGATE / VENUE EVIDENCE</p><h1>{place.venue.name}</h1></div><p className="doctrine">Published chart.<br />Read date shown.</p></header><section className="panel premise-panel"><p className="step">CHART / {place.chart.replaceAll("_", " ")}</p><h2>{place.venue.chain}</h2><p>{place.verdict_counts.conflict} conflict · {place.verdict_counts.ask_one_question} ask one question</p>{place.notable.map((item) => <article className="notable" key={item.subject.value}><strong>{item.subject.name}</strong><p>{item.question ?? item.verdict.replaceAll("_", " ")}</p></article>)}<p className="source">SOURCE / {place.source.name} / READ {place.source.read_date}</p></section><EvidenceCheckIsland subject={{ kind: "menu_item", value: place.notable[0]?.subject.value ?? "Chow Fun", venue: place.venue.name }} /></main>;
}
