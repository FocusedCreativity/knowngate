export function LiveToken({
  label,
  size = "sm",
}: {
  label: string;
  size?: "sm" | "lg";
}) {
  const text = label.startsWith("[") ? label : `[${label}]`;
  const isCorpus = text.includes("CORPUS");
  return (
    <span className={`kg-live-token${size === "lg" ? " lg" : ""}${isCorpus ? " corpus" : ""}`}>
      {text}
    </span>
  );
}
