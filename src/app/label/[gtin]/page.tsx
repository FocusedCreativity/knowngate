import { notFound } from "next/navigation";
import { EvidenceCheckIsland } from "@/components/evidence/evidence-check-island";
import { getLabel } from "@/lib/knowngate/api";

export function generateStaticParams() { return [{ gtin: "0000822910553" }]; }
export default async function LabelPage({ params }: { params: Promise<{ gtin: string }> }) {
  const { gtin } = await params; const label = await getLabel(gtin); if (!label) notFound();
  return <main className="ruling-room"><header className="masthead"><div><p className="eyebrow">KNOWNGATE / LABEL EVIDENCE</p><h1>{label.name}</h1></div><p className="doctrine">Source first.<br />Finding, not promise.</p></header><section className="panel premise-panel"><p className="step">LABEL / {label.gtin}</p><h2>{label.brand}</h2><p>{label.statement_read ? "A product statement was read." : "No readable product statement."}</p>{label.findings.map((finding) => <article className="notable" key={finding.allergen_token}><strong>{finding.allergen_token}</strong><p>{finding.status.replaceAll("_", " ")} — {finding.matched_text}</p></article>)}<p className="source">SOURCE / {label.source.name} / READ {label.source.read_date}</p></section><EvidenceCheckIsland subject={{ kind: "upc", value: label.gtin }} /></main>;
}
