/**
 * The frames use two delimiters, and they mean different things.
 *
 *   [LIVE], [CORPUS…] a literal chip that marks where a value came from
 *   {N}               a value placeholder that renders as written, because
 *                     the free-tier call count is not settled yet
 *
 * Placeholders the page can actually resolve — {Q_COUNT}, {TOOL_COUNT} — are
 * substituted at their call sites and never reach this component.
 */
const isProvenanceMarker = (name: string) => name === "LIVE" || name.startsWith("CORPUS");

export function LiveToken({
  label,
  size = "sm",
}: {
  label: string;
  size?: "sm" | "lg";
}) {
  const name = label.replace(/^[[{]/, "").replace(/[\]}]$/, "");
  const text = isProvenanceMarker(name) ? `[${name}]` : `{${name}}`;
  const isCorpus = name.includes("CORPUS");
  return (
    <span className={`kg-live-token${size === "lg" ? " lg" : ""}${isCorpus ? " corpus" : ""}`}>
      {text}
    </span>
  );
}
