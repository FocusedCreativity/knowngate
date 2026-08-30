import results from "../../../evals/results.json";

export default function AxPage() {
  return <main className="ruling-room"><header className="masthead"><div><p className="eyebrow">KNOWNGATE / AX</p><h1>Evidence of behavior</h1></div><p className="doctrine">Measured locally.<br />Never invented.</p></header><section className="panel premise-panel"><p className="step">EVALUATION RUN</p><h2>{results.measured.passed} / {results.measured.scenarios} scenarios passed</h2><p className="source">GENERATED / {results.generated_at}</p><p>Browser-agent metrics: {results.browser_agent_metrics}</p>{results.scenarios.length ? <ul>{results.scenarios.map((scenario, index) => <li key={index}>{scenario.tool} / {scenario.case}: {scenario.pass ? "pass" : "fail"} — {scenario.recovery}</li>)}</ul> : <p>Run <code>npm run evals</code> to generate measured local results.</p>}</section></main>;
}
