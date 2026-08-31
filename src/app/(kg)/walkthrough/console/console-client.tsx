"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConsoleDemo } from "@/components/kg/console-demo";

type KeysState = "none" | "shown_once" | "active";

function Inner() {
  const sp = useSearchParams();
  const raw = sp.get("keys");
  const keys: KeysState =
    raw === "shown_once" || raw === "active" || raw === "none" ? raw : "none";
  return <ConsoleDemo keys={keys} />;
}

export default function WalkthroughConsoleClient() {
  return (
    <Suspense fallback={<div className="kg-console" />}>
      <Inner />
    </Suspense>
  );
}
