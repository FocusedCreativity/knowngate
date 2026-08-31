import { Suspense } from "react";
import "../kg.css";
import { KgShell } from "@/components/kg/shell";

export default function KgLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="kg-root"><main className="kg-main" /></div>}>
      <KgShell>{children}</KgShell>
    </Suspense>
  );
}
